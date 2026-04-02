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
var HubspotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubspotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/encryption.service");
const axios_1 = require("axios");
let HubspotService = HubspotService_1 = class HubspotService {
    constructor(configService, prisma, encryptionService) {
        this.configService = configService;
        this.prisma = prisma;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(HubspotService_1.name);
        this.baseUrl = 'https://api.hubapi.com';
    }
    async getValidAccessToken(userId) {
        const connection = await this.prisma.hubspotConnection.findUnique({
            where: { userId },
        });
        if (!connection) {
            throw new common_1.UnauthorizedException('HubSpot not connected for this user');
        }
        if (new Date() >= connection.expiresAt) {
            return this.refreshAccessToken(userId, connection.refreshToken);
        }
        return this.encryptionService.decrypt(connection.accessToken);
    }
    async refreshAccessToken(userId, encryptedRefreshToken) {
        const refreshToken = this.encryptionService.decrypt(encryptedRefreshToken);
        const response = await axios_1.default.post('https://api.hubapi.com/oauth/v1/token', new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.configService.get('HUBSPOT_CLIENT_ID'),
            client_secret: this.configService.get('HUBSPOT_CLIENT_SECRET'),
            refresh_token: refreshToken,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const { access_token, refresh_token, expires_in } = response.data;
        const expiresAt = new Date(Date.now() + expires_in * 1000 - 60_000);
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
    async getClient(userId) {
        const token = await this.getValidAccessToken(userId);
        return axios_1.default.create({
            baseURL: this.baseUrl,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
    }
    async getContactById(userId, hubspotContactId) {
        try {
            const client = await this.getClient(userId);
            const res = await client.get(`/crm/v3/objects/contacts/${hubspotContactId}`, {
                params: { properties: 'email,firstname,lastname,phone,hs_object_id' },
            });
            return res.data;
        }
        catch (err) {
            if (err.response?.status === 404)
                return null;
            throw err;
        }
    }
    async searchContactByEmail(userId, email) {
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
        }
        catch {
            return null;
        }
    }
    async createContact(userId, properties) {
        const client = await this.getClient(userId);
        const res = await client.post('/crm/v3/objects/contacts', { properties });
        this.logger.log(`Created HubSpot contact: ${res.data.id}`);
        return res.data;
    }
    async updateContact(userId, hubspotContactId, properties) {
        const client = await this.getClient(userId);
        const res = await client.patch(`/crm/v3/objects/contacts/${hubspotContactId}`, { properties });
        this.logger.log(`Updated HubSpot contact: ${hubspotContactId}`);
        return res.data;
    }
    async upsertContact(userId, properties) {
        const existing = properties.email
            ? await this.searchContactByEmail(userId, properties.email)
            : null;
        if (existing) {
            return this.updateContact(userId, existing.id, properties);
        }
        return this.createContact(userId, properties);
    }
    async getContactProperties(userId) {
        const client = await this.getClient(userId);
        const res = await client.get('/crm/v3/properties/contacts');
        return (res.data.results ?? []).map((p) => ({ name: p.name, label: p.label }));
    }
    async registerWebhook(userId, targetUrl, eventType) {
        const client = await this.getClient(userId);
        const connection = await this.prisma.hubspotConnection.findUnique({ where: { userId } });
        if (!connection?.hubspotPortalId)
            return;
        await client.post(`/webhooks/v3/${connection.hubspotPortalId}/subscriptions`, {
            eventType,
            propertyName: 'email',
            active: true,
        });
    }
};
exports.HubspotService = HubspotService;
exports.HubspotService = HubspotService = HubspotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], HubspotService);
//# sourceMappingURL=hubspot.service.js.map