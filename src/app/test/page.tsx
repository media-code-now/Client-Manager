'use client';

import { useState } from 'react';

export default function TestPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'noam@nsmprime.com',
          password: 'NoamSadi1!'
        })
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, login: data }));
      
      if (data.success && data.tokens) {
        localStorage.setItem('crm_access_token', data.tokens.accessToken);
        localStorage.setItem('crm_refresh_token', data.tokens.refreshToken);
      }
    } catch (error) {
      setResults(prev => ({ ...prev, login: { error: String(error) } }));
    }
    setLoading(false);
  };

  const testClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('crm_access_token');
      if (!token) {
        setResults(prev => ({ ...prev, clients: { error: 'No token found' } }));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, clients: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, clients: { error: String(error) } }));
    }
    setLoading(false);
  };

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setResults(prev => ({ ...prev, health: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, health: { error: String(error) } }));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">
          CRM API Test Page
        </h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testHealth}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Health Check
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Login
          </button>
          
          <button
            onClick={testClients}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Clients API
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white capitalize">
                {key} Results
              </h3>
              <pre className="bg-slate-100 dark:bg-slate-700 p-4 rounded text-sm overflow-auto text-slate-800 dark:text-slate-200">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}