"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const hubspot_service_1 = require("../hubspot/hubspot.service");
const wix_service_1 = require("../wix/wix.service");
const mappings_service_1 = require("../mappings/mappings.service");
const uuid_1 = require("uuid");
let SyncService = SyncService_1 = class SyncService {
    constructor(prisma, hubspotService, wixService, mappingsService) {
        this.prisma = prisma;
        this.hubspotService = hubspotService;
        this.wixService = wixService;
        this.mappingsService = mappingsService;
        this.logger = new common_1.Logger(SyncService_1.name);
        this.activeSyncIds = new Set();
    }
    markSyncActive(syncId) {
        this.activeSyncIds.add(syncId);
        setTimeout(() => this.activeSyncIds.delete(syncId), 30_000);
    }
    isSyncLoop(syncId) {
        return this.activeSyncIds.has(syncId);
    }
    async syncWixToHubspot(userId, wixContactId, sourceSyncId) {
        const syncId = (0, uuid_1.v4)();
        if (sourceSyncId && this.isSyncLoop(sourceSyncId)) {
            this.logger.log(`Skipping loop sync for wixContactId=${wixContactId}`);
            return { syncId, status: 'skipped', reason: 'loop_detected' };
        }
        try {
            const wixContact = await this.wixService.getContactById(wixContactId);
            if (!wixContact) {
                return this.logSync(userId, syncId, 'wix', 'wix_to_hubspot', 'failed', wixContactId, 'Wix contact not found');
            }
            const existingMapping = await this.prisma.contactMapping.findUnique({
                where: { userId_wixContactId: { userId, wixContactId } },
            });
            if (existingMapping?.lastSyncedAt && existingMapping.lastSyncSource === 'wix') {
                const wixUpdated = wixContact.updatedDate ? new Date(wixContact.updatedDate) : null;
                if (wixUpdated && wixUpdated <= existingMapping.lastSyncedAt) {
                    return { syncId, status: 'skipped', reason: 'no_changes' };
                }
            }
            const hubspotProperties = await this.mappingsService.buildHubspotPropertiesFromWix(userId, this.flattenWixContact(wixContact));
            if (Object.keys(hubspotProperties).length === 0) {
                return { syncId, status: 'skipped', reason: 'no_mapped_fields' };
            }
            this.markSyncActive(syncId);
            let hubspotContactId = existingMapping?.hubspotContactId;
            if (hubspotContactId) {
                await this.hubspotService.updateContact(userId, hubspotContactId, hubspotProperties);
            }
            else {
                const created = await this.hubspotService.upsertContact(userId, hubspotProperties);
                hubspotContactId = created.id;
            }
            await this.prisma.contactMapping.upsert({
                where: { userId_wixContactId: { userId, wixContactId } },
                create: { userId, wixContactId, hubspotContactId, lastSyncedAt: new Date(), lastSyncSource: 'wix', lastSyncId: syncId },
                update: { hubspotContactId, lastSyncedAt: new Date(), lastSyncSource: 'wix', lastSyncId: syncId },
            });
            return this.logSync(userId, syncId, 'wix', 'wix_to_hubspot', 'success', wixContactId);
        }
        catch (err) {
            this.logger.error(`syncWixToHubspot failed: ${err.message}`);
            return this.logSync(userId, syncId, 'wix', 'wix_to_hubspot', 'failed', wixContactId, err.message);
        }
    }
    async syncHubspotToWix(userId, hubspotContactId, sourceSyncId) {
        const syncId = (0, uuid_1.v4)();
        if (sourceSyncId && this.isSyncLoop(sourceSyncId)) {
            this.logger.log(`Skipping loop sync for hubspotContactId=${hubspotContactId}`);
            return { syncId, status: 'skipped', reason: 'loop_detected' };
        }
        try {
            const hubspotContact = await this.hubspotService.getContactById(userId, hubspotContactId);
            if (!hubspotContact) {
                return this.logSync(userId, syncId, 'hubspot', 'hubspot_to_wix', 'failed', hubspotContactId, 'HubSpot contact not found');
            }
            const existingMapping = await this.prisma.contactMapping.findUnique({
                where: { userId_hubspotContactId: { userId, hubspotContactId } },
            });
            if (existingMapping?.lastSyncedAt && existingMapping.lastSyncSource === 'hubspot') {
                const hsUpdated = hubspotContact.updatedAt ? new Date(hubspotContact.updatedAt) : null;
                if (hsUpdated && hsUpdated <= existingMapping.lastSyncedAt) {
                    return { syncId, status: 'skipped', reason: 'no_changes' };
                }
            }
            const wixData = await this.mappingsService.buildWixContactFromHubspot(userId, hubspotContact.properties);
            if (Object.keys(wixData).length === 0) {
                return { syncId, status: 'skipped', reason: 'no_mapped_fields' };
            }
            this.markSyncActive(syncId);
            const wixContactInput = this.buildWixContactInput(wixData);
            let wixContactId = existingMapping?.wixContactId;
            if (wixContactId) {
                const existing = await this.wixService.getContactById(wixContactId);
                if (existing) {
                    await this.wixService.updateContact(wixContactId, existing.revision ?? '0', wixContactInput);
                }
            }
            else {
                const created = await this.wixService.upsertContact(wixContactInput);
                wixContactId = created.id;
            }
            await this.prisma.contactMapping.upsert({
                where: { userId_hubspotContactId: { userId, hubspotContactId } },
                create: { userId, wixContactId, hubspotContactId, lastSyncedAt: new Date(), lastSyncSource: 'hubspot', lastSyncId: syncId },
                update: { wixContactId, lastSyncedAt: new Date(), lastSyncSource: 'hubspot', lastSyncId: syncId },
            });
            return this.logSync(userId, syncId, 'hubspot', 'hubspot_to_wix', 'success', hubspotContactId);
        }
        catch (err) {
            const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            this.logger.error(`syncHubspotToWix failed: ${detail}`);
            return this.logSync(userId, syncId, 'hubspot', 'hubspot_to_wix', 'failed', hubspotContactId, detail);
        }
    }
    flattenWixContact(contact) {
        return {
            id: contact.id,
            'info.name.first': contact.info?.name?.first,
            'info.name.last': contact.info?.name?.last,
            'info.emails[0].email': contact.info?.emails?.items?.[0]?.email ?? contact.info?.emails?.[0]?.email,
            'info.phones[0].phone': contact.info?.phones?.items?.[0]?.phone ?? contact.info?.phones?.[0]?.phone,
            'info.addresses[0].city': contact.info?.addresses?.items?.[0]?.city ?? contact.info?.addresses?.[0]?.city,
            'info.addresses[0].country': contact.info?.addresses?.items?.[0]?.country ?? contact.info?.addresses?.[0]?.country,
            'info.company.name': contact.info?.company?.name,
            'info.jobTitle': contact.info?.jobTitle,
        };
    }
    buildWixContactInput(data) {
        const info = {};
        if (data['info.name.first'] || data['info.name.last']) {
            info.name = {
                first: data['info.name.first'],
                last: data['info.name.last'],
            };
        }
        if (data['info.emails[0].email']) {
            info.emails = { items: [{ email: data['info.emails[0].email'], tag: 'MAIN' }] };
        }
        if (data['info.phones[0].phone']) {
            info.phones = { items: [{ phone: data['info.phones[0].phone'], tag: 'MAIN' }] };
        }
        return { info };
    }
    async logSync(userId, syncId, source, direction, status, entityId, errorMsg) {
        await this.prisma.syncLog.create({
            data: { userId, syncId, source, direction, status, entityId, errorMsg },
        });
        return { syncId, status, reason: errorMsg };
    }
    async getSyncLogs(userId, limit = 50) {
        return this.prisma.syncLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hubspot_service_1.HubspotService,
        wix_service_1.WixService,
        mappings_service_1.MappingsService])
], SyncService);
//# sourceMappingURL=sync.service.js.map