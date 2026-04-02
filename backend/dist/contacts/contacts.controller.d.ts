import { Request } from 'express';
import { ContactsService } from './contacts.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
declare class ContactDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}
export declare class ContactsController {
    private readonly contactsService;
    private readonly jwtService;
    private readonly configService;
    constructor(contactsService: ContactsService, jwtService: JwtService, configService: ConfigService);
    list(req: Request): Promise<{
        id: string;
        wixContactId: string;
        hubspotContactId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        lastSyncedAt: Date;
        lastSyncSource: string;
    }[]>;
    create(req: Request, body: ContactDto): Promise<{
        wixContactId: string;
        hubspotContactId: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
    }>;
    update(req: Request, id: string, body: ContactDto): Promise<{
        success: boolean;
        email: string;
        firstName: string;
        lastName: string;
    }>;
    remove(req: Request, id: string): Promise<void>;
}
export {};
