import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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

// Known Wix contact fields
export const WIX_CONTACT_FIELDS = [
  { name: 'info.name.first', label: 'First Name' },
  { name: 'info.name.last', label: 'Last Name' },
  { name: 'info.emails[0].email', label: 'Email' },
  { name: 'info.phones[0].phone', label: 'Phone' },
  { name: 'info.addresses[0].city', label: 'City' },
  { name: 'info.addresses[0].country', label: 'Country' },
  { name: 'info.company.name', label: 'Company' },
  { name: 'info.jobTitle', label: 'Job Title' },
];

@Injectable()
export class MappingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hubspotService: HubspotService,
  ) {}

  async getFieldMappings(userId: string) {
    const mappings = await this.prisma.fieldMapping.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return mappings;
  }

  async saveMappings(userId: string, input: UpsertMappingsInput) {
    const { mappings } = input;

    // Validate: no duplicate hubspotField (unless same mapping being overwritten)
    const hubspotFields = mappings.map((m) => m.hubspotField);
    const uniqueFields = new Set(hubspotFields);
    if (uniqueFields.size !== hubspotFields.length) {
      throw new ConflictException('Duplicate HubSpot field in mappings');
    }

    // Delete all existing and replace
    await this.prisma.$transaction([
      this.prisma.fieldMapping.deleteMany({ where: { userId } }),
      this.prisma.fieldMapping.createMany({
        data: mappings.map((m) => ({
          userId,
          wixField: m.wixField,
          hubspotField: m.hubspotField,
          direction: m.direction,
          transform: m.transform ?? null,
        })),
      }),
    ]);

    return this.getFieldMappings(userId);
  }

  async deleteMapping(userId: string, mappingId: string) {
    const existing = await this.prisma.fieldMapping.findFirst({
      where: { id: mappingId, userId },
    });
    if (!existing) throw new NotFoundException('Mapping not found');

    await this.prisma.fieldMapping.delete({ where: { id: mappingId } });
  }

  async getWixFields() {
    return WIX_CONTACT_FIELDS;
  }

  async getHubspotProperties(userId: string) {
    try {
      return await this.hubspotService.getContactProperties(userId);
    } catch {
      // Return defaults if HubSpot is not connected or call fails
      return [
        { name: 'email', label: 'Email' },
        { name: 'firstname', label: 'First Name' },
        { name: 'lastname', label: 'Last Name' },
        { name: 'phone', label: 'Phone Number' },
        { name: 'company', label: 'Company' },
        { name: 'jobtitle', label: 'Job Title' },
        { name: 'city', label: 'City' },
        { name: 'country', label: 'Country/Region' },
      ];
    }
  }

  /**
   * Apply a field mapping's transform to a value.
   */
  applyTransform(value: string, transform?: string | null): string {
    if (!value) return value;
    if (transform === 'lowercase') return value.toLowerCase();
    if (transform === 'trim') return value.trim();
    return value;
  }

  /**
   * Build HubSpot properties from a Wix contact using active field mappings.
   */
  async buildHubspotPropertiesFromWix(
    userId: string,
    wixContact: Record<string, any>,
  ): Promise<Record<string, string>> {
    const mappings = await this.prisma.fieldMapping.findMany({
      where: {
        userId,
        direction: { in: ['wix_to_hubspot', 'bidirectional'] },
      },
    });

    const result: Record<string, string> = {};
    for (const mapping of mappings) {
      const rawValue = this.getNestedValue(wixContact, mapping.wixField);
      if (rawValue !== undefined && rawValue !== null) {
        result[mapping.hubspotField] = this.applyTransform(String(rawValue), mapping.transform);
      }
    }
    return result;
  }

  /**
   * Build Wix contact info from a HubSpot contact using active field mappings.
   */
  async buildWixContactFromHubspot(
    userId: string,
    hubspotProperties: Record<string, any>,
  ): Promise<Record<string, any>> {
    const mappings = await this.prisma.fieldMapping.findMany({
      where: {
        userId,
        direction: { in: ['hubspot_to_wix', 'bidirectional'] },
      },
    });

    // Return a FLAT map of wixField path → value (same shape as flattenWixContact output)
    const result: Record<string, any> = {};
    for (const mapping of mappings) {
      const rawValue = hubspotProperties[mapping.hubspotField];
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        result[mapping.wixField] = this.applyTransform(String(rawValue), mapping.transform);
      }
    }
    return result;
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    // First check if path exists as a direct flat key (e.g. from flattenWixContact)
    if (path in obj) return obj[path];
    // Otherwise traverse nested object
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    return normalizedPath.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    const keys = normalizedPath.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }
}
