'use client';

import React, { useState, useEffect } from 'react';
import TimeTracker from '@/components/TimeTracker';
import { formatHours } from '@/lib/time-tracking';
import { CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface TaskWithTracking {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  totalHours?: number;
  billableHours?: number;
}

export default function TimeTrackingPage() {
  const [tasks, setTasks] = useState<TaskWithTracking[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data = await response.json();
      setTasks(data.data || []);

      // Select first task by default
      if (data.data && data.data.length > 0) {
        setSelectedTaskId(data.data[0].id);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⏱️ Time Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track time spent on tasks, calculate billable hours, and export for invoicing
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create tasks to start tracking time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tasks list */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Your Tasks
              </h2>

              <div className="space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTaskId === task.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                          {task.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}>
                            {task.priority}
                          </span>
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time tracker */}
            {selectedTask && (
              <div className="lg:col-span-2">
                <TimeTracker
                  taskId={selectedTask.id}
                  taskTitle={selectedTask.title}
                  onEntryCreated={() => {
                    // Refresh task data if needed
                    loadTasks();
                  }}
                />

                {/* Task info card */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTask.dueDate && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Due Date
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-start gap-3">
                    <ClockIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Status
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                        {selectedTask.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick tips */}
        {!isLoading && tasks.length > 0 && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              💡 Tips for Effective Time Tracking
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>✓ Use the timer for real-time tracking during work</li>
              <li>✓ Add manual entries to log time worked in the past</li>
              <li>✓ Mark entries as billable or non-billable for accurate invoicing</li>
              <li>✓ Add notes to track what you worked on</li>
              <li>✓ Export your time entries as CSV for invoicing</li>
              <li>✓ Track at least 15-30 minute intervals for accuracy</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
