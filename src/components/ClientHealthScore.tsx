'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { HealthScoreData, generateHealthInsights } from '../lib/client-health-calculator';

interface ClientHealthScoreProps {
  clientId: number;
  clientName: string;
  token?: string;
}

export default function ClientHealthScore({
  clientId,
  clientName,
  token
}: ClientHealthScoreProps) {
  const [health, setHealth] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const fetchHealthScore = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from localStorage if not provided
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

        if (!authToken) {
          setError('Authentication token required');
          return;
        }

        const response = await fetch(`/api/clients/${clientId}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch health score: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setHealth(result.data);
          setInsights(generateHealthInsights(result.data));
        } else {
          setError(result.error || 'Failed to fetch health score');
        }
      } catch (err) {
        console.error('Health score fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch health score');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthScore();
  }, [clientId, token]);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  // Get color classes based on health status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'good':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'attention':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <div className="w-5 h-5 text-gray-400">→</div>;
    }
  };

  const statusColor = getStatusColor(health.healthStatus);

  return (
    <div className={`rounded-lg border p-6 ${statusColor}`}>
      {/* Header with Score */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Client Health Score</h3>
          <p className="text-sm opacity-75">{health.clientName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-4xl font-bold">{health.healthScore}</div>
            <div className="text-xs uppercase tracking-wide font-semibold">
              {health.healthStatus === 'excellent' && '✨ Excellent'}
              {health.healthStatus === 'good' && '👍 Good'}
              {health.healthStatus === 'attention' && '⚠️ Attention'}
              {health.healthStatus === 'critical' && '🚨 Critical'}
            </div>
          </div>
          <div>
            {getTrendIcon(health.trend)}
          </div>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              health.healthStatus === 'excellent' ? 'bg-green-500' :
              health.healthStatus === 'good' ? 'bg-blue-500' :
              health.healthStatus === 'attention' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${health.healthScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-2 opacity-60">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Overdue Tasks */}
        <div className="p-3 bg-white/50 dark:bg-black/20 rounded">
          <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-4 h-4" />
            Overdue
          </div>
          <div className="text-2xl font-bold">{health.overdueTasks}</div>
          <div className="text-xs opacity-60">tasks past due</div>
        </div>

        {/* Pending Tasks */}
        <div className="p-3 bg-white/50 dark:bg-black/20 rounded">
          <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Pending
          </div>
          <div className="text-2xl font-bold">{health.pendingTasks}</div>
          <div className="text-xs opacity-60">tasks in progress</div>
        </div>

        {/* Completion Rate */}
        <div className="p-3 bg-white/50 dark:bg-black/20 rounded">
          <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" />
            Completion
          </div>
          <div className="text-2xl font-bold">{health.completionRate}%</div>
          <div className="text-xs opacity-60">{health.completedTasks} of {health.totalTasks}</div>
        </div>

        {/* Activity */}
        <div className="p-3 bg-white/50 dark:bg-black/20 rounded">
          <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Activity
          </div>
          <div className="text-2xl font-bold">
            {health.daysWithoutActivity === 9999 ? '—' : health.daysWithoutActivity}
          </div>
          <div className="text-xs opacity-60">
            {health.daysWithoutActivity === 9999
              ? 'no activity'
              : health.daysWithoutActivity === 0
              ? 'active today'
              : health.daysWithoutActivity === 1
              ? 'yesterday'
              : `${health.daysWithoutActivity} days ago`}
          </div>
        </div>
      </div>

      {/* Credentials Section */}
      {health.credentialsCount > 0 && (
        <div className="mb-6 p-3 bg-white/50 dark:bg-black/20 rounded">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">Credentials</span>
          </div>
          <div className="text-2xl font-bold mb-1">{health.credentialsCount}</div>
          <div className="text-xs opacity-60">
            {health.credentialsNeedingUpdate > 0
              ? `${health.credentialsNeedingUpdate} need updating`
              : 'all current'}
          </div>
        </div>
      )}

      {/* Activity Status Badge */}
      {health.hasRecentActivity && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-800">
          <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            🔥 Active client with recent engagement
          </span>
        </div>
      )}

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="border-t border-current/20 pt-4">
          <h4 className="text-sm font-semibold mb-3">Key Insights</h4>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm opacity-85 flex items-start gap-2">
                <span className="mt-0.5 opacity-60">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Helpful Tips */}
      <div className="mt-4 pt-4 border-t border-current/20 text-xs opacity-70">
        <p>
          💡 <strong>Tip:</strong> Focus on reducing overdue tasks and increasing completion rate
          to improve this client's health score.
        </p>
      </div>
    </div>
  );
}
