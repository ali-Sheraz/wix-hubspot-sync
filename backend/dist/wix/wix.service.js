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
var WixService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WixService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let WixService = WixService_1 = class WixService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WixService_1.name);
        this.baseUrl = 'https://www.wixapis.com';
    }
    getClient() {
        const apiKey = this.configService.get('WIX_API_KEY');
        const accountId = this.configService.get('WIX_ACCOUNT_ID');
        const siteId = this.configService.get('WIX_SITE_ID');
        return axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: apiKey,
                'wix-account-id': accountId,
                'wix-site-id': siteId,
                'Content-Type': 'application/json',
            },
        });
    }
    async getContactById(contactId) {
        try {
            const client = this.getClient();
            const res = await client.get(`/contacts/v4/contacts/${contactId}`);
            return res.data.contact ?? null;
        }
        catch (err) {
            if (err.response?.status === 404)
                return null;
            throw err;
        }
    }
    async searchContactByEmail(email) {
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
        }
        catch {
            return null;
        }
    }
    async createContact(input) {
        const client = this.getClient();
        const res = await client.post('/contacts/v4/contacts', { info: input.info });
        this.logger.log(`Created Wix contact: ${res.data.contact?.id}`);
        return res.data.contact;
    }
    async updateContact(contactId, revision, input) {
        const client = this.getClient();
        const res = await client.patch(`/contacts/v4/contacts/${contactId}`, {
            revision: String(revision),
            info: input.info,
        });
        this.logger.log(`Updated Wix contact: ${contactId}`);
        return res.data.contact;
    }
    async upsertContact(input) {
        const emailsAny = input.info.emails;
        const email = emailsAny?.items?.[0]?.email ?? emailsAny?.[0]?.email;
        const existing = email ? await this.searchContactByEmail(email) : null;
        if (existing) {
            return this.updateContact(existing.id, String(existing.revision ?? '1'), input);
        }
        return this.createContact(input);
    }
    extractPrimaryEmail(contact) {
        const emailsAny = contact.info.emails;
        return emailsAny?.items?.[0]?.email ?? emailsAny?.[0]?.email;
    }
    extractPrimaryPhone(contact) {
        const phonesAny = contact.info.phones;
        return phonesAny?.items?.[0]?.phone ?? phonesAny?.[0]?.phone;
    }
};
exports.WixService = WixService;
exports.WixService = WixService = WixService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WixService);
//# sourceMappingURL=wix.service.js.map