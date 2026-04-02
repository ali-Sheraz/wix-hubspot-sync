import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MappingsModule } from './mappings/mappings.module';
import { SyncModule } from './sync/sync.module';
import { FormsModule } from './forms/forms.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HubspotModule } from './hubspot/hubspot.module';
import { WixModule } from './wix/wix.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HubspotModule,
    WixModule,
    AuthModule,
    MappingsModule,
    SyncModule,
    FormsModule,
    WebhooksModule,
    ContactsModule,
  ],
})
export class AppModule {}
