import { PrismaService } from '../prisma/prisma.service';
import { HubspotService } from '../hubspot/hubspot.service';
export interface FieldMappingInput {
    wixField: string;
    hubspotField: string;
    direction: 'wix_to_hubspot' | 'hubspot_to_wix' | 'bidirectional';
    transform?: 'lowercase' | 'trim' | null;
}
export interface UpsertMappingsInput {
    mappings: FieldMappingInput[];
}
export declare const WIX_CONTACT_FIELDS: {
    name: string;
    label: string;
}[];
export declare class MappingsService {
    private readonly prisma;
    private readonly hubspotService;
    constructor(prisma: PrismaService, hubspotService: HubspotService);
    getFieldMappings(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        wixField: string;
        hubspotField: string;
        direction: string;
        transform: string | null;
    }[]>;
    saveMappings(userId: string, input: UpsertMappingsInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        wixField: string;
        hubspotField: string;
        direction: string;
        transform: string | null;
    }[]>;
    deleteMapping(userId: string, mappingId: string): Promise<void>;
    getWixFields(): Promise<{
        name: string;
        label: string;
    }[]>;
    getHubspotProperties(userId: string): Promise<{
        name: string;
        label: string;
    }[]>;
    applyTransform(value: string, transform?: string | null): string;
    buildHubspotPropertiesFromWix(userId: string, wixContact: Record<string, any>): Promise<Record<string, string>>;
    buildWixContactFromHubspot(userId: string, hubspotProperties: Record<string, any>): Promise<Record<string, any>>;
    private getNestedValue;
    private setNestedValue;
}
