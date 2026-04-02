import { Request } from 'express';
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
declare class SyncWixToHubspotDto {
    wixContactId: string;
}
declare class SyncHubspotToWixDto {
    hubspotContactId: string;
}
export declare class SyncController {
    private readonly syncService;
    private readonly jwtService;
    private readonly configService;
    constructor(syncService: SyncService, jwtService: JwtService, configService: ConfigService);
    syncWixToHubspot(req: Request, body: SyncWixToHubspotDto): Promise<import("./sync.service").SyncResult>;
    syncHubspotToWix(req: Request, body: SyncHubspotToWixDto): Promise<import("./sync.service").SyncResult>;
    getSyncLogs(req: Request): Promise<{
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
export {};
