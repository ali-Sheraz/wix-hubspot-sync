import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  providers: [HubspotService, EncryptionService],
  exports: [HubspotService],
})
export class HubspotModule {}
