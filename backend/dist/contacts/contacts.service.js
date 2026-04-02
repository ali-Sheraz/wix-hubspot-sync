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
var ContactsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const hubspot_service_1 = require("../hubspot/hubspot.service");
const wix_service_1 = require("../wix/wix.service");
const sync_service_1 = require("../sync/sync.service");
let ContactsService = ContactsService_1 = class ContactsService {
    constructor(prisma, hubspotService, wixService, syncService) {
        this.prisma = prisma;
        this.hubspotService = hubspotService;
        this.wixService = wixService;
        this.syncService = syncService;
        this.logger = new common_1.Logger(ContactsService_1.name);
    }
    async listContacts(userId) {
        const mappings = await this.prisma.contactMapping.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
        const results = await Promise.all(mappings.map(async (m) => {
            try {
                const hs = await this.hubspotService.getContactById(userId, m.hubspotContactId);
                return {
                    id: m.id,
                    wixContactId: m.wixContactId,
                    hubspotContactId: m.hubspotContactId,
                    firstName: hs?.properties?.firstname ?? '',
                    lastName: hs?.properties?.lastname ?? '',
                    email: hs?.properties?.email ?? '',
                    phone: hs?.properties?.phone ?? '',
                    lastSyncedAt: m.lastSyncedAt,
                    lastSyncSource: m.lastSyncSource,
                };
            }
            catch {
                return {
                    id: m.id,
                    wixContactId: m.wixContactId,
                    hubspotContactId: m.hubspotContactId,
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    lastSyncedAt: m.lastSyncedAt,
                    lastSyncSource: m.lastSyncSource,
                };
            }
        }));
        return results;
    }
    async createContact(userId, payload) {
        const { firstName, lastName, email, phone } = payload;
        const hsContact = await this.hubspotService.upsertContact(userId, {
            email,
            firstname: firstName,
            lastname: lastName,
            phone: phone ?? '',
        });
        const wixContact = await this.wixService.upsertContact({
            info: {
                name: { first: firstName, last: lastName },
                emails: { items: [{ email, tag: 'MAIN' }] },
                phones: phone ? { items: [{ phone, tag: 'MAIN' }] } : undefined,
            },
        });
        await this.prisma.contactMapping.upsert({
            where: { userId_wixContactId: { userId, wixContactId: wixContact.id } },
            create: {
                userId,
                wixContactId: wixContact.id,
                hubspotContactId: hsContact.id,
                lastSyncedAt: new Date(),
                lastSyncSource: 'wix',
            },
            update: {
                hubspotContactId: hsContact.id,
                lastSyncedAt: new Date(),
                lastSyncSource: 'wix',
            },
        });
        this.logger.log(`Created contact ${email} in both systems`);
        return {
            wixContactId: wixContact.id,
            hubspotContactId: hsContact.id,
            email,
            firstName,
            lastName,
            phone,
        };
    }
    async updateContact(userId, mappingId, payload) {
        const mapping = await this.prisma.contactMapping.findFirst({
            where: { id: mappingId, userId },
        });
        if (!mapping)
            throw new Error('Contact not found');
        const { firstName, lastName, email, phone } = payload;
        await this.hubspotService.updateContact(userId, mapping.hubspotContactId, {
            email,
            firstname: firstName,
            lastname: lastName,
            phone: phone ?? '',
        });
        const wixContact = await this.wixService.getContactById(mapping.wixContactId);
        if (wixContact) {
            await this.wixService.updateContact(mapping.wixContactId, String(wixContact.revision ?? '1'), {
                info: {
                    name: { first: firstName, last: lastName },
                    emails: { items: [{ email, tag: 'MAIN' }] },
                    phones: phone ? { items: [{ phone, tag: 'MAIN' }] } : undefined,
                },
            });
        }
        await this.prisma.contactMapping.update({
            where: { id: mappingId },
            data: { lastSyncedAt: new Date(), lastSyncSource: 'wix' },
        });
        this.logger.log(`Updated contact ${email} in both systems`);
        return { success: true, email, firstName, lastName };
    }
    async deleteContact(userId, mappingId) {
        const mapping = await this.prisma.contactMapping.findFirst({
            where: { id: mappingId, userId },
        });
        if (!mapping)
            throw new Error('Contact not found');
        await this.prisma.contactMapping.delete({ where: { id: mappingId } });
        this.logger.log(`Removed contact mapping ${mappingId}`);
        return { success: true };
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = ContactsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hubspot_service_1.HubspotService,
        wix_service_1.WixService,
        sync_service_1.SyncService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map