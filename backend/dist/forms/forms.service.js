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
var FormsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const hubspot_service_1 = require("../hubspot/hubspot.service");
let FormsService = FormsService_1 = class FormsService {
    constructor(prisma, hubspotService) {
        this.prisma = prisma;
        this.hubspotService = hubspotService;
        this.logger = new common_1.Logger(FormsService_1.name);
    }
    async handleFormSubmission(userId, submission) {
        const { email, firstName, lastName, phone, customFields, attribution, formId, submittedAt } = submission;
        const properties = {
            email,
        };
        if (firstName)
            properties.firstname = firstName;
        if (lastName)
            properties.lastname = lastName;
        if (phone)
            properties.phone = phone;
        if (attribution) {
            const parts = [];
            if (attribution.utmSource)
                parts.push(`utm_source=${attribution.utmSource}`);
            if (attribution.utmMedium)
                parts.push(`utm_medium=${attribution.utmMedium}`);
            if (attribution.utmCampaign)
                parts.push(`utm_campaign=${attribution.utmCampaign}`);
            if (attribution.utmTerm)
                parts.push(`utm_term=${attribution.utmTerm}`);
            if (attribution.utmContent)
                parts.push(`utm_content=${attribution.utmContent}`);
            if (attribution.pageUrl)
                properties.website = attribution.pageUrl;
            if (parts.length > 0) {
                properties.message = parts.join(' | ');
            }
        }
        if (customFields) {
            Object.assign(properties, customFields);
        }
        this.logger.log(`Processing form submission for email: [REDACTED], formId: ${formId}`);
        const contact = await this.hubspotService.upsertContact(userId, properties);
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
};
exports.FormsService = FormsService;
exports.FormsService = FormsService = FormsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hubspot_service_1.HubspotService])
], FormsService);
//# sourceMappingURL=forms.service.js.map