import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HubspotService } from '../hubspot/hubspot.service';

export interface WixFormSubmission {
  // Contact fields
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  // Custom fields (arbitrary key-value)
  customFields?: Record<string, string>;
  // Attribution
  attribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    pageUrl?: string;
    referrer?: string;
  };
  // Metadata
  formId?: string;
  submittedAt?: string;
}

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hubspotService: HubspotService,
  ) {}

  async handleFormSubmission(userId: string, submission: WixFormSubmission): Promise<{ hubspotContactId: string }> {
    const { email, firstName, lastName, phone, customFields, attribution, formId, submittedAt } = submission;

    // Build HubSpot contact properties
    const properties: Record<string, string> = {
      email,
    };

    if (firstName) properties.firstname = firstName;
    if (lastName) properties.lastname = lastName;
    if (phone) properties.phone = phone;

    // Attribution stored in the contact's website field and description
    // (avoids needing custom HubSpot properties)
    if (attribution) {
      const parts: string[] = [];
      if (attribution.utmSource) parts.push(`utm_source=${attribution.utmSource}`);
      if (attribution.utmMedium) parts.push(`utm_medium=${attribution.utmMedium}`);
      if (attribution.utmCampaign) parts.push(`utm_campaign=${attribution.utmCampaign}`);
      if (attribution.utmTerm) parts.push(`utm_term=${attribution.utmTerm}`);
      if (attribution.utmContent) parts.push(`utm_content=${attribution.utmContent}`);
      if (attribution.pageUrl) properties.website = attribution.pageUrl;
      if (parts.length > 0) {
        properties.message = parts.join(' | ');
      }
    }

    // Merge custom fields
    if (customFields) {
      Object.assign(properties, customFields);
    }

    this.logger.log(`Processing form submission for email: [REDACTED], formId: ${formId}`);

    // Upsert contact in HubSpot immediately
    const contact = await this.hubspotService.upsertContact(userId, properties);

    // Log sync
    await this.prisma.syncLog.create({
      data: {
        userId,
        source: 'form',
        direction: 'wix_to_hubspot',
        status: 'success',
        entityId: contact.id,
      },
    });

    return { hubspotContactId: contact.id };
  }
}
