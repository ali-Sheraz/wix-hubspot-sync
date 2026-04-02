import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { Request } from 'express';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

class ContactDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
}

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all synced contacts' })
  async list(@Req() req: Request) {
    const userId = req['user']?.userId;
    return this.contactsService.listContacts(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create contact in both Wix and HubSpot' })
  async create(@Req() req: Request, @Body() body: ContactDto) {
    const userId = req['user']?.userId;
    return this.contactsService.createContact(userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact in both Wix and HubSpot' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: ContactDto) {
    const userId = req['user']?.userId;
    return this.contactsService.updateContact(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove contact mapping' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user']?.userId;
    await this.contactsService.deleteContact(userId, id);
  }
}
