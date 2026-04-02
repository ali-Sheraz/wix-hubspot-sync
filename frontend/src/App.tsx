import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, NavLink } from 'react-router-dom';
import ConnectPage from './pages/ConnectPage';
import FieldMappingPage from './pages/FieldMappingPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';

function TokenHandler() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, '', '/dashboard');
    }
    if (error) {
      alert(`OAuth error: ${error}`);
      window.history.replaceState({}, '', '/');
    }
  }, [location.search]);

  return null;
}

const navStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  padding: '8px 16px',
  textDecoration: 'none',
  color: isActive ? '#2563eb' : '#333',
  fontWeight: isActive ? 'bold' : 'normal',
  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
});

export default function App() {
  const isLoggedIn = !!localStorage.getItem('auth_token');

  return (
    <BrowserRouter>
      <TokenHandler />
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 24px',
        borderBottom: '1px solid #ddd',
        background: '#fff',
      }}>
        <span style={{ fontWeight: 'bold', marginRight: '16px', padding: '12px 0' }}>
          Wix ↔ HubSpot
        </span>
        {isLoggedIn && <NavLink to="/dashboard" style={navStyle}>Dashboard</NavLink>}
        {isLoggedIn && <NavLink to="/contacts" style={navStyle}>Contacts</NavLink>}
        <NavLink to="/" end style={navStyle}>
          {isLoggedIn ? 'Connection' : 'Connect HubSpot'}
        </NavLink>
        {isLoggedIn && <NavLink to="/mappings" style={navStyle}>Field Mappings</NavLink>}
      </nav>

      <main style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<ConnectPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/mappings" element={<FieldMappingPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
