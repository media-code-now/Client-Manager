'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOptions {
  status?: string;
  priority?: string;
  clientId?: string;
  assignedTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface Client {
  id: number;
  name: string;
}

interface TaskFiltersProps {
  clients: Client[];
  onFilterChange: (filters: FilterOptions) => void;
  isLoading?: boolean;
}

export function TaskFilters({
  clients,
  onFilterChange,
  isLoading = false
}: TaskFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({ limit: 50, offset: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Quick filter buttons
  const quickFilters = [
    {
      label: 'Today',
      filters: {
        dueDateFrom: getTodayDate(),
        dueDateTo: getTodayDate()
      }
    },
    {
      label: 'This Week',
      filters: {
        dueDateFrom: getTodayDate(),
        dueDateTo: getWeekLaterDate()
      }
    },
    {
      label: 'Overdue',
      filters: {
        dueDateTo: getYesterdayDate(),
        status: 'pending'
      }
    },
    {
      label: 'Urgent',
      filters: {
        priority: 'critical'
      }
    }
  ];

  const handleFilterChange = useCallback(
    (newFilters: FilterOptions) => {
      const updatedFilters = { ...filters, ...newFilters, offset: 0 };
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    },
    [filters, onFilterChange]
  );

  const clearFilters = () => {
    const clearedFilters = { limit: 50, offset: 0 };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const applyQuickFilter = (quickFilter: any) => {
    handleFilterChange(quickFilter.filters);
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key as keyof FilterOptions];
    handleFilterChange(newFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value && key !== 'limit' && key !== 'offset'
  );

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Quick Filters
        </h3>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => applyQuickFilter(filter)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 
                text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50
                dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 
            dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 
            transition-colors w-full"
        >
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`}
          />
          Advanced Filters
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search || ''}
              onChange={(e) =>
                handleFilterChange({ search: e.target.value || undefined })
              }
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 dark:bg-slate-800 dark:text-white"
            />

            {/* Status */}
            <select
              value={filters.status || ''}
              onChange={(e) =>
                handleFilterChange({
                  status: e.target.value || undefined
                })
              }
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
            </select>

            {/* Priority */}
            <select
              value={filters.priority || ''}
              onChange={(e) =>
                handleFilterChange({
                  priority: e.target.value || undefined
                })
              }
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Client */}
            <select
              value={filters.clientId || ''}
              onChange={(e) =>
                handleFilterChange({
                  clientId: e.target.value || undefined
                })
              }
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            {/* Due Date From */}
            <input
              type="date"
              value={filters.dueDateFrom || ''}
              onChange={(e) =>
                handleFilterChange({
                  dueDateFrom: e.target.value || undefined
                })
              }
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 dark:bg-slate-800 dark:text-white"
            />

            {/* Due Date To */}
            <input
              type="date"
              value={filters.dueDateTo || ''}
              onChange={(e) =>
                handleFilterChange({
                  dueDateTo: e.target.value || undefined
                })
              }
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex flex-wrap gap-2 mb-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'limit' || key === 'offset') return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 
                    text-blue-700 rounded-full text-xs font-medium
                    dark:bg-blue-900 dark:text-blue-200"
                >
                  <span className="font-semibold">{formatFilterKey(key)}:</span>
                  {formatFilterValue(key, value)}
                  <button
                    onClick={() => removeFilter(key)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 
              dark:hover:text-blue-200 font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getWeekLaterDate(): string {
  const week = new Date();
  week.setDate(week.getDate() + 7);
  return week.toISOString().split('T')[0];
}

function formatFilterKey(key: string): string {
  const labels: Record<string, string> = {
    status: 'Status',
    priority: 'Priority',
    clientId: 'Client',
    assignedTo: 'Assigned To',
    dueDateFrom: 'Due From',
    dueDateTo: 'Due To',
    search: 'Search'
  };
  return labels[key] || key;
}

function formatFilterValue(key: string, value: any): string {
  if (key === 'dueDateFrom' || key === 'dueDateTo' || key === 'search') {
    return String(value);
  }
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}
