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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingsService = exports.WIX_CONTACT_FIELDS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const hubspot_service_1 = require("../hubspot/hubspot.service");
exports.WIX_CONTACT_FIELDS = [
    { name: 'info.name.first', label: 'First Name' },
    { name: 'info.name.last', label: 'Last Name' },
    { name: 'info.emails[0].email', label: 'Email' },
    { name: 'info.phones[0].phone', label: 'Phone' },
    { name: 'info.addresses[0].city', label: 'City' },
    { name: 'info.addresses[0].country', label: 'Country' },
    { name: 'info.company.name', label: 'Company' },
    { name: 'info.jobTitle', label: 'Job Title' },
];
let MappingsService = class MappingsService {
    constructor(prisma, hubspotService) {
        this.prisma = prisma;
        this.hubspotService = hubspotService;
    }
    async getFieldMappings(userId) {
        const mappings = await this.prisma.fieldMapping.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        return mappings;
    }
    async saveMappings(userId, input) {
        const { mappings } = input;
        const hubspotFields = mappings.map((m) => m.hubspotField);
        const uniqueFields = new Set(hubspotFields);
        if (uniqueFields.size !== hubspotFields.length) {
            throw new common_1.ConflictException('Duplicate HubSpot field in mappings');
        }
        await this.prisma.$transaction([
            this.prisma.fieldMapping.deleteMany({ where: { userId } }),
            this.prisma.fieldMapping.createMany({
                data: mappings.map((m) => ({
                    userId,
                    wixField: m.wixField,
                    hubspotField: m.hubspotField,
                    direction: m.direction,
                    transform: m.transform ?? null,
                })),
            }),
        ]);
        return this.getFieldMappings(userId);
    }
    async deleteMapping(userId, mappingId) {
        const existing = await this.prisma.fieldMapping.findFirst({
            where: { id: mappingId, userId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Mapping not found');
        await this.prisma.fieldMapping.delete({ where: { id: mappingId } });
    }
    async getWixFields() {
        return exports.WIX_CONTACT_FIELDS;
    }
    async getHubspotProperties(userId) {
        try {
            return await this.hubspotService.getContactProperties(userId);
        }
        catch {
            return [
                { name: 'email', label: 'Email' },
                { name: 'firstname', label: 'First Name' },
                { name: 'lastname', label: 'Last Name' },
                { name: 'phone', label: 'Phone Number' },
                { name: 'company', label: 'Company' },
                { name: 'jobtitle', label: 'Job Title' },
                { name: 'city', label: 'City' },
                { name: 'country', label: 'Country/Region' },
            ];
        }
    }
    applyTransform(value, transform) {
        if (!value)
            return value;
        if (transform === 'lowercase')
            return value.toLowerCase();
        if (transform === 'trim')
            return value.trim();
        return value;
    }
    async buildHubspotPropertiesFromWix(userId, wixContact) {
        const mappings = await this.prisma.fieldMapping.findMany({
            where: {
                userId,
                direction: { in: ['wix_to_hubspot', 'bidirectional'] },
            },
        });
        const result = {};
        for (const mapping of mappings) {
            const rawValue = this.getNestedValue(wixContact, mapping.wixField);
            if (rawValue !== undefined && rawValue !== null) {
                result[mapping.hubspotField] = this.applyTransform(String(rawValue), mapping.transform);
            }
        }
        return result;
    }
    async buildWixContactFromHubspot(userId, hubspotProperties) {
        const mappings = await this.prisma.fieldMapping.findMany({
            where: {
                userId,
                direction: { in: ['hubspot_to_wix', 'bidirectional'] },
            },
        });
        const result = {};
        for (const mapping of mappings) {
            const rawValue = hubspotProperties[mapping.hubspotField];
            if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                result[mapping.wixField] = this.applyTransform(String(rawValue), mapping.transform);
            }
        }
        return result;
    }
    getNestedValue(obj, path) {
        if (path in obj)
            return obj[path];
        const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
        return normalizedPath.split('.').reduce((acc, key) => acc?.[key], obj);
    }
    setNestedValue(obj, path, value) {
        const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
        const keys = normalizedPath.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    }
};
exports.MappingsService = MappingsService;
exports.MappingsService = MappingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hubspot_service_1.HubspotService])
], MappingsService);
//# sourceMappingURL=mappings.service.js.map