import { PrismaService } from '../prisma/prisma.service';
import { HubspotService } from '../hubspot/hubspot.service';
import { WixService } from '../wix/wix.service';
import { MappingsService } from '../mappings/mappings.service';
export interface SyncResult {
    syncId: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
}
export declare class SyncService {
    private readonly prisma;
    private readonly hubspotService;
    private readonly wixService;
    private readonly mappingsService;
    private readonly logger;
    private readonly activeSyncIds;
    constructor(prisma: PrismaService, hubspotService: HubspotService, wixService: WixService, mappingsService: MappingsService);
    markSyncActive(syncId: string): void;
    isSyncLoop(syncId: string): boolean;
    syncWixToHubspot(userId: string, wixContactId: string, sourceSyncId?: string): Promise<SyncResult>;
    syncHubspotToWix(userId: string, hubspotContactId: string, sourceSyncId?: string): Promise<SyncResult>;
    private flattenWixContact;
    private buildWixContactInput;
    private logSync;
    getSyncLogs(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        direction: string | null;
        syncId: string;
        source: string;
        entityId: string | null;
        errorMsg: string | null;
    }[]>;
}
