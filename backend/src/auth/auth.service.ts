import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly encryptionService: EncryptionService,
  ) {}

  buildHubspotAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('HUBSPOT_CLIENT_ID');
    const redirectUri = this.configService.get<string>('HUBSPOT_REDIRECT_URI');
    const scopes = this.configService.get<string>(
      'HUBSPOT_SCOPES',
      'crm.objects.contacts.read crm.objects.contacts.write',
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    hubspotPortalId: string;
  }> {
    const clientId = this.configService.get<string>('HUBSPOT_CLIENT_ID');
    const clientSecret = this.configService.get<string>('HUBSPOT_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('HUBSPOT_REDIRECT_URI');

    const response = await axios.post(
      'https://api.hubapi.com/oauth/v1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Fetch portal info
    const meRes = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/' + access_token);
    const hubspotPortalId = String(meRes.data.hub_id ?? '');

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      hubspotPortalId,
    };
  }

  async connectHubspot(userId: string, code: string): Promise<void> {
    const tokens = await this.exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000 - 60_000);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    await this.prisma.hubspotConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: this.encryptionService.encrypt(tokens.accessToken),
        refreshToken: this.encryptionService.encrypt(tokens.refreshToken),
        expiresAt,
        hubspotPortalId: tokens.hubspotPortalId,
      },
      update: {
        accessToken: this.encryptionService.encrypt(tokens.accessToken),
        refreshToken: this.encryptionService.encrypt(tokens.refreshToken),
        expiresAt,
        hubspotPortalId: tokens.hubspotPortalId,
      },
    });

    this.logger.log(`HubSpot connected for user ${userId}, portal ${tokens.hubspotPortalId}`);
  }

  async disconnectHubspot(userId: string): Promise<void> {
    await this.prisma.hubspotConnection.deleteMany({ where: { userId } });
    this.logger.log(`HubSpot disconnected for user ${userId}`);
  }

  async getOrCreateUser(email: string, wixSiteId?: string): Promise<string> {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({ data: { email, wixSiteId } });
    }
    return user.id;
  }

  async issueJwt(userId: string): Promise<string> {
    return this.jwtService.signAsync({ sub: userId, userId });
  }

  async isConnected(userId: string): Promise<boolean> {
    const connection = await this.prisma.hubspotConnection.findUnique({
      where: { userId },
    });
    return !!connection;
  }
}
