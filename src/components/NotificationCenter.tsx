'use client';

import React, { useState, useEffect } from 'react';
import { BellIcon, XMarkIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Notification, DeliveryMethod, NotificationPriority } from '@/lib/notification-engine';

interface NotificationCenterProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function NotificationCenter({ autoRefresh = true, refreshInterval = 30000 }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (filterType?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (filterType && filterType !== 'all') {
        params.set('filter', filterType);
      }
      params.set('limit', '50');
      params.set('offset', '0');

      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch notifications');

      const data = await res.json();
      setNotifications(data.notifications || []);

      // Calculate unread count
      const unread = (data.notifications || []).filter(
        (n: Notification) => n.status === 'pending'
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh notifications
  useEffect(() => {
    if (!autoRefresh) return;

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'read' }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, status: 'read' as any, readAt: new Date() } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Dismiss notification
  const dismissNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'dismissed' }),
      });

      if (!res.ok) throw new Error('Failed to dismiss');

      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error dismissing:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete');

      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  // Clear all read notifications
  const clearRead = async () => {
    const readIds = notifications
      .filter(n => n.status === 'read')
      .map(n => n.id);

    for (const id of readIds) {
      await deleteNotification(id);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      low: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700/50 dark:text-blue-200',
      normal: 'bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-800/50 dark:border-gray-700/50 dark:text-gray-200',
      high: 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:border-orange-700/50 dark:text-orange-200',
      urgent: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-700/50 dark:text-red-200',
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority: NotificationPriority) => {
    const icons = {
      low: '•',
      normal: '•',
      high: '⚠️',
      urgent: '🚨',
    };
    return icons[priority];
  };

  // Filter notifications
  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.status === filter);

  return (
    <>
      {/* Bell icon button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        title="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {showPanel && (
        <div className="fixed top-16 right-4 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
              )}
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 px-4 pt-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {(['all', 'pending', 'read', 'dismissed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-sm rounded whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            )}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 text-sm">
                {error}
              </div>
            )}
            {!isLoading && !error && filteredNotifications.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            )}
            {!isLoading && !error && filteredNotifications.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4 ${
                      getPriorityColor(notification.priority)
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {getPriorityIcon(notification.priority)} {notification.subject || 'Notification'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {notification.deliveryMethods?.map((method: DeliveryMethod) => (
                            <span
                              key={method}
                              className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                        <time className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                          {new Date(notification.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {notification.status === 'pending' && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={() => fetchNotifications(filter === 'all' ? undefined : filter)}
                className="flex-1 px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Refresh
              </button>
              {notifications.some(n => n.status === 'read') && (
                <button
                  onClick={clearRead}
                  className="flex-1 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded transition-colors"
                >
                  Clear Read
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
