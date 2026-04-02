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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const pendingStates = new Map();
let AuthController = class AuthController {
    constructor(authService, jwtService, configService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async connect(userId, email, res) {
        if (!email && !userId) {
            throw new common_1.BadRequestException('Provide userId or email to initiate OAuth');
        }
        let resolvedUserId = userId;
        if (!resolvedUserId && email) {
            resolvedUserId = await this.authService.getOrCreateUser(email);
        }
        const state = (0, uuid_1.v4)();
        pendingStates.set(state, {
            userId: resolvedUserId,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });
        const authUrl = this.authService.buildHubspotAuthUrl(state);
        return res.redirect(authUrl);
    }
    async callback(code, state, error, res) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
        if (error) {
            return res.redirect(`${frontendUrl}?error=oauth_denied`);
        }
        const pending = pendingStates.get(state);
        if (!pending || Date.now() > pending.expiresAt) {
            return res.redirect(`${frontendUrl}?error=invalid_state`);
        }
        pendingStates.delete(state);
        try {
            await this.authService.connectHubspot(pending.userId, code);
            const jwt = await this.authService.issueJwt(pending.userId);
            return res.redirect(`${frontendUrl}?token=${jwt}&connected=true`);
        }
        catch {
            return res.redirect(`${frontendUrl}?error=oauth_failed`);
        }
    }
    async disconnect(req) {
        const userId = req['user']?.userId;
        await this.authService.disconnectHubspot(userId);
    }
    async status(req) {
        const userId = req['user']?.userId;
        const connected = await this.authService.isConnected(userId);
        return { connected };
    }
    async register(body) {
        if (!body.email)
            throw new common_1.BadRequestException('email is required');
        const userId = await this.authService.getOrCreateUser(body.email, body.wixSiteId);
        const token = await this.authService.issueJwt(userId);
        return { userId, token };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('connect'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate HubSpot OAuth flow' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('email')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "connect", null);
__decorate([
    (0, common_1.Get)('callback'),
    (0, swagger_1.ApiOperation)({ summary: 'HubSpot OAuth callback' }),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('error')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "callback", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect HubSpot account' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check HubSpot connection status' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register user and get JWT' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth/hubspot'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map