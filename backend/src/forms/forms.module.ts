import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { HubspotModule } from '../hubspot/hubspot.module';

@Module({
  imports: [
    HubspotModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
