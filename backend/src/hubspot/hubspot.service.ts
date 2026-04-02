import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import axios, { AxiosInstance } from 'axios';

export interface HubspotContact {
  id: string;
  properties: Record<string, string>;
  updatedAt?: string;
}

export interface HubspotContactInput {
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  private readonly baseUrl = 'https://api.hubapi.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // ── Token management ────────────────────────────────────────────────────────

  async getValidAccessToken(userId: string): Promise<string> {
    const connection = await this.prisma.hubspotConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new UnauthorizedException('HubSpot not connected for this user');
    }

    if (new Date() >= connection.expiresAt) {
      return this.refreshAccessToken(userId, connection.refreshToken);
    }

    return this.encryptionService.decrypt(connection.accessToken);
  }

  private async refreshAccessToken(userId: string, encryptedRefreshToken: string): Promise<string> {
    const refreshToken = this.encryptionService.decrypt(encryptedRefreshToken);

    const response = await axios.post(
      'https://api.hubapi.com/oauth/v1/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.configService.get<string>('HUBSPOT_CLIENT_ID'),
        client_secret: this.configService.get<string>('HUBSPOT_CLIENT_SECRET'),
        refresh_token: refreshToken,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000 - 60_000); // 1-min buffer

    await this.prisma.hubspotConnection.update({
      where: { userId },
      data: {
        accessToken: this.encryptionService.encrypt(access_token),
        refreshToken: this.encryptionService.encrypt(refresh_token ?? refreshToken),
        expiresAt,
      },
    });

    this.logger.log('HubSpot access token refreshed');
    return access_token;
  }

  private async getClient(userId: string): Promise<AxiosInstance> {
    const token = await this.getValidAccessToken(userId);
    return axios.create({
      baseURL: this.baseUrl,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }

  // ── Contacts API ────────────────────────────────────────────────────────────

  async getContactById(userId: string, hubspotContactId: string): Promise<HubspotContact | null> {
    try {
      const client = await this.getClient(userId);
      const res = await client.get(`/crm/v3/objects/contacts/${hubspotContactId}`, {
        params: { properties: 'email,firstname,lastname,phone,hs_object_id' },
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }

  async searchContactByEmail(userId: string, email: string): Promise<HubspotContact | null> {
    try {
      const client = await this.getClient(userId);
      const res = await client.post('/crm/v3/objects/contacts/search', {
        filterGroups: [
          { filters: [{ propertyName: 'email', operator: 'EQ', value: email }] },
        ],
        properties: ['email', 'firstname', 'lastname', 'phone'],
        limit: 1,
      });
      const results = res.data.results ?? [];
      return results.length > 0 ? results[0] : null;
    } catch {
      return null;
    }
  }

  async createContact(userId: string, properties: HubspotContactInput): Promise<HubspotContact> {
    const client = await this.getClient(userId);
    const res = await client.post('/crm/v3/objects/contacts', { properties });
    this.logger.log(`Created HubSpot contact: ${res.data.id}`);
    return res.data;
  }

  async updateContact(
    userId: string,
    hubspotContactId: string,
    properties: HubspotContactInput,
  ): Promise<HubspotContact> {
    const client = await this.getClient(userId);
    const res = await client.patch(`/crm/v3/objects/contacts/${hubspotContactId}`, { properties });
    this.logger.log(`Updated HubSpot contact: ${hubspotContactId}`);
    return res.data;
  }

  async upsertContact(userId: string, properties: HubspotContactInput): Promise<HubspotContact> {
    const existing = properties.email
      ? await this.searchContactByEmail(userId, properties.email)
      : null;

    if (existing) {
      return this.updateContact(userId, existing.id, properties);
    }
    return this.createContact(userId, properties);
  }

  // ── Contact properties ──────────────────────────────────────────────────────

  async getContactProperties(userId: string): Promise<Array<{ name: string; label: string }>> {
    const client = await this.getClient(userId);
    const res = await client.get('/crm/v3/properties/contacts');
    return (res.data.results ?? []).map((p: any) => ({ name: p.name, label: p.label }));
  }

  // ── Webhooks ────────────────────────────────────────────────────────────────

  async registerWebhook(
    userId: string,
    targetUrl: string,
    eventType: string,
  ): Promise<void> {
    const client = await this.getClient(userId);
    const connection = await this.prisma.hubspotConnection.findUnique({ where: { userId } });

    if (!connection?.hubspotPortalId) return;

    await client.post(
      `/webhooks/v3/${connection.hubspotPortalId}/subscriptions`,
      {
        eventType,
        propertyName: 'email',
        active: true,
      },
    );
  }
}
