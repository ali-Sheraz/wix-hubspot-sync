import { useState, useEffect } from 'react';
import axios from 'axios';

interface Contact {
  id: string;
  wixContactId: string;
  hubspotContactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lastSyncedAt: string;
  lastSyncSource: string;
}

const emptyForm = { firstName: '', lastName: '', email: '', phone: '' };

function getClient() {
  const token = localStorage.getItem('auth_token');
  return axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await getClient().get('/contacts');
      setContacts(res.data);
    } catch {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function openEdit(c: Contact) {
    setForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone });
    setEditingId(c.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit() {
    if (!form.email || !form.firstName) {
      setError('First name and email are required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await getClient().put(`/contacts/${editingId}`, form);
        setSuccess('Contact updated in both Wix and HubSpot');
      } else {
        await getClient().post('/contacts', form);
        setSuccess('Contact created in both Wix and HubSpot');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadContacts();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this contact mapping? (Contact stays in Wix and HubSpot)')) return;
    try {
      await getClient().delete(`/contacts/${id}`);
      setSuccess('Contact mapping removed');
      loadContacts();
    } catch {
      setError('Failed to remove contact');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Contacts</h1>
        <button
          onClick={openCreate}
          style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + New Contact
        </button>
      </div>
      <p style={{ color: '#555', marginTop: 0 }}>
        Contacts created here are automatically synced to both <strong>Wix</strong> and <strong>HubSpot</strong>.
      </p>

      {error && <p style={{ color: '#dc2626', background: '#fef2f2', padding: '10px' }}>{error}</p>}
      {success && <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px' }}>{success}</p>}

      {/* Create / Edit Form */}
      {showForm && (
        <div style={{ border: '1px solid #2563eb', padding: '20px', marginBottom: '24px', background: '#f8faff' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Contact' : 'Create New Contact'}</h3>
          <p style={{ fontSize: '13px', color: '#555' }}>
            {editingId
              ? 'Updates will be saved to both Wix and HubSpot immediately.'
              : 'This contact will be created in both Wix and HubSpot simultaneously.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="John"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="Doe"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="+1234567890"
              />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              {saving ? 'Saving...' : editingId ? 'Update Contact' : 'Create Contact'}
            </button>
            <button
              onClick={cancelForm}
              style={{ padding: '8px 24px', background: '#fff', border: '1px solid #ccc', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      {loading ? (
        <p>Loading contacts...</p>
      ) : contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed #ccc', color: '#999' }}>
          <p style={{ fontSize: '18px' }}>No contacts yet</p>
          <p>Click <strong>+ New Contact</strong> to create your first contact.<br />It will appear in both Wix and HubSpot automatically.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left', background: '#f9f9f9' }}>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Email</th>
              <th style={{ padding: '10px' }}>Phone</th>
              <th style={{ padding: '10px' }}>Wix Contact ID</th>
              <th style={{ padding: '10px' }}>HubSpot Contact ID</th>
              <th style={{ padding: '10px' }}>Last Synced</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>
                  {c.firstName} {c.lastName}
                </td>
                <td style={{ padding: '10px' }}>{c.email || '—'}</td>
                <td style={{ padding: '10px' }}>{c.phone || '—'}</td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>
                      {c.wixContactId}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.wixContactId); setSuccess('Wix ID copied!'); }}
                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', border: '1px solid #ccc' }}
                    >
                      Copy
                    </button>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>
                      {c.hubspotContactId}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.hubspotContactId); setSuccess('HubSpot ID copied!'); }}
                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', border: '1px solid #ccc' }}
                    >
                      Copy
                    </button>
                  </div>
                </td>
                <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                  {c.lastSyncedAt ? new Date(c.lastSyncedAt).toLocaleString() : '—'}
                </td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => openEdit(c)}
                    style={{ marginRight: '8px', padding: '4px 12px', cursor: 'pointer', border: '1px solid #ccc' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{ padding: '4px 12px', cursor: 'pointer', border: '1px solid #fca5a5', color: '#dc2626', background: 'none' }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
        <strong>Note:</strong> "Remove" only removes the link between Wix and HubSpot — it does not delete the contact from either system.
      </div>
    </div>
  );
}
