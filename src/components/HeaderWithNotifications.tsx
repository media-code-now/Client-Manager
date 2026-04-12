'use client';

import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { ThemeToggle } from './ThemeToggle';

type Notification = {
  id: string;
  type: 'activity' | 'reminder' | 'alert' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
};

interface HeaderWithNotificationsProps {
  onNotificationCountChange?: (count: number) => void;
}

export default function HeaderWithNotifications({ onNotificationCountChange }: HeaderWithNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/notifications?limit=10&offset=0', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch notifications');

      const data = await res.json();
      const fetchedNotifications = data.notifications || [];

      // Check if there are new unread notifications
      const newUnreadCount = fetchedNotifications.filter(
        (n: Notification) => !n.read
      ).length;

      // Set blinking state if we have more unread than before
      if (newUnreadCount > unreadCount && unreadCount > 0) {
        setHasNewNotification(true);
        // Stop blinking after 5 seconds
        setTimeout(() => setHasNewNotification(false), 5000);
      }

      setNotifications(fetchedNotifications);
      setUnreadCount(newUnreadCount);
      onNotificationCountChange?.(newUnreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(notifications.filter((n) => n.id !== id));
      if (!notifications.find((n) => n.id === id)?.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'reminder':
        return '📋';
      case 'activity':
      default:
        return '📌';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'reminder':
        return 'text-blue-600 dark:text-blue-400';
      case 'activity':
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-4 py-4 pt-safe-top backdrop-blur-md shadow-glass-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-dark-md hidden md:block md:px-8">
      <div className="flex items-center gap-4 md:gap-6">
        {/* Search Bar */}
        <div className="flex flex-1 items-center rounded-full border border-white/60 bg-white/80 px-4 py-2 shadow-inner shadow-white/40 transition focus-within:border-white focus-within:ring-2 focus-within:ring-blue-200/60 focus-within:ring-offset-2 focus-within:ring-offset-white/70 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-950/30 dark:focus-within:ring-offset-slate-900">
          <MagnifyingGlassIcon className="mr-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            placeholder="Quick search"
            className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle className="hidden md:flex" />

        {/* Security Button */}
        <button
          type="button"
          className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-lg shadow-slate-900/10 hover:bg-white md:flex dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900 transition-all"
        >
          <ShieldCheckIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Notifications Button with Badge and Blinking Indicator */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-lg shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 transition-all ${
              hasNewNotification
                ? 'animate-pulse ring-2 ring-red-400 dark:ring-red-500'
                : ''
            } hover:shadow-slate-900/20 dark:hover:shadow-slate-950/40`}
          >
            {unreadCount > 0 ? (
              <BellAlertIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            ) : (
              <BellIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Notification Badge */}
          {unreadCount > 0 && (
            <div
              className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg ${
                hasNewNotification ? 'animate-bounce' : ''
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>

        {/* User Profile Button */}
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-lg shadow-slate-900/10 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900 transition-all"
        >
          <UserCircleIcon className="h-8 w-8 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="absolute right-8 top-20 w-96 rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/95 max-h-[600px] overflow-y-auto z-50">
          {/* Panel Header */}
          <div className="sticky top-0 border-b border-white/60 bg-white/80 px-6 py-4 dark:border-slate-800/60 dark:bg-slate-900/80 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-block rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </h3>
            <button
              onClick={() => setShowNotificationPanel(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-white/60 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 transition-colors ${
                    notification.read
                      ? 'bg-white/50 dark:bg-slate-900/50'
                      : 'bg-blue-50/50 dark:bg-blue-950/20'
                  } hover:bg-white/80 dark:hover:bg-slate-800/60`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`font-semibold ${
                            notification.read
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/60 bg-white/50 px-6 py-3 dark:border-slate-800/60 dark:bg-slate-900/50 text-center">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showNotificationPanel && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotificationPanel(false)}
        />
      )}
    </header>
  );
}
