import { useState, useEffect } from 'react';
import {
  register,
  getConnectionStatus,
  buildConnectUrl,
  disconnect,
} from '../api/client';

interface Status {
  connected: boolean;
  userId?: string;
  email?: string;
}

export default function ConnectPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const savedEmail = localStorage.getItem('user_email') ?? '';
  const savedUserId = localStorage.getItem('user_id') ?? '';

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      checkStatus();
    }
  }, []);

  async function checkStatus() {
    try {
      const data = await getConnectionStatus();
      setStatus({
        connected: data.connected,
        email: localStorage.getItem('user_email') ?? undefined,
        userId: localStorage.getItem('user_id') ?? undefined,
      });
    } catch {
      setStatus({ connected: false });
    }
  }

  async function handleRegister() {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await register(email.trim());
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', data.userId);
      localStorage.setItem('user_email', email.trim());
      await checkStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleConnectHubspot() {
    const userId = localStorage.getItem('user_id') ?? savedUserId;
    const userEmail = localStorage.getItem('user_email') ?? savedEmail;
    if (!userId && !userEmail) {
      setError('Please register first');
      return;
    }
    // Full page redirect to OAuth flow
    window.location.href = buildConnectUrl(userId, userEmail);
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await disconnect();
      setStatus({ connected: false });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setLoading(false);
    }
  }

  const isLoggedIn = !!localStorage.getItem('auth_token');

  return (
    <div>
      <h1>HubSpot Connection</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoggedIn && (
        <section>
          <h2>Step 1: Register</h2>
          <p>Enter your email to create an account and get a session token.</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '8px', width: '280px', border: '1px solid #ccc' }}
            />
            <button onClick={handleRegister} disabled={loading} style={{ padding: '8px 16px' }}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </section>
      )}

      {isLoggedIn && (
        <section style={{ marginTop: '24px' }}>
          <h2>HubSpot Account</h2>
          {status === null ? (
            <p>Checking connection status...</p>
          ) : status.connected ? (
            <div>
              <p style={{ color: 'green' }}>✓ HubSpot is connected</p>
              {status.email && <p>Account: {status.email}</p>}
              <button onClick={handleDisconnect} disabled={loading} style={{ padding: '8px 16px', marginTop: '8px' }}>
                {loading ? 'Disconnecting...' : 'Disconnect HubSpot'}
              </button>
            </div>
          ) : (
            <div>
              <p>HubSpot is not connected.</p>
              <button onClick={handleConnectHubspot} style={{ padding: '8px 16px', marginTop: '8px' }}>
                Connect HubSpot
              </button>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                You will be redirected to HubSpot to authorize access.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
