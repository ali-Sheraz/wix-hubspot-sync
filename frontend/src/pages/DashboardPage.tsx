import { useState, useEffect } from 'react';
import { getConnectionStatus, syncWixToHubspot, syncHubspotToWix, getSyncLogs } from '../api/client';

interface SyncLog {
  id: string;
  source: string;
  direction: string;
  status: string;
  entityId: string;
  errorMsg: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [wixContactId, setWixContactId] = useState('');
  const [hubspotContactId, setHubspotContactId] = useState('');
  const [loading, setLoading] = useState('');
  const [result, setResult] = useState<{ status: string; syncId?: string; reason?: string } | null>(null);

  useEffect(() => {
    loadStatus();
    loadLogs();
  }, []);

  async function loadStatus() {
    try {
      const data = await getConnectionStatus();
      setConnected(data.connected);
    } catch {
      setConnected(false);
    }
  }

  async function loadLogs() {
    try {
      const data = await getSyncLogs();
      setLogs(data);
    } catch {
      setLogs([]);
    }
  }

  async function handleWixToHubspot() {
    if (!wixContactId.trim()) return alert('Enter a Wix Contact ID');
    setLoading('wix');
    setResult(null);
    try {
      const res = await syncWixToHubspot(wixContactId.trim());
      setResult(res);
      loadLogs();
    } catch {
      setResult({ status: 'failed', reason: 'Request failed' });
    } finally {
      setLoading('');
    }
  }

  async function handleHubspotToWix() {
    if (!hubspotContactId.trim()) return alert('Enter a HubSpot Contact ID');
    setLoading('hubspot');
    setResult(null);
    try {
      const res = await syncHubspotToWix(hubspotContactId.trim());
      setResult(res);
      loadLogs();
    } catch {
      setResult({ status: 'failed', reason: 'Request failed' });
    } finally {
      setLoading('');
    }
  }

  const statusColor = (s: string) =>
    s === 'success' ? '#16a34a' : s === 'skipped' ? '#d97706' : '#dc2626';

  const directionLabel: Record<string, string> = {
    wix_to_hubspot: 'Wix → HubSpot',
    hubspot_to_wix: 'HubSpot → Wix',
    form: 'Form → HubSpot',
  };

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Connection Status */}
      <section style={{ padding: '16px', border: '1px solid #ddd', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>HubSpot Connection</h2>
        {connected === null && <p>Checking...</p>}
        {connected === true && <p style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ HubSpot is connected</p>}
        {connected === false && (
          <p style={{ color: '#dc2626' }}>
            ✗ HubSpot is not connected.{' '}
            <a href="/">Go to Connect page</a>
          </p>
        )}
      </section>

      {/* Sync Tools */}
      <section style={{ padding: '16px', border: '1px solid #ddd', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>Manual Sync</h2>
        <p style={{ color: '#555', fontSize: '14px' }}>
          Use these to manually trigger a sync for a specific contact.
        </p>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Wix → HubSpot */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h3 style={{ marginTop: 0 }}>Wix → HubSpot</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Push a Wix contact into HubSpot CRM.
              <br />Find the Contact ID in your Wix dashboard URL.
            </p>
            <input
              type="text"
              placeholder="Wix Contact ID (UUID)"
              value={wixContactId}
              onChange={(e) => setWixContactId(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box', border: '1px solid #ccc' }}
            />
            <button
              onClick={handleWixToHubspot}
              disabled={loading === 'wix'}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', width: '100%' }}
            >
              {loading === 'wix' ? 'Syncing...' : 'Sync Wix → HubSpot'}
            </button>
          </div>

          {/* HubSpot → Wix */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h3 style={{ marginTop: 0 }}>HubSpot → Wix</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Pull a HubSpot contact into Wix contacts.
              <br />Find the Contact ID in your HubSpot CRM.
            </p>
            <input
              type="text"
              placeholder="HubSpot Contact ID (number)"
              value={hubspotContactId}
              onChange={(e) => setHubspotContactId(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box', border: '1px solid #ccc' }}
            />
            <button
              onClick={handleHubspotToWix}
              disabled={loading === 'hubspot'}
              style={{ padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer', width: '100%' }}
            >
              {loading === 'hubspot' ? 'Syncing...' : 'Sync HubSpot → Wix'}
            </button>
          </div>
        </div>

        {/* Sync Result */}
        {result && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: result.status === 'success' ? '#f0fdf4' : result.status === 'skipped' ? '#fffbeb' : '#fef2f2',
            border: `1px solid ${statusColor(result.status)}`,
          }}>
            <strong style={{ color: statusColor(result.status) }}>
              {result.status === 'success' ? '✓ Sync successful' : result.status === 'skipped' ? '⚠ Sync skipped' : '✗ Sync failed'}
            </strong>
            {result.syncId && <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>Sync ID: {result.syncId}</p>}
            {result.reason && <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>Reason: {result.reason}</p>}
          </div>
        )}
      </section>

      {/* Form Submission Info */}
      <section style={{ padding: '16px', border: '1px solid #ddd', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>Form Lead Capture</h2>
        <p style={{ fontSize: '14px', color: '#555' }}>
          When a visitor submits a form on your Wix site, call this endpoint to instantly create them as a lead in HubSpot with UTM tracking.
        </p>
        <div style={{ background: '#f4f4f4', padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
          <div>POST /forms/wix-submission</div>
          <div style={{ color: '#555', marginTop: '8px' }}>
            {`{
  "email": "visitor@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "attribution": {
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "summer-sale",
    "pageUrl": "https://yoursite.com/landing"
  }
}`}
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
          Include your JWT token in the Authorization header.
        </p>
      </section>

      {/* Sync Logs */}
      <section style={{ padding: '16px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Sync History</h2>
          <button onClick={loadLogs} style={{ padding: '4px 12px', cursor: 'pointer' }}>Refresh</button>
        </div>
        <p style={{ fontSize: '13px', color: '#666' }}>Last 50 sync operations</p>

        {logs.length === 0 ? (
          <p style={{ color: '#999' }}>No sync activity yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Time</th>
                <th style={{ padding: '8px' }}>Direction</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}>Contact ID</th>
                <th style={{ padding: '8px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {directionLabel[log.direction ?? log.source] ?? log.source}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: statusColor(log.status), fontWeight: 'bold' }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                    {log.entityId ?? '—'}
                  </td>
                  <td style={{ padding: '8px', color: '#888', fontSize: '12px' }}>
                    {log.errorMsg ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
