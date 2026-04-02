import { useState, useEffect } from 'react';
import {
  getMappings,
  saveMappings,
  deleteMapping,
  getWixFields,
  getHubspotProperties,
  FieldMapping,
  FieldOption,
} from '../api/client';

type Direction = 'wix_to_hubspot' | 'hubspot_to_wix' | 'bidirectional';
type Transform = 'lowercase' | 'trim' | null;

interface RowDraft {
  id?: string;
  wixField: string;
  hubspotField: string;
  direction: Direction;
  transform: Transform;
}

const DIRECTION_LABELS: Record<Direction, string> = {
  wix_to_hubspot: 'Wix → HubSpot',
  hubspot_to_wix: 'HubSpot → Wix',
  bidirectional: 'Bi-directional',
};

const emptyRow = (): RowDraft => ({
  wixField: '',
  hubspotField: '',
  direction: 'bidirectional',
  transform: null,
});

export default function FieldMappingPage() {
  const [rows, setRows] = useState<RowDraft[]>([emptyRow()]);
  const [wixFields, setWixFields] = useState<FieldOption[]>([]);
  const [hubspotProps, setHubspotProps] = useState<FieldOption[]>([]);
  const [hubspotSearch, setHubspotSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [mappings, wix, hs] = await Promise.all([
        getMappings(),
        getWixFields(),
        getHubspotProperties(),
      ]);
      setWixFields(wix);
      setHubspotProps(hs);
      if (mappings.length > 0) {
        setRows(mappings.map((m: FieldMapping) => ({
          id: m.id,
          wixField: m.wixField,
          hubspotField: m.hubspotField,
          direction: m.direction,
          transform: m.transform,
        })));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setError(msg);
    }
  }

  function updateRow(index: number, patch: Partial<RowDraft>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  async function removeRow(index: number) {
    const row = rows[index];
    if (row.id) {
      try {
        await deleteMapping(row.id);
      } catch {
        // Ignore — will be removed on next save anyway
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    for (const row of rows) {
      if (!row.wixField || !row.hubspotField) {
        return 'All rows must have both Wix Field and HubSpot Property selected';
      }
    }

    const hubspotFields = rows.map((r) => r.hubspotField);
    const duplicates = hubspotFields.filter((f, i) => hubspotFields.indexOf(f) !== i);
    if (duplicates.length > 0) {
      return `Duplicate HubSpot property: ${duplicates[0]}`;
    }
    return null;
  }

  async function handleSave() {
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const saved = await saveMappings(
        rows.map(({ wixField, hubspotField, direction, transform }) => ({
          wixField,
          hubspotField,
          direction,
          transform,
        })),
      );
      setRows(saved.map((m: FieldMapping) => ({
        id: m.id,
        wixField: m.wixField,
        hubspotField: m.hubspotField,
        direction: m.direction,
        transform: m.transform,
      })));
      setSuccess('Mappings saved successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!localStorage.getItem('auth_token')) {
    return (
      <div>
        <h1>Field Mappings</h1>
        <p>Please <a href="/">register and connect HubSpot</a> first.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Field Mappings</h1>
      <p>Configure which Wix contact fields map to HubSpot contact properties.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Wix Field</th>
            <th style={{ padding: '8px' }}>
              HubSpot Property
              <input
                type="text"
                placeholder="Search..."
                value={hubspotSearch}
                onChange={(e) => setHubspotSearch(e.target.value)}
                style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '12px', width: '100px' }}
              />
            </th>
            <th style={{ padding: '8px' }}>Sync Direction</th>
            <th style={{ padding: '8px' }}>Transform</th>
            <th style={{ padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>
                <select
                  value={row.wixField}
                  onChange={(e) => updateRow(i, { wixField: e.target.value })}
                  style={{ width: '100%', padding: '4px' }}
                >
                  <option value="">-- Select Wix Field --</option>
                  {wixFields.map((f) => (
                    <option key={f.name} value={f.name}>{f.label}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '8px' }}>
                <select
                  value={row.hubspotField}
                  onChange={(e) => updateRow(i, { hubspotField: e.target.value })}
                  style={{ width: '100%', padding: '4px' }}
                >
                  <option value="">-- Select HubSpot Property --</option>
                  {hubspotProps
                    .filter((p) =>
                      !hubspotSearch ||
                      p.label?.toLowerCase().includes(hubspotSearch.toLowerCase()) ||
                      p.name.toLowerCase().includes(hubspotSearch.toLowerCase())
                    )
                    .map((p) => (
                      <option key={p.name} value={p.name}>{p.label || p.name}</option>
                    ))}
                </select>
              </td>
              <td style={{ padding: '8px' }}>
                <select
                  value={row.direction}
                  onChange={(e) => updateRow(i, { direction: e.target.value as Direction })}
                  style={{ padding: '4px' }}
                >
                  {(Object.entries(DIRECTION_LABELS) as [Direction, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '8px' }}>
                <select
                  value={row.transform ?? ''}
                  onChange={(e) => updateRow(i, { transform: (e.target.value || null) as Transform })}
                  style={{ padding: '4px' }}
                >
                  <option value="">None</option>
                  <option value="lowercase">Lowercase</option>
                  <option value="trim">Trim</option>
                </select>
              </td>
              <td style={{ padding: '8px' }}>
                <button
                  onClick={() => removeRow(i)}
                  style={{ padding: '4px 8px', color: 'red', background: 'none', border: '1px solid red', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <button onClick={addRow} style={{ padding: '8px 16px' }}>
          + Add Row
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '8px 16px', background: '#0057e7', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {saving ? 'Saving...' : 'Save Mappings'}
        </button>
      </div>
    </div>
  );
}
