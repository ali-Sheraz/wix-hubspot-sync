import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HubspotService } from '../hubspot/hubspot.service';
import { WixService, WixContactInput } from '../wix/wix.service';
import { MappingsService } from '../mappings/mappings.service';
import { v4 as uuidv4 } from 'uuid';

export interface SyncResult {
  syncId: string;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  // In-memory set of active sync IDs to prevent re-processing our own writes
  private readonly activeSyncIds = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly hubspotService: HubspotService,
    private readonly wixService: WixService,
    private readonly mappingsService: MappingsService,
  ) {}

  // ── Loop prevention ─────────────────────────────────────────────────────────

  markSyncActive(syncId: string) {
    this.activeSyncIds.add(syncId);
    // Auto-remove after 30s
    setTimeout(() => this.activeSyncIds.delete(syncId), 30_000);
  }

  isSyncLoop(syncId: string): boolean {
    return this.activeSyncIds.has(syncId);
  }

  // ── Wix → HubSpot ──────────────────────────────────────────────────────────

  async syncWixToHubspot(userId: string, wixContactId: string, sourceSyncId?: string): Promise<SyncResult> {
    const syncId = uuidv4();

    // Loop detection: if this update was triggered by our own HubSpot write, skip
    if (sourceSyncId && this.isSyncLoop(sourceSyncId)) {
      this.logger.log(`Skipping loop sync for wixContactId=${wixContactId}`);
      return { syncId, status: 'skipped', reason: 'loop_detected' };
    }

    try {
      // 1. Fetch Wix contact
      const wixContact = await this.wixService.getContactById(wixContactId);
      if (!wixContact) {
        return this.logSync(userId, syncId, 'wix', 'wix_to_hubspot', 'failed', wixContactId, 'Wix contact not found');
      }

      // 2. Check existing contact mapping
      const existingMapping = await this.prisma.contactMapping.findUnique({
        where: { userId_wixContactId: { userId, wixContactId } },
      });

      // 3. Idempotency: if last synced is newer than wix updated, skip
      if (existingMapping?.lastSyncedAt && existingMapping.lastSyncSource === 'wix') {
        const wixUpdated = wixContact.updatedDate ? new Date(wixContact.updatedDate) : null;
        if (wixUpdated && wixUpdated <= existingMapping.lastSyncedAt) {
          return { syncId, status: 'skipped', reason: 'no_changes' };
        }
      }

      // 4. Build HubSpot properties from field mappings
      const hubspotProperties = await this.mappingsService.buildHubspotPropertiesFromWix(
        userId,
        this.flattenWixContact(wixContact),
      );

      if (Object.keys(hubspotProperties).length === 0) {
        return { syncId, status: 'skipped', reason: 'no_mapped_fields' };
      }

      // 5. Mark sync as active to prevent reverse loop
      this.markSyncActive(syncId);

      // 6. Create or update HubSpot contact
      let hubspotContactId = existingMapping?.hubspotContactId;
      if (hubspotContactId) {
        await this.hubspotService.updateContact(userId, hubspotContactId, hubspotProperties);
      } else {
        const created = await this.hubspotService.upsertContact(userId, hubspotProperties);
        hubspotContactId = created.id;
      }

      // 7. Upsert contact mapping
      await this.prisma.contactMapping.upsert({
        where: { userId_wixContactId: { userId, wixContactId } },
        create: { userId, wixContactId, hubspotContactId, lastSyncedAt: new Date(), lastSyncSource: 'wix', lastSyncId: syncId },
        update: { hubspotContactId, lastSyncedAt: new Date(), lastSyncSource: 'wix', lastSyncId: syncId },
      });

      return this.logSync(userId, syncId, 'wix', 'wix_to_hubspot', 'success', wixContactId);
    } catch (err) {
      this.logger.error(`syncWixToHubspot failed: ${err.message}`);
      return this.logSync(userId, syncId, 'wix', 'wix_to_hubspot', 'failed', wixContactId, err.message);
    }
  }

  // ── HubSpot → Wix ──────────────────────────────────────────────────────────

  async syncHubspotToWix(userId: string, hubspotContactId: string, sourceSyncId?: string): Promise<SyncResult> {
    const syncId = uuidv4();

    if (sourceSyncId && this.isSyncLoop(sourceSyncId)) {
      this.logger.log(`Skipping loop sync for hubspotContactId=${hubspotContactId}`);
      return { syncId, status: 'skipped', reason: 'loop_detected' };
    }

    try {
      // 1. Fetch HubSpot contact
      const hubspotContact = await this.hubspotService.getContactById(userId, hubspotContactId);
      if (!hubspotContact) {
        return this.logSync(userId, syncId, 'hubspot', 'hubspot_to_wix', 'failed', hubspotContactId, 'HubSpot contact not found');
      }

      // 2. Check existing contact mapping
      const existingMapping = await this.prisma.contactMapping.findUnique({
        where: { userId_hubspotContactId: { userId, hubspotContactId } },
      });

      // 3. Idempotency check
      if (existingMapping?.lastSyncedAt && existingMapping.lastSyncSource === 'hubspot') {
        const hsUpdated = hubspotContact.updatedAt ? new Date(hubspotContact.updatedAt) : null;
        if (hsUpdated && hsUpdated <= existingMapping.lastSyncedAt) {
          return { syncId, status: 'skipped', reason: 'no_changes' };
        }
      }

      // 4. Build Wix contact data from field mappings
      const wixData = await this.mappingsService.buildWixContactFromHubspot(
        userId,
        hubspotContact.properties,
      );

      if (Object.keys(wixData).length === 0) {
        return { syncId, status: 'skipped', reason: 'no_mapped_fields' };
      }

      // 5. Mark sync active to prevent reverse loop
      this.markSyncActive(syncId);

      // 6. Build Wix contact input
      const wixContactInput = this.buildWixContactInput(wixData);
      let wixContactId = existingMapping?.wixContactId;

      if (wixContactId) {
        const existing = await this.wixService.getContactById(wixContactId);
        if (existing) {
          await this.wixService.updateContact(wixContactId, existing.revision ?? '0', wixContactInput);
        }
      } else {
        const created = await this.wixService.upsertContact(wixContactInput);
        wixContactId = created.id;
      }

      // 7. Upsert contact mapping
      await this.prisma.contactMapping.upsert({
        where: { userId_hubspotContactId: { userId, hubspotContactId } },
        create: { userId, wixContactId, hubspotContactId, lastSyncedAt: new Date(), lastSyncSource: 'hubspot', lastSyncId: syncId },
        update: { wixContactId, lastSyncedAt: new Date(), lastSyncSource: 'hubspot', lastSyncId: syncId },
      });

      return this.logSync(userId, syncId, 'hubspot', 'hubspot_to_wix', 'success', hubspotContactId);
    } catch (err) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      this.logger.error(`syncHubspotToWix failed: ${detail}`);
      return this.logSync(userId, syncId, 'hubspot', 'hubspot_to_wix', 'failed', hubspotContactId, detail);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private flattenWixContact(contact: any): Record<string, any> {
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

  private buildWixContactInput(data: Record<string, any>): WixContactInput {
    const info: any = {};

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

  private async logSync(
    userId: string,
    syncId: string,
    source: string,
    direction: string,
    status: 'success' | 'failed' | 'skipped',
    entityId?: string,
    errorMsg?: string,
  ): Promise<SyncResult> {
    await this.prisma.syncLog.create({
      data: { userId, syncId, source, direction, status, entityId, errorMsg },
    });
    return { syncId, status, reason: errorMsg };
  }

  async getSyncLogs(userId: string, limit = 50) {
    return this.prisma.syncLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
