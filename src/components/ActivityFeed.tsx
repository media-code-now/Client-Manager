'use client';

import { useEffect, useState } from 'react';
import {
  ActivityType,
  ActivityItem,
  ActivityCategory,
  formatActivityForDisplay,
  groupActivitiesByDate,
  calculateActivitySummary,
  filterActivities,
  ActivityFilter,
  getActivityColor,
  getCategoryColor,
  ACTIVITY_DEFINITIONS,
} from '@/lib/activity-feed';
import {
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface ActivityFeedProps {
  clientId: number;
  compact?: boolean;
}

export default function ActivityFeed({ clientId, compact = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>({});
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated');
          return;
        }

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          stats: 'true',
        });

        if (filter.type) params.append('type', filter.type);
        if (search) params.append('search', search);
        if (filter.startDate) params.append('startDate', filter.startDate.toISOString());
        if (filter.endDate) params.append('endDate', filter.endDate.toISOString());

        const response = await fetch(
          `/api/clients/${clientId}/activity?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();

        if (data.data) {
          // If stats endpoint returned data instead of activities
          if (data.data.total_activities !== undefined) {
            setStats(data.data);
          } else {
            setActivities(data.data);
            setStats(data.stats);
          }
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [clientId, filter, search, offset, limit]);

  const filteredActivities = filterActivities(activities, filter);
  const grouped = groupActivitiesByDate(filteredActivities);
  const summary = calculateActivitySummary(filteredActivities);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/clients/${clientId}/activity`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          activityType: filter.type,
          startDate: filter.startDate,
          endDate: filter.endDate,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activities.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && !compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Activities"
            value={stats.total_activities}
            color="blue"
          />
          <StatCard
            label="Last Activity"
            value={stats.last_activity ? new Date(stats.last_activity).toLocaleDateString() : 'N/A'}
            color="green"
          />
          <StatCard
            label="Active Users"
            value={stats.unique_users}
            color="purple"
          />
          <StatCard
            label="This Week"
            value={summary.totalActivities}
            color="orange"
          />
        </div>
      )}

      {/* Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <FunnelIcon className="w-5 h-5" />
            Filter
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Type
                </label>
                <select
                  value={filter.type || ''}
                  onChange={e => setFilter({ ...filter, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  {Object.entries(ACTIVITY_DEFINITIONS).map(([key, def]) => (
                    <option key={key} value={key}>
                      {def.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filter.category || ''}
                  onChange={e => setFilter({ ...filter, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {Object.values(ActivityCategory).map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filter.startDate ? filter.startDate.toISOString().split('T')[0] : ''}
                  onChange={e => setFilter({ ...filter, startDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filter.endDate ? filter.endDate.toISOString().split('T')[0] : ''}
                  onChange={e => setFilter({ ...filter, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={() => setFilter({})}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No activities found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.date}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {group.dayName}
              </h3>

              <div className="space-y-3">
                {group.activities.map(activity => {
                  const formatted = formatActivityForDisplay(activity);
                  return (
                    <div
                      key={activity.id}
                      className={`p-4 border rounded-lg ${formatted.color}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{formatted.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{formatted.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(activity.category)}`}>
                              {activity.category}
                            </span>
                          </div>
                          {formatted.description && (
                            <p className="text-sm mt-1 opacity-90">{formatted.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                            <span>{activity.userEmail}</span>
                            <span>{formatted.relativeTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {activities.length >= limit && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
  };

  const textClasses = {
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-green-700 dark:text-green-300',
    purple: 'text-purple-700 dark:text-purple-300',
    orange: 'text-orange-700 dark:text-orange-300',
  };

  return (
    <div className={`border p-4 rounded-lg ${colorClasses[color]}`}>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textClasses[color]}`}>{value}</p>
    </div>
  );
}
