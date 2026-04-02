import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
export interface HubspotContact {
    id: string;
    properties: Record<string, string>;
    updatedAt?: string;
}
export interface HubspotContactInput {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    [key: string]: string | undefined;
}
export declare class HubspotService {
    private readonly configService;
    private readonly prisma;
    private readonly encryptionService;
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService, prisma: PrismaService, encryptionService: EncryptionService);
    getValidAccessToken(userId: string): Promise<string>;
    private refreshAccessToken;
    private getClient;
    getContactById(userId: string, hubspotContactId: string): Promise<HubspotContact | null>;
    searchContactByEmail(userId: string, email: string): Promise<HubspotContact | null>;
    createContact(userId: string, properties: HubspotContactInput): Promise<HubspotContact>;
    updateContact(userId: string, hubspotContactId: string, properties: HubspotContactInput): Promise<HubspotContact>;
    upsertContact(userId: string, properties: HubspotContactInput): Promise<HubspotContact>;
    getContactProperties(userId: string): Promise<Array<{
        name: string;
        label: string;
    }>>;
    registerWebhook(userId: string, targetUrl: string, eventType: string): Promise<void>;
}
