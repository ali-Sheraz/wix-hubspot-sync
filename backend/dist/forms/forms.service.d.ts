import { PrismaService } from '../prisma/prisma.service';
import { HubspotService } from '../hubspot/hubspot.service';
export interface WixFormSubmission {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    customFields?: Record<string, string>;
    attribution?: {
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
        utmTerm?: string;
        utmContent?: string;
        pageUrl?: string;
        referrer?: string;
    };
    formId?: string;
    submittedAt?: string;
}
export declare class FormsService {
    private readonly prisma;
    private readonly hubspotService;
    private readonly logger;
    constructor(prisma: PrismaService, hubspotService: HubspotService);
    handleFormSubmission(userId: string, submission: WixFormSubmission): Promise<{
        hubspotContactId: string;
    }>;
}
