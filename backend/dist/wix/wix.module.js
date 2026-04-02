"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WixModule = void 0;
const common_1 = require("@nestjs/common");
const wix_service_1 = require("./wix.service");
let WixModule = class WixModule {
};
exports.WixModule = WixModule;
exports.WixModule = WixModule = __decorate([
    (0, common_1.Module)({
        providers: [wix_service_1.WixService],
        exports: [wix_service_1.WixService],
    })
], WixModule);
//# sourceMappingURL=wix.module.js.map