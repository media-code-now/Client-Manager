'use client';

import { useState, useEffect } from 'react';
import { TaskFilters } from '@/components/TaskFilters';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

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

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  client_name?: string;
  client_id?: number;
  assigned_to?: string;
}

interface Client {
  id: number;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ limit: 50, offset: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Get token from localStorage
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  // Fetch clients for filter dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch('/api/clients', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setClients(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  // Fetch filtered tasks
  const handleFilterChange = async (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/tasks/filtered?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data.data || []);
      setPagination(data.pagination || { total: 0, limit: 50, offset: 0, hasMore: false });

      // Count active filters
      const activeCount = Object.entries(newFilters).filter(
        ([key, value]) => value && key !== 'limit' && key !== 'offset'
      ).length;
      setActiveFilterCount(activeCount);
    } catch (error: any) {
      console.error('Error fetching filtered tasks:', error);
      setError(error.message || 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial tasks on mount
  useEffect(() => {
    handleFilterChange(filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'on-hold':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {pagination.total} total task{pagination.total !== 1 ? 's' : ''}
            {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        clients={clients}
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
          rounded-lg p-4 text-red-700 dark:text-red-200">
          <p className="font-medium">Error loading tasks</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tasks found</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {activeFilterCount > 0
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </p>
        </div>
      )}

      {/* Tasks Grid */}
      {!isLoading && tasks.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => {
            const daysUntilDue = getDaysUntilDue(task.due_date);
            const overdue = isOverdue(task.due_date);

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm 
                  border border-gray-200 dark:border-slate-700 hover:shadow-md 
                  transition-shadow cursor-pointer group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white 
                      group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Task Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ').charAt(0).toUpperCase() + 
                         task.status.replace('-', ' ').slice(1)}
                      </span>

                      {/* Priority Badge */}
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>

                      {/* Client */}
                      {task.client_name && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Client: {task.client_name}
                        </span>
                      )}

                      {/* Due Date */}
                      {task.due_date && (
                        <span className={`text-xs flex items-center gap-1 ${
                          overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 
                          daysUntilDue && daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {overdue && <ExclamationTriangleIcon className="h-3 w-3" />}
                          Due: {new Date(task.due_date).toLocaleDateString()}
                          {daysUntilDue !== null && !overdue && daysUntilDue >= 0 && (
                            <span className="ml-1">({daysUntilDue}d)</span>
                          )}
                        </span>
                      )}

                      {/* Assigned To */}
                      {task.assigned_to && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Assigned: {task.assigned_to}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Icon */}
                  {task.status === 'completed' && (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.total > pagination.limit && (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} 
              of {pagination.total} tasks
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newOffset = Math.max(0, pagination.offset - pagination.limit);
                  handleFilterChange({ ...filters, offset: newOffset });
                }}
                disabled={pagination.offset === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                  bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 
                  rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 
                  disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const newOffset = pagination.offset + pagination.limit;
                  handleFilterChange({ ...filters, offset: newOffset });
                }}
                disabled={!pagination.hasMore}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                  bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 
                  rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 
                  disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
