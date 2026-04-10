'use client';

import React from 'react';

export default function DebugPage() {
  const [token, setToken] = React.useState<string | null>(null);
  const [clients, setClients] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    console.log('Token found:', !!t);
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      if (!token) {
        setError('No token found. You need to log in first.');
        return;
      }

      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setClients(data.clients || []);
        setError(null);
      } else {
        setError('API returned error: ' + data.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug: Client Health Score</h1>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>1. Authentication Status</h2>
        <p>
          <strong>Token in localStorage:</strong>{' '}
          {token ? (
            <span style={{ color: 'green' }}>✓ Found ({token.substring(0, 20)}...)</span>
          ) : (
            <span style={{ color: 'red' }}>✗ NOT FOUND - You must log in first</span>
          )}
        </p>
        <p>
          <strong>Action:</strong> <a href="/login">Go to Login</a>
        </p>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>2. Fetch Clients</h2>
        <button
          onClick={fetchClients}
          disabled={!token || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: token ? '#007bff' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: token ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Loading...' : 'Fetch Clients'}
        </button>

        {error && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ffcccc', color: '#cc0000' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {clients.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Clients Found: {clients.length}</strong>
            <ul>
              {clients.slice(0, 5).map((client: any) => (
                <li key={client.id}>
                  <strong>{client.name}</strong> ({client.email})
                  <br />
                  <a href={`/health-detail/${client.id}`} style={{ fontSize: '12px' }}>
                    View Health Score
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>3. Next Steps</h2>
        <ul>
          <li>If no token: <a href="/login">Log in first</a></li>
          <li>If token exists: Click "Fetch Clients" button above</li>
          <li>
            Once clients load: Go to <a href="/health">/health</a> to see the full health dashboard
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '10px', backgroundColor: '#e8f4f8', borderLeft: '4px solid #0066cc' }}>
        <h3>Debug Info</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          Token Status: {token ? 'EXISTS' : 'MISSING'}
          {'\n'}
          Clients Loaded: {clients.length}
          {'\n'}
          Error: {error || 'None'}
        </pre>
      </div>
    </div>
  );
}
