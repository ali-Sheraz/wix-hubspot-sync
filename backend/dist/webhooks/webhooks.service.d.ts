import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
export interface HubspotWebhookEvent {
    eventId: number;
    subscriptionId: number;
    portalId: number;
    occurredAt: number;
    subscriptionType: string;
    attemptNumber: number;
    objectId: number;
    changeSource?: string;
    changeFlag?: string;
    propertyName?: string;
    propertyValue?: string;
}
export declare class WebhooksService {
    private readonly configService;
    private readonly prisma;
    private readonly syncService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, syncService: SyncService);
    verifyHubspotSignature(signature: string, requestBody: string, timestamp: string, method: string, url: string): boolean;
    processHubspotEvents(events: HubspotWebhookEvent[]): Promise<void>;
    private processEvent;
}
