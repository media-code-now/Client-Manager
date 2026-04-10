'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  ListBulletIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  LIFECYCLE_STAGE_CONFIG,
  ClientLifecycleStage,
  calculateDaysInStage,
  calculateDaysSinceActivity,
  calculateRiskLevel,
  calculateEngagementScore,
  getRecommendedActions,
  isValidTransition
} from '@/lib/client-lifecycle';

interface ClientLifecycleData {
  client: {
    id: number;
    name: string;
    stage: string;
    createdAt: string;
  };
  metrics: {
    stage: string;
    daysInStage: number;
    lastActivityDate: string | null;
    daysSinceActivity: number | null;
    totalTasks: number;
    completedTasks: number;
    overdueTask: number;
  };
  transitions: Array<{
    id: number;
    from: string;
    to: string;
    reason?: string;
    date: string;
    initiatedBy: string;
  }>;
}

interface ClientLifecycleProps {
  clientId: number;
  clientName: string;
}

const stageOrder: ClientLifecycleStage[] = [
  ClientLifecycleStage.PROSPECT,
  ClientLifecycleStage.LEAD,
  ClientLifecycleStage.ACTIVE,
  ClientLifecycleStage.INACTIVE,
  ClientLifecycleStage.ARCHIVED
];

export default function ClientLifecycle({
  clientId,
  clientName
}: ClientLifecycleProps) {
  const [data, setData] = useState<ClientLifecycleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ClientLifecycleStage | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadLifecycleData();
  }, [clientId]);

  const loadLifecycleData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`/api/clients/${clientId}/lifecycle`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load lifecycle data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransitionClick = (stage: ClientLifecycleStage) => {
    if (data && isValidTransition(data.metrics.stage as ClientLifecycleStage, stage)) {
      setSelectedStage(stage);
      setTransitionReason('');
    }
  };

  const handleTransitionConfirm = async () => {
    if (!selectedStage || !data) return;

    try {
      setIsTransitioning(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(
        `/api/clients/${clientId}/lifecycle/transition`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            toStage: selectedStage,
            reason: transitionReason || undefined
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lifecycle');
      }

      setSuccess(`Client moved to ${selectedStage} stage`);
      setSelectedStage(null);
      setTransitionReason('');
      loadLifecycleData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsTransitioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading lifecycle data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No lifecycle data available
      </div>
    );
  }

  const currentStage = data.metrics.stage as ClientLifecycleStage;
  const stageConfig = LIFECYCLE_STAGE_CONFIG[currentStage];
  const completionRate = data.metrics.totalTasks > 0
    ? Math.round((data.metrics.completedTasks / data.metrics.totalTasks) * 100)
    : 0;

  const riskLevel = calculateRiskLevel(
    currentStage,
    data.metrics.daysInStage,
    data.metrics.daysSinceActivity || 999,
    data.metrics.overdueTask
  );

  const engagementScore = calculateEngagementScore(
    data.metrics.totalTasks,
    data.metrics.completedTasks,
    data.metrics.daysSinceActivity || 999,
    0
  );

  const recommendedActions = getRecommendedActions(
    currentStage,
    data.metrics.daysInStage,
    data.metrics.daysSinceActivity || 999
  );

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Current Stage Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Current Stage
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stageConfig.icon} {stageConfig.displayName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {stageConfig.description}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full font-medium ${
            riskLevel === 'high'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : riskLevel === 'medium'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </div>
        </div>

        {/* Timeline Info */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Days in Stage
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {data.metrics.daysInStage}
            </p>
          </div>
          {data.metrics.daysSinceActivity !== null && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Days Since Activity
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.metrics.daysSinceActivity}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Engagement
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {engagementScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tasks Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.metrics.completedTasks}/{data.metrics.totalTasks}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-3 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {completionRate}% complete
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Overdue Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.metrics.overdueTask}
              </p>
            </div>
            {data.metrics.overdueTask > 0 && (
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Last Activity
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.metrics.daysSinceActivity ?? '—'}d ago
              </p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Lifecycle Pipeline */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Lifecycle Pipeline
        </h3>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {stageOrder.map((stage, index) => {
            const isCurrentStage = stage === currentStage;
            const isCompleted = stageOrder.indexOf(stage) < stageOrder.indexOf(currentStage);
            const canTransitionTo = isValidTransition(currentStage, stage);
            const stageConfigItem = LIFECYCLE_STAGE_CONFIG[stage];

            return (
              <div key={stage} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => canTransitionTo && handleTransitionClick(stage)}
                  disabled={!canTransitionTo && stage !== currentStage}
                  className={`flex flex-col items-center justify-center min-w-[120px] py-4 px-3 rounded-lg transition-all ${
                    isCurrentStage
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : isCompleted
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : canTransitionTo
                      ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 cursor-pointer'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-600 opacity-50'
                  }`}
                >
                  <span className="text-xl mb-1">{stageConfigItem.icon}</span>
                  <span className="text-xs font-medium text-center">
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </span>
                </button>

                {index < stageOrder.length - 1 && (
                  <div
                    className={`h-1 w-8 mx-1 ${
                      isCompleted || isCurrentStage
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Actions */}
      {recommendedActions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <ListBulletIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Recommended Next Steps
              </h4>
              <ul className="space-y-2">
                {recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                    <span className="text-blue-800 dark:text-blue-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Transition History */}
      {data.transitions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Stage Transition History
          </h3>

          <div className="space-y-3">
            {data.transitions.map((transition, index) => (
              <div
                key={transition.id}
                className="flex items-start gap-3 pb-3 border-b dark:border-slate-700 last:border-b-0 last:pb-0"
              >
                <ArrowPathIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {transition.from} → {transition.to}
                  </p>
                  {transition.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {transition.reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(transition.date).toLocaleDateString()} by {transition.initiatedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transition Modal */}
      {selectedStage && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Move to {selectedStage.charAt(0).toUpperCase() + selectedStage.slice(1)}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {LIFECYCLE_STAGE_CONFIG[selectedStage].description}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="Why are you moving this client to this stage?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStage(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleTransitionConfirm}
                disabled={isTransitioning}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md"
              >
                {isTransitioning ? 'Moving...' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
