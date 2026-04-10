'use client';

import React, { useEffect, useState } from 'react';
import ClientHealthScore from '../../components/ClientHealthScore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Client {
  id: number;
  name: string;
  email: string;
  status: string;
}

export default function ClientHealthPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!token) {
          setError('Please log in first to view client health scores. Token not found in localStorage.');
          return;
        }

        const response = await fetch('/api/clients', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }

        const result = await response.json();
        if (result.success && Array.isArray(result.clients)) {
          setClients(result.clients);
          if (result.clients.length > 0) {
            setSelectedClient(result.clients[0].id);
          }
        } else {
          setError('No clients found');
        }
      } catch (err) {
        console.error('Clients fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/clients" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 mb-4">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Clients
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Health Scores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor client relationship health with AI-powered scoring
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Layout: Two columns on desktop, single on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List - Left Side */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Clients ({clients.length})
                </h2>
              </div>
              
              {loading ? (
                <div className="p-4">
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
              ) : clients.length === 0 ? (
                <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">No clients found</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                        selectedClient === client.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{client.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{client.email}</div>
                      <div className="text-xs mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${
                          client.status === 'active'
                            ? 'bg-green-500'
                            : client.status === 'inactive'
                            ? 'bg-gray-500'
                            : 'bg-yellow-500'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Health Score Display - Right Side */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-4">Loading health data...</p>
              </div>
            ) : selectedClient ? (
              <div className="space-y-6">
                {/* Health Score Card */}
                <ClientHealthScore
                  clientId={selectedClient}
                  clientName={clients.find(c => c.id === selectedClient)?.name || ''}
                />

                {/* Information Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">How Health Scores Work</h3>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li>📊 <strong>Score (0-100):</strong> Overall client relationship health</li>
                    <li>🔴 <strong>Overdue Tasks (-15 each):</strong> Each overdue task reduces score</li>
                    <li>⏳ <strong>Pending Tasks (-5 each):</strong> Open work in progress</li>
                    <li>🎉 <strong>Recent Activity (+10):</strong> Bonus for activity in last 7 days</li>
                    <li>✅ <strong>Completion Rate:</strong> Bonus if tasks are 80%+ completed</li>
                    <li>🔐 <strong>Credentials (+5):</strong> Bonus for recently updated credentials</li>
                  </ul>
                </div>

                {/* Score Ranges */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">90-100</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">Excellent</div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">70-89</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Good</div>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">50-69</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Needs Attention</div>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">&lt;50</div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">Critical</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Select a client to view health score</p>
              </div>
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Metrics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Instantly see overdue tasks, pending work, and completion rates
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get actionable recommendations to improve client relationships
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trend Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor improvement, stability, or decline over time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
