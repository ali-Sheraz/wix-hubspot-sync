"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const mappings_module_1 = require("./mappings/mappings.module");
const sync_module_1 = require("./sync/sync.module");
const forms_module_1 = require("./forms/forms.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const hubspot_module_1 = require("./hubspot/hubspot.module");
const wix_module_1 = require("./wix/wix.module");
const contacts_module_1 = require("./contacts/contacts.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            hubspot_module_1.HubspotModule,
            wix_module_1.WixModule,
            auth_module_1.AuthModule,
            mappings_module_1.MappingsModule,
            sync_module_1.SyncModule,
            forms_module_1.FormsModule,
            webhooks_module_1.WebhooksModule,
            contacts_module_1.ContactsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map