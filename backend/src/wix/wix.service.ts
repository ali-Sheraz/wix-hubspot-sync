import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface WixContact {
  id: string;
  info: {
    name?: { first?: string; last?: string };
    emails?: Array<{ email: string; tag?: string }>;
    phones?: Array<{ phone: string; tag?: string }>;
    [key: string]: any;
  };
  updatedDate?: string;
  revision?: string;
}

export interface WixContactInput {
  info: {
    name?: { first?: string; last?: string };
    emails?: Array<{ email: string; tag: string }>;
    phones?: Array<{ phone: string; tag: string }>;
    extendedFields?: { items?: Record<string, any> };
  };
}

@Injectable()
export class WixService {
  private readonly logger = new Logger(WixService.name);
  private readonly baseUrl = 'https://www.wixapis.com';

  constructor(private readonly configService: ConfigService) {}

  private getClient(): AxiosInstance {
    const apiKey = this.configService.get<string>('WIX_API_KEY');
    const accountId = this.configService.get<string>('WIX_ACCOUNT_ID');
    const siteId = this.configService.get<string>('WIX_SITE_ID');

    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: apiKey,
        'wix-account-id': accountId,
        'wix-site-id': siteId,
        'Content-Type': 'application/json',
      },
    });
  }

  async getContactById(contactId: string): Promise<WixContact | null> {
    try {
      const client = this.getClient();
      const res = await client.get(`/contacts/v4/contacts/${contactId}`);
      return res.data.contact ?? null;
    } catch (err) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }

  async searchContactByEmail(email: string): Promise<WixContact | null> {
    try {
      const client = this.getClient();
      const res = await client.post('/contacts/v4/contacts/query', {
        query: {
          filter: { 'info.emails.email': { $eq: email } },
          fieldsets: ['FULL'],
        },
      });
      const contacts = res.data.contacts ?? [];
      return contacts.length > 0 ? contacts[0] : null;
    } catch {
      return null;
    }
  }

  async createContact(input: WixContactInput): Promise<WixContact> {
    const client = this.getClient();
    const res = await client.post('/contacts/v4/contacts', { info: input.info });
    this.logger.log(`Created Wix contact: ${res.data.contact?.id}`);
    return res.data.contact;
  }

  async updateContact(contactId: string, revision: string, input: WixContactInput): Promise<WixContact> {
    const client = this.getClient();
    const res = await client.patch(`/contacts/v4/contacts/${contactId}`, {
      revision: String(revision),
      info: input.info,
    });
    this.logger.log(`Updated Wix contact: ${contactId}`);
    return res.data.contact;
  }

  async upsertContact(input: WixContactInput): Promise<WixContact> {
    // Support both array format and items format
    const emailsAny = input.info.emails as any;
    const email = emailsAny?.items?.[0]?.email ?? emailsAny?.[0]?.email;
    const existing = email ? await this.searchContactByEmail(email) : null;

    if (existing) {
      return this.updateContact(existing.id, String(existing.revision ?? '1'), input);
    }
    return this.createContact(input);
  }

  extractPrimaryEmail(contact: WixContact): string | undefined {
    const emailsAny = contact.info.emails as any;
    return emailsAny?.items?.[0]?.email ?? emailsAny?.[0]?.email;
  }

  extractPrimaryPhone(contact: WixContact): string | undefined {
    const phonesAny = contact.info.phones as any;
    return phonesAny?.items?.[0]?.phone ?? phonesAny?.[0]?.phone;
  }
}
