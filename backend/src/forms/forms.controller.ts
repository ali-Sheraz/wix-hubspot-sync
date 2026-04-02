import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Request } from 'express';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

class AttributionDto {
  @IsOptional() @IsString() utmSource?: string;
  @IsOptional() @IsString() utmMedium?: string;
  @IsOptional() @IsString() utmCampaign?: string;
  @IsOptional() @IsString() utmTerm?: string;
  @IsOptional() @IsString() utmContent?: string;
  @IsOptional() @IsString() pageUrl?: string;
  @IsOptional() @IsString() referrer?: string;
}

class WixFormSubmissionDto {
  @IsEmail()
  email: string;

  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;

  @IsOptional() @IsObject()
  customFields?: Record<string, string>;

  @IsOptional()
  @ValidateNested()
  @Type(() => AttributionDto)
  attribution?: AttributionDto;

  @IsOptional() @IsString() formId?: string;
  @IsOptional() @IsString() submittedAt?: string;
}

@ApiTags('Forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forms')
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Receive a Wix form submission and push it to HubSpot immediately.
   * Call this from your Wix site's form submission event handler.
   */
  @Post('wix-submission')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Wix form submission → create/update HubSpot contact' })
  async handleWixSubmission(@Req() req: Request, @Body() body: WixFormSubmissionDto) {
    const userId = req['user']?.userId;
    return this.formsService.handleFormSubmission(userId, body);
  }
}
