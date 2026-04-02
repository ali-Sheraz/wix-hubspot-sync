import { Request } from 'express';
import { MappingsService } from './mappings.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
declare class FieldMappingDto {
    wixField: string;
    hubspotField: string;
    direction: 'wix_to_hubspot' | 'hubspot_to_wix' | 'bidirectional';
    transform?: 'lowercase' | 'trim' | null;
}
declare class SaveMappingsDto {
    mappings: FieldMappingDto[];
}
export declare class MappingsController {
    private readonly mappingsService;
    private readonly jwtService;
    private readonly configService;
    constructor(mappingsService: MappingsService, jwtService: JwtService, configService: ConfigService);
    getMappings(req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        wixField: string;
        hubspotField: string;
        direction: string;
        transform: string | null;
    }[]>;
    saveMappings(req: Request, body: SaveMappingsDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        wixField: string;
        hubspotField: string;
        direction: string;
        transform: string | null;
    }[]>;
    deleteMapping(req: Request, id: string): Promise<void>;
    getWixFields(): Promise<{
        name: string;
        label: string;
    }[]>;
    getHubspotProperties(req: Request): Promise<{
        name: string;
        label: string;
    }[]>;
}
export {};
