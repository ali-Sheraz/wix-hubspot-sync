import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import * as crypto from 'crypto';

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

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly syncService: SyncService,
  ) {}

  /**
   * Verify HubSpot webhook signature (v3).
   * HubSpot sends X-HubSpot-Signature-v3 header.
   */
  verifyHubspotSignature(
    signature: string,
    requestBody: string,
    timestamp: string,
    method: string,
    url: string,
  ): boolean {
    const secret = this.configService.get<string>('HUBSPOT_WEBHOOK_SECRET');
    if (!secret) return true; // Skip verification if not configured

    const source = `${method}${url}${requestBody}${timestamp}`;
    const expected = crypto.createHmac('sha256', secret).update(source).digest('base64');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  /**
   * Process incoming HubSpot webhook events.
   * Finds the user associated with the HubSpot portal and triggers sync.
   */
  async processHubspotEvents(events: HubspotWebhookEvent[]): Promise<void> {
    for (const event of events) {
      await this.processEvent(event);
    }
  }

  private async processEvent(event: HubspotWebhookEvent): Promise<void> {
    // Find user with this HubSpot portal
    const connection = await this.prisma.hubspotConnection.findFirst({
      where: { hubspotPortalId: String(event.portalId) },
    });

    if (!connection) {
      this.logger.warn(`No user found for HubSpot portal ${event.portalId}`);
      return;
    }

    const { userId } = connection;
    const hubspotContactId = String(event.objectId);

    const contactTypes = [
      'contact.creation',
      'contact.propertyChange',
      'contact.merge',
    ];

    if (!contactTypes.includes(event.subscriptionType)) {
      this.logger.log(`Ignored HubSpot event type: ${event.subscriptionType}`);
      return;
    }

    this.logger.log(`Processing HubSpot webhook: ${event.subscriptionType} for contact ${hubspotContactId}`);

    // Trigger async sync — HubSpot → Wix
    // We don't await here to return 200 quickly to HubSpot
    this.syncService.syncHubspotToWix(userId, hubspotContactId).catch((err) => {
      this.logger.error(`Webhook sync failed for contact ${hubspotContactId}: ${err.message}`);
    });
  }
}
