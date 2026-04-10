'use client';

import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Notification, DeliveryMethod, NotificationPriority } from '@/lib/notification-engine';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    dismissed: 0,
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('filter', filter);
      }
      params.set('limit', '100');
      params.set('offset', '0');

      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setNotifications(data.notifications || []);

      // Calculate stats
      const allNotifs = data.notifications || [];
      setStats({
        total: data.total || 0,
        unread: allNotifs.filter((n: Notification) => n.status === 'pending').length,
        read: allNotifs.filter((n: Notification) => n.status === 'read').length,
        dismissed: allNotifs.filter((n: Notification) => n.status === 'dismissed').length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // Mark as read
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

      if (!res.ok) throw new Error('Failed');

      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, status: 'read' as any, readAt: new Date() } : n
      ));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Delete
  const deleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed');

      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: NotificationPriority) => {
    const config = {
      low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', label: 'Low' },
      normal: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', label: 'Normal' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', label: 'High' },
      urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', label: 'Urgent' },
    };
    const c = config[priority];
    return <span className={`${c.bg} ${c.text} px-2 py-1 rounded-full text-xs font-semibold`}>{c.label}</span>;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      read: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      dismissed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      sent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      delivered: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    };
    return (
      <span className={`${colors[status as keyof typeof colors] || colors.pending} px-2 py-1 rounded-full text-xs font-semibold capitalize`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BellIcon className="w-8 h-8" />
          Notifications
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage and review all your notifications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: BellIcon, color: 'blue' },
          { label: 'Unread', value: stats.unread, icon: ExclamationTriangleIcon, color: 'orange' },
          { label: 'Read', value: stats.read, icon: CheckIcon, color: 'green' },
          { label: 'Dismissed', value: stats.dismissed, icon: TrashIcon, color: 'gray' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border border-${stat.color}-200 dark:border-${stat.color}-700/50 rounded-lg p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-${stat.color}-700 dark:text-${stat.color}-300 text-sm font-medium`}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-500 opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <FunnelIcon className="w-5 h-5 text-gray-500 self-center" />
        {(['all', 'pending', 'read', 'dismissed', 'sent', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Icon/Priority */}
                <div className="flex-shrink-0 pt-1">
                  {notification.priority === 'urgent' ? (
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                  ) : notification.priority === 'high' ? (
                    <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
                  ) : (
                    <BellIcon className="w-6 h-6 text-blue-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {notification.subject || 'Notification'}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      {getPriorityBadge(notification.priority)}
                      {getStatusBadge(notification.status)}
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                    {notification.message}
                  </p>

                  {/* Delivery methods & timestamp */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2 flex-wrap">
                      {notification.deliveryMethods?.map((method: DeliveryMethod) => (
                        <span
                          key={method}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                    <time className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </time>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {notification.status === 'pending' && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/10"
                      title="Mark as read"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/10"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
