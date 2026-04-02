import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService, HubspotWebhookEvent } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * HubSpot webhook endpoint.
   * Register this URL in your HubSpot app's webhook settings.
   */
  @Post('hubspot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive HubSpot CRM webhook events' })
  async receiveHubspotWebhook(
    @Req() req: Request,
    @Body() events: HubspotWebhookEvent[],
    @Headers('x-hubspot-signature-v3') signatureV3: string,
    @Headers('x-hubspot-request-timestamp') timestamp: string,
  ) {
    // Verify signature if header present
    if (signatureV3) {
      const rawBody = JSON.stringify(events);
      const isValid = this.webhooksService.verifyHubspotSignature(
        signatureV3,
        rawBody,
        timestamp,
        req.method,
        `${req.protocol}://${req.headers.host}${req.originalUrl}`,
      );

      if (!isValid) {
        this.logger.warn('Invalid HubSpot webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    if (!Array.isArray(events)) {
      throw new BadRequestException('Expected array of events');
    }

    this.logger.log(`Received ${events.length} HubSpot webhook event(s)`);

    // Process async — return 200 immediately
    this.webhooksService.processHubspotEvents(events).catch((err) => {
      this.logger.error(`Webhook processing error: ${err.message}`);
    });

    return { received: true };
  }
}
