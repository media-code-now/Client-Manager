'use client';

import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { formatHours, validateTimeEntry } from '@/lib/time-tracking';

interface TimeEntry {
  id: number;
  taskId: number;
  userId: string;
  date: string;
  hoursWorked: number;
  notes?: string;
  billable: boolean;
  createdAt: string;
}

interface TimeTrackerProps {
  taskId: number;
  taskTitle: string;
  onEntryCreated?: (entry: TimeEntry) => void;
}

export default function TimeTracker({
  taskId,
  taskTitle,
  onEntryCreated
}: TimeTrackerProps) {
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Manual entry form
  const [manualHours, setManualHours] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [billable, setBillable] = useState(true);
  
  // Entries list
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [taskId]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [isRunning, timerInterval]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `/api/tasks/time-entries?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load time entries');
      }

      const data = await response.json();
      setEntries(data.data.entries);
    } catch (err) {
      console.error('Error loading entries:', err);
      setError('Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setIsRunning(true);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setElapsedSeconds(0);
    setIsRunning(false);
  };

  const handleSaveTimerEntry = async () => {
    const hours = elapsedSeconds / 3600;
    
    if (hours === 0) {
      setError('Please track some time before saving');
      return;
    }

    const validation = validateTimeEntry({
      hoursWorked: hours,
      date: new Date().toISOString().split('T')[0]
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid time entry');
      return;
    }

    await saveTimeEntry({
      taskId,
      hoursWorked: parseFloat(hours.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      notes: 'Time tracked from timer',
      billable: true
    });

    setElapsedSeconds(0);
    setIsRunning(false);
  };

  const handleSaveManualEntry = async () => {
    if (!manualHours) {
      setError('Please enter hours worked');
      return;
    }

    const hours = parseFloat(manualHours);
    const validation = validateTimeEntry({
      hoursWorked: hours,
      date: manualDate
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid time entry');
      return;
    }

    await saveTimeEntry({
      taskId,
      hoursWorked: hours,
      date: manualDate,
      notes: notes || undefined,
      billable
    });

    setManualHours('');
    setNotes('');
    setManualDate(new Date().toISOString().split('T')[0]);
    setBillable(true);
  };

  const saveTimeEntry = async (entry: {
    taskId: number;
    hoursWorked: number;
    date: string;
    notes?: string;
    billable: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/tasks/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save time entry');
      }

      const result = await response.json();
      setSuccess(`Time entry saved: ${formatHours(entry.hoursWorked)}`);
      setEntries(prev => [result.data, ...prev]);
      
      if (onEntryCreated) {
        onEntryCreated(result.data);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save time entry');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`/api/tasks/time-entries?entryId=${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete time entry');
      }

      setEntries(prev => prev.filter(e => e.id !== entryId));
      setSuccess('Time entry deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete time entry');
    }
  };

  const getTotalHours = (): number => {
    return entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  };

  const getBillableHours = (): number => {
    return entries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.hoursWorked, 0);
  };

  const exportAsCSV = () => {
    const headers = ['Date', 'Hours', 'Billable', 'Notes'];
    const rows = entries.map(e => [
      e.date,
      e.hoursWorked,
      e.billable ? 'Yes' : 'No',
      e.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `time-entries-task-${taskId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Time Tracking - {taskTitle}
      </h3>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('timer')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'timer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Timer
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {/* Timer mode */}
      {mode === 'timer' && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-5xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-4">
              {formatTime(elapsedSeconds)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatHours(elapsedSeconds / 3600)}
            </p>
          </div>

          <div className="flex gap-3 justify-center mb-6">
            {!isRunning ? (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <PlayIcon className="w-5 h-5" />
                Start
              </button>
            ) : (
              <button
                onClick={handlePauseTimer}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
              >
                <PauseIcon className="w-5 h-5" />
                Pause
              </button>
            )}

            <button
              onClick={handleResetTimer}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              <StopIcon className="w-5 h-5" />
              Reset
            </button>

            <button
              onClick={handleSaveTimerEntry}
              disabled={elapsedSeconds === 0 || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              <CheckIcon className="w-5 h-5" />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Manual entry mode */}
      {mode === 'manual' && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6 mb-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Billable hours
              </span>
            </label>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveManualEntry}
                disabled={!manualHours || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                <CheckIcon className="w-5 h-5" />
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Total Hours
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            {formatHours(getTotalHours())}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
            Billable
          </p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
            {formatHours(getBillableHours())}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
            Entries
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
            {entries.length}
          </p>
        </div>
      </div>

      {/* Entries list */}
      {entries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Time Entries
            </h4>
            <button
              onClick={exportAsCSV}
              className="flex items-center gap-2 text-sm px-3 py-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/30 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {entry.date} - {formatHours(entry.hoursWorked)}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    entry.billable
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {entry.billable ? 'Billable' : 'Non-billable'}
                  </span>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="Delete entry"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
        </div>
      )}

      {entries.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No time entries yet. Start tracking to see entries here.
        </p>
      )}
    </div>
  );
}
