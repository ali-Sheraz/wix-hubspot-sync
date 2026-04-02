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
export declare class ContactsService {
    private readonly prisma;
    private readonly hubspotService;
    private readonly wixService;
    private readonly syncService;
    private readonly logger;
    constructor(prisma: PrismaService, hubspotService: HubspotService, wixService: WixService, syncService: SyncService);
    listContacts(userId: string): Promise<{
        id: string;
        wixContactId: string;
        hubspotContactId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        lastSyncedAt: Date;
        lastSyncSource: string;
    }[]>;
    createContact(userId: string, payload: ContactPayload): Promise<{
        wixContactId: string;
        hubspotContactId: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
    }>;
    updateContact(userId: string, mappingId: string, payload: ContactPayload): Promise<{
        success: boolean;
        email: string;
        firstName: string;
        lastName: string;
    }>;
    deleteContact(userId: string, mappingId: string): Promise<{
        success: boolean;
    }>;
}
