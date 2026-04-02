import { ConfigService } from '@nestjs/config';
export interface WixContact {
    id: string;
    info: {
        name?: {
            first?: string;
            last?: string;
        };
        emails?: Array<{
            email: string;
            tag?: string;
        }>;
        phones?: Array<{
            phone: string;
            tag?: string;
        }>;
        [key: string]: any;
    };
    updatedDate?: string;
    revision?: string;
}
export interface WixContactInput {
    info: {
        name?: {
            first?: string;
            last?: string;
        };
        emails?: Array<{
            email: string;
            tag: string;
        }>;
        phones?: Array<{
            phone: string;
            tag: string;
        }>;
        extendedFields?: {
            items?: Record<string, any>;
        };
    };
}
export declare class WixService {
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    private getClient;
    getContactById(contactId: string): Promise<WixContact | null>;
    searchContactByEmail(email: string): Promise<WixContact | null>;
    createContact(input: WixContactInput): Promise<WixContact>;
    updateContact(contactId: string, revision: string, input: WixContactInput): Promise<WixContact>;
    upsertContact(input: WixContactInput): Promise<WixContact>;
    extractPrimaryEmail(contact: WixContact): string | undefined;
    extractPrimaryPhone(contact: WixContact): string | undefined;
}
