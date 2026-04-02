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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const sync_service_1 = require("../sync/sync.service");
const crypto = require("crypto");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(configService, prisma, syncService) {
        this.configService = configService;
        this.prisma = prisma;
        this.syncService = syncService;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    verifyHubspotSignature(signature, requestBody, timestamp, method, url) {
        const secret = this.configService.get('HUBSPOT_WEBHOOK_SECRET');
        if (!secret)
            return true;
        const source = `${method}${url}${requestBody}${timestamp}`;
        const expected = crypto.createHmac('sha256', secret).update(source).digest('base64');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }
    async processHubspotEvents(events) {
        for (const event of events) {
            await this.processEvent(event);
        }
    }
    async processEvent(event) {
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
        this.syncService.syncHubspotToWix(userId, hubspotContactId).catch((err) => {
            this.logger.error(`Webhook sync failed for contact ${hubspotContactId}: ${err.message}`);
        });
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        sync_service_1.SyncService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map