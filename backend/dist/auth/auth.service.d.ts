import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
export declare class AuthService {
    private readonly configService;
    private readonly prisma;
    private readonly jwtService;
    private readonly encryptionService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, jwtService: JwtService, encryptionService: EncryptionService);
    buildHubspotAuthUrl(state: string): string;
    exchangeCodeForTokens(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        hubspotPortalId: string;
    }>;
    connectHubspot(userId: string, code: string): Promise<void>;
    disconnectHubspot(userId: string): Promise<void>;
    getOrCreateUser(email: string, wixSiteId?: string): Promise<string>;
    issueJwt(userId: string): Promise<string>;
    isConnected(userId: string): Promise<boolean>;
}
