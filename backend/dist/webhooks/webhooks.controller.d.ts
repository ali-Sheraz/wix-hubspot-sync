import { Request } from 'express';
import { WebhooksService, HubspotWebhookEvent } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    private readonly logger;
    constructor(webhooksService: WebhooksService);
    receiveHubspotWebhook(req: Request, events: HubspotWebhookEvent[], signatureV3: string, timestamp: string): Promise<{
        received: boolean;
    }>;
}
