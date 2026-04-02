import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Request } from 'express';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

class SyncWixToHubspotDto {
  @IsString()
  wixContactId: string;
}

class SyncHubspotToWixDto {
  @IsString()
  hubspotContactId: string;
}

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('wix-to-hubspot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger Wix → HubSpot contact sync' })
  async syncWixToHubspot(@Req() req: Request, @Body() body: SyncWixToHubspotDto) {
    const userId = req['user']?.userId;
    return this.syncService.syncWixToHubspot(userId, body.wixContactId);
  }

  @Post('hubspot-to-wix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger HubSpot → Wix contact sync' })
  async syncHubspotToWix(@Req() req: Request, @Body() body: SyncHubspotToWixDto) {
    const userId = req['user']?.userId;
    return this.syncService.syncHubspotToWix(userId, body.hubspotContactId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get recent sync logs' })
  async getSyncLogs(@Req() req: Request) {
    const userId = req['user']?.userId;
    return this.syncService.getSyncLogs(userId);
  }
}
