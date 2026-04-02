import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HubspotService } from '../hubspot/hubspot.service';
import { WixService } from '../wix/wix.service';
import { SyncService } from '../sync/sync.service';

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hubspotService: HubspotService,
    private readonly wixService: WixService,
    private readonly syncService: SyncService,
  ) {}

  // List all contacts from our mapping table with details
  async listContacts(userId: string) {
    const mappings = await this.prisma.contactMapping.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const results = await Promise.all(
      mappings.map(async (m) => {
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
        } catch {
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
      }),
    );

    return results;
  }

  // Create contact in BOTH Wix and HubSpot, then link them
  async createContact(userId: string, payload: ContactPayload) {
    const { firstName, lastName, email, phone } = payload;

    // 1. Upsert in HubSpot (create or update if already exists)
    const hsContact = await this.hubspotService.upsertContact(userId, {
      email,
      firstname: firstName,
      lastname: lastName,
      phone: phone ?? '',
    });

    // 2. Upsert in Wix (create or update if already exists)
    const wixContact = await this.wixService.upsertContact({
      info: {
        name: { first: firstName, last: lastName },
        emails: { items: [{ email, tag: 'MAIN' }] } as any,
        phones: phone ? ({ items: [{ phone, tag: 'MAIN' }] } as any) : undefined,
      },
    });

    // 3. Link them in DB (upsert in case mapping already exists)
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

  // Update contact in BOTH systems
  async updateContact(userId: string, mappingId: string, payload: ContactPayload) {
    const mapping = await this.prisma.contactMapping.findFirst({
      where: { id: mappingId, userId },
    });

    if (!mapping) throw new Error('Contact not found');

    const { firstName, lastName, email, phone } = payload;

    // 1. Update HubSpot
    await this.hubspotService.updateContact(userId, mapping.hubspotContactId, {
      email,
      firstname: firstName,
      lastname: lastName,
      phone: phone ?? '',
    });

    // 2. Update Wix
    const wixContact = await this.wixService.getContactById(mapping.wixContactId);
    if (wixContact) {
      await this.wixService.updateContact(mapping.wixContactId, String(wixContact.revision ?? '1'), {
        info: {
          name: { first: firstName, last: lastName },
          emails: { items: [{ email, tag: 'MAIN' }] } as any,
          phones: phone ? ({ items: [{ phone, tag: 'MAIN' }] } as any) : undefined,
        },
      });
    }

    // 3. Update mapping timestamp
    await this.prisma.contactMapping.update({
      where: { id: mappingId },
      data: { lastSyncedAt: new Date(), lastSyncSource: 'wix' },
    });

    this.logger.log(`Updated contact ${email} in both systems`);

    return { success: true, email, firstName, lastName };
  }

  // Delete contact from both systems
  async deleteContact(userId: string, mappingId: string) {
    const mapping = await this.prisma.contactMapping.findFirst({
      where: { id: mappingId, userId },
    });
    if (!mapping) throw new Error('Contact not found');

    await this.prisma.contactMapping.delete({ where: { id: mappingId } });
    this.logger.log(`Removed contact mapping ${mappingId}`);
    return { success: true };
  }
}
