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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
        this.logger = new common_1.Logger(WebhooksController_1.name);
    }
    async receiveHubspotWebhook(req, events, signatureV3, timestamp) {
        if (signatureV3) {
            const rawBody = JSON.stringify(events);
            const isValid = this.webhooksService.verifyHubspotSignature(signatureV3, rawBody, timestamp, req.method, `${req.protocol}://${req.headers.host}${req.originalUrl}`);
            if (!isValid) {
                this.logger.warn('Invalid HubSpot webhook signature');
                throw new common_1.BadRequestException('Invalid webhook signature');
            }
        }
        if (!Array.isArray(events)) {
            throw new common_1.BadRequestException('Expected array of events');
        }
        this.logger.log(`Received ${events.length} HubSpot webhook event(s)`);
        this.webhooksService.processHubspotEvents(events).catch((err) => {
            this.logger.error(`Webhook processing error: ${err.message}`);
        });
        return { received: true };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('hubspot'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Receive HubSpot CRM webhook events' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-hubspot-signature-v3')),
    __param(3, (0, common_1.Headers)('x-hubspot-request-timestamp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "receiveHubspotWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map