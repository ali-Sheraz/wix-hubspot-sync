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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mappings_service_1 = require("./mappings.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
class FieldMappingDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FieldMappingDto.prototype, "wixField", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FieldMappingDto.prototype, "hubspotField", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['wix_to_hubspot', 'hubspot_to_wix', 'bidirectional']),
    __metadata("design:type", String)
], FieldMappingDto.prototype, "direction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['lowercase', 'trim', null]),
    __metadata("design:type", String)
], FieldMappingDto.prototype, "transform", void 0);
class SaveMappingsDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FieldMappingDto),
    __metadata("design:type", Array)
], SaveMappingsDto.prototype, "mappings", void 0);
let MappingsController = class MappingsController {
    constructor(mappingsService, jwtService, configService) {
        this.mappingsService = mappingsService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async getMappings(req) {
        const userId = req['user']?.userId;
        return this.mappingsService.getFieldMappings(userId);
    }
    async saveMappings(req, body) {
        const userId = req['user']?.userId;
        return this.mappingsService.saveMappings(userId, body);
    }
    async deleteMapping(req, id) {
        const userId = req['user']?.userId;
        await this.mappingsService.deleteMapping(userId, id);
    }
    async getWixFields() {
        return this.mappingsService.getWixFields();
    }
    async getHubspotProperties(req) {
        const userId = req['user']?.userId;
        return this.mappingsService.getHubspotProperties(userId);
    }
};
exports.MappingsController = MappingsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all field mappings for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MappingsController.prototype, "getMappings", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Save/replace all field mappings' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SaveMappingsDto]),
    __metadata("design:returntype", Promise)
], MappingsController.prototype, "saveMappings", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a specific field mapping' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MappingsController.prototype, "deleteMapping", null);
__decorate([
    (0, common_1.Get)('wix-fields'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available Wix contact fields' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MappingsController.prototype, "getWixFields", null);
__decorate([
    (0, common_1.Get)('hubspot-properties'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available HubSpot contact properties' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MappingsController.prototype, "getHubspotProperties", null);
exports.MappingsController = MappingsController = __decorate([
    (0, swagger_1.ApiTags)('Mappings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mappings'),
    __metadata("design:paramtypes", [mappings_service_1.MappingsService,
        jwt_1.JwtService,
        config_1.ConfigService])
], MappingsController);
//# sourceMappingURL=mappings.controller.js.map