import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { HubspotModule } from '../hubspot/hubspot.module';
import { WixModule } from '../wix/wix.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    HubspotModule,
    WixModule,
    SyncModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
