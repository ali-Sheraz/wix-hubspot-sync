import axios from 'axios';

const BASE_URL = '/api';

const client = axios.create({ baseURL: BASE_URL });

// Attach JWT from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function register(email: string, wixSiteId?: string) {
  const res = await client.post('/auth/hubspot/register', { email, wixSiteId });
  return res.data as { userId: string; token: string };
}

export async function getConnectionStatus() {
  const res = await client.get('/auth/hubspot/status');
  return res.data as { connected: boolean };
}

export function buildConnectUrl(userId: string, email: string): string {
  return `/api/auth/hubspot/connect?userId=${userId}&email=${encodeURIComponent(email)}`;
}

export async function disconnect() {
  await client.post('/auth/hubspot/disconnect');
}

// ── Field Mappings ───────────────────────────────────────────────────────────

export interface FieldMapping {
  id: string;
  wixField: string;
  hubspotField: string;
  direction: 'wix_to_hubspot' | 'hubspot_to_wix' | 'bidirectional';
  transform: 'lowercase' | 'trim' | null;
}

export interface FieldOption {
  name: string;
  label: string;
}

export async function getMappings(): Promise<FieldMapping[]> {
  const res = await client.get('/mappings');
  return res.data;
}

export async function saveMappings(
  mappings: Omit<FieldMapping, 'id'>[],
): Promise<FieldMapping[]> {
  const res = await client.post('/mappings', { mappings });
  return res.data;
}

export async function deleteMapping(id: string): Promise<void> {
  await client.delete(`/mappings/${id}`);
}

export async function getWixFields(): Promise<FieldOption[]> {
  const res = await client.get('/mappings/wix-fields');
  return res.data;
}

export async function getHubspotProperties(): Promise<FieldOption[]> {
  const res = await client.get('/mappings/hubspot-properties');
  return res.data;
}

// ── Sync ─────────────────────────────────────────────────────────────────────

export async function syncWixToHubspot(wixContactId: string) {
  const res = await client.post('/sync/wix-to-hubspot', { wixContactId });
  return res.data;
}

export async function syncHubspotToWix(hubspotContactId: string) {
  const res = await client.post('/sync/hubspot-to-wix', { hubspotContactId });
  return res.data;
}

export async function getSyncLogs() {
  const res = await client.get('/sync/logs');
  return res.data;
}
