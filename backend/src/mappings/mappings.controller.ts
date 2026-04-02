import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { IsString, IsIn, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MappingsService } from './mappings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

class FieldMappingDto {
  @IsString()
  wixField: string;

  @IsString()
  hubspotField: string;

  @IsIn(['wix_to_hubspot', 'hubspot_to_wix', 'bidirectional'])
  direction: 'wix_to_hubspot' | 'hubspot_to_wix' | 'bidirectional';

  @IsOptional()
  @IsIn(['lowercase', 'trim', null])
  transform?: 'lowercase' | 'trim' | null;
}

class SaveMappingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  mappings: FieldMappingDto[];
}

@ApiTags('Mappings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mappings')
export class MappingsController {
  constructor(
    private readonly mappingsService: MappingsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all field mappings for current user' })
  async getMappings(@Req() req: Request) {
    const userId = req['user']?.userId;
    return this.mappingsService.getFieldMappings(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Save/replace all field mappings' })
  async saveMappings(@Req() req: Request, @Body() body: SaveMappingsDto) {
    const userId = req['user']?.userId;
    return this.mappingsService.saveMappings(userId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific field mapping' })
  async deleteMapping(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user']?.userId;
    await this.mappingsService.deleteMapping(userId, id);
  }

  @Get('wix-fields')
  @ApiOperation({ summary: 'Get available Wix contact fields' })
  async getWixFields() {
    return this.mappingsService.getWixFields();
  }

  @Get('hubspot-properties')
  @ApiOperation({ summary: 'Get available HubSpot contact properties' })
  async getHubspotProperties(@Req() req: Request) {
    const userId = req['user']?.userId;
    return this.mappingsService.getHubspotProperties(userId);
  }
}
