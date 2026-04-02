"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/encryption.service");
const axios_1 = require("axios");
let AuthService = AuthService_1 = class AuthService {
    constructor(configService, prisma, jwtService, encryptionService) {
        this.configService = configService;
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    buildHubspotAuthUrl(state) {
        const clientId = this.configService.get('HUBSPOT_CLIENT_ID');
        const redirectUri = this.configService.get('HUBSPOT_REDIRECT_URI');
        const scopes = this.configService.get('HUBSPOT_SCOPES', 'crm.objects.contacts.read crm.objects.contacts.write');
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scopes,
            state,
        });
        return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
    }
    async exchangeCodeForTokens(code) {
        const clientId = this.configService.get('HUBSPOT_CLIENT_ID');
        const clientSecret = this.configService.get('HUBSPOT_CLIENT_SECRET');
        const redirectUri = this.configService.get('HUBSPOT_REDIRECT_URI');
        const response = await axios_1.default.post('https://api.hubapi.com/oauth/v1/token', new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const { access_token, refresh_token, expires_in } = response.data;
        const meRes = await axios_1.default.get('https://api.hubapi.com/oauth/v1/access-tokens/' + access_token);
        const hubspotPortalId = String(meRes.data.hub_id ?? '');
        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresIn: expires_in,
            hubspotPortalId,
        };
    }
    async connectHubspot(userId, code) {
        const tokens = await this.exchangeCodeForTokens(code);
        const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000 - 60_000);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
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
    async disconnectHubspot(userId) {
        await this.prisma.hubspotConnection.deleteMany({ where: { userId } });
        this.logger.log(`HubSpot disconnected for user ${userId}`);
    }
    async getOrCreateUser(email, wixSiteId) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({ data: { email, wixSiteId } });
        }
        return user.id;
    }
    async issueJwt(userId) {
        return this.jwtService.signAsync({ sub: userId, userId });
    }
    async isConnected(userId) {
        const connection = await this.prisma.hubspotConnection.findUnique({
            where: { userId },
        });
        return !!connection;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService,
        encryption_service_1.EncryptionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map