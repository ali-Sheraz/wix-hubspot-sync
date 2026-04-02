"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
const common_1 = require("@nestjs/common");
const REDACTED_KEYS = ['accessToken', 'refreshToken', 'password', 'token', 'secret', 'email'];
function sanitize(obj) {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    const sanitized = { ...obj };
    for (const key of Object.keys(sanitized)) {
        if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }
    return sanitized;
}
let AppLogger = class AppLogger {
    log(message, context) {
        console.log(`[${new Date().toISOString()}] [LOG] [${context ?? 'App'}] ${message}`);
    }
    error(message, trace, context) {
        console.error(`[${new Date().toISOString()}] [ERROR] [${context ?? 'App'}] ${message}`);
        if (trace)
            console.error(trace);
    }
    warn(message, context) {
        console.warn(`[${new Date().toISOString()}] [WARN] [${context ?? 'App'}] ${message}`);
    }
    logSafe(message, data, context) {
        const safe = data ? sanitize(data) : '';
        console.log(`[${new Date().toISOString()}] [LOG] [${context ?? 'App'}] ${message}`, safe ? JSON.stringify(safe) : '');
    }
};
exports.AppLogger = AppLogger;
exports.AppLogger = AppLogger = __decorate([
    (0, common_1.Injectable)()
], AppLogger);
//# sourceMappingURL=logger.service.js.map