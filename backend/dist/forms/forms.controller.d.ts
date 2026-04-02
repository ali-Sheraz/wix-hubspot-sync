import { Request } from 'express';
import { FormsService } from './forms.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
declare class AttributionDto {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    pageUrl?: string;
    referrer?: string;
}
declare class WixFormSubmissionDto {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    customFields?: Record<string, string>;
    attribution?: AttributionDto;
    formId?: string;
    submittedAt?: string;
}
export declare class FormsController {
    private readonly formsService;
    private readonly jwtService;
    private readonly configService;
    constructor(formsService: FormsService, jwtService: JwtService, configService: ConfigService);
    handleWixSubmission(req: Request, body: WixFormSubmissionDto): Promise<{
        hubspotContactId: string;
    }>;
}
export {};
