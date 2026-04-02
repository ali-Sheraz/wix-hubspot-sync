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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const sync_service_1 = require("./sync.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
class SyncWixToHubspotDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncWixToHubspotDto.prototype, "wixContactId", void 0);
class SyncHubspotToWixDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncHubspotToWixDto.prototype, "hubspotContactId", void 0);
let SyncController = class SyncController {
    constructor(syncService, jwtService, configService) {
        this.syncService = syncService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async syncWixToHubspot(req, body) {
        const userId = req['user']?.userId;
        return this.syncService.syncWixToHubspot(userId, body.wixContactId);
    }
    async syncHubspotToWix(req, body) {
        const userId = req['user']?.userId;
        return this.syncService.syncHubspotToWix(userId, body.hubspotContactId);
    }
    async getSyncLogs(req) {
        const userId = req['user']?.userId;
        return this.syncService.getSyncLogs(userId);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('wix-to-hubspot'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger Wix → HubSpot contact sync' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SyncWixToHubspotDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "syncWixToHubspot", null);
__decorate([
    (0, common_1.Post)('hubspot-to-wix'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger HubSpot → Wix contact sync' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SyncHubspotToWixDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "syncHubspotToWix", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent sync logs' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getSyncLogs", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('Sync'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService,
        jwt_1.JwtService,
        config_1.ConfigService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map