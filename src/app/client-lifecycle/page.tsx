'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientLifecycle from '@/components/ClientLifecycle';
import {
  CheckCircleIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Client {
  id: number;
  name: string;
  email?: string;
  company?: string;
  status: string;
  created_at: string;
}

interface LifecycleStats {
  prospect: number;
  lead: number;
  active: number;
  inactive: number;
  archived: number;
}

export default function ClientLifecyclePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<LifecycleStats | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClients();
  }, [selectedStage]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load clients');
      }

      const result = await response.json();
      const allClients = result.data || [];

      // Calculate statistics
      const newStats: LifecycleStats = {
        prospect: 0,
        lead: 0,
        active: 0,
        inactive: 0,
        archived: 0
      };

      allClients.forEach((client: Client) => {
        const stage = client.status.toLowerCase();
        if (stage in newStats) {
          newStats[stage as keyof LifecycleStats]++;
        }
      });

      setStats(newStats);

      // Filter by stage if selected
      if (selectedStage !== 'all') {
        const filtered = allClients.filter(
          (client: Client) => client.status.toLowerCase() === selectedStage
        );
        setClients(filtered);
      } else {
        setClients(allClients);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const stageConfig = {
    prospect: { icon: '🎯', color: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700 dark:text-blue-300' },
    lead: { icon: '📞', color: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-700 dark:text-purple-300' },
    active: { icon: '✅', color: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-700 dark:text-green-300' },
    inactive: { icon: '⏸️', color: 'bg-yellow-50 dark:bg-yellow-900/20', textColor: 'text-yellow-700 dark:text-yellow-300' },
    archived: { icon: '📁', color: 'bg-gray-50 dark:bg-gray-900/20', textColor: 'text-gray-700 dark:text-gray-300' }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Client Lifecycle Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage clients through their relationship lifecycle
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stage Statistics */}
        {stats && !selectedClientId && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { stage: 'prospect', label: 'Prospects', icon: '🎯' },
              { stage: 'lead', label: 'Leads', icon: '📞' },
              { stage: 'active', label: 'Active', icon: '✅' },
              { stage: 'inactive', label: 'Inactive', icon: '⏸️' },
              { stage: 'archived', label: 'Archived', icon: '📁' }
            ].map((item) => (
              <button
                key={item.stage}
                onClick={() => setSelectedStage(item.stage)}
                className={`p-4 rounded-lg transition-all cursor-pointer ${
                  selectedStage === item.stage
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:shadow-lg'
                }`}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-xs font-medium uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {stats[item.stage as keyof LifecycleStats]}
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedClientId ? (
          // Client detail view
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clients.find(c => c.id === selectedClientId)?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Lifecycle Stage Management
                </p>
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <ClientLifecycle
              clientId={selectedClientId}
              clientName={clients.find(c => c.id === selectedClientId)?.name || 'Client'}
            />
          </div>
        ) : (
          // Clients list view
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
                <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No clients in this stage
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedStage === 'all' ? 'Add a client to get started' : `No clients are currently in the ${selectedStage} stage`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => {
                  const stageKey = client.status.toLowerCase();
                  const config = stageConfig[stageKey as keyof typeof stageConfig] || stageConfig.prospect;

                  return (
                    <div
                      key={client.id}
                      className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {client.name}
                          </h3>
                          {client.company && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {client.company}
                            </p>
                          )}
                        </div>
                        <span className={`text-2xl ${config.textColor}`}>
                          {config.icon}
                        </span>
                      </div>

                      {client.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {client.email}
                        </p>
                      )}

                      <div className={`px-3 py-2 rounded ${config.color} mb-4`}>
                        <p className={`text-sm font-medium ${config.textColor}`}>
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)} Stage
                        </p>
                        <p className={`text-xs ${config.textColor} opacity-75 mt-1`}>
                          Since {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedClientId(client.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View Lifecycle
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
