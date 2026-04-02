import { Module } from '@nestjs/common';
import { WixService } from './wix.service';

@Module({
  providers: [WixService],
  exports: [WixService],
})
export class WixModule {}
