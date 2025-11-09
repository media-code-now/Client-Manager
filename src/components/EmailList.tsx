'use client';

import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../utils/auth';

interface Email {
  id: number;
  integration_id: string;
  contact_id?: number;
  message_id: string;
  thread_id?: string;
  from_email: string;
  from_name?: string;
  to_emails: string;
  cc_emails?: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  snippet?: string;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  sent_at?: string;
  synced_at: string;
}

interface EmailListProps {
  contactId?: number;
  onComposeReply?: (email: Email) => void;
  onComposeForward?: (email: Email) => void;
  onEmailClick?: (email: Email) => void;
}

export default function EmailList({ 
  contactId, 
  onComposeReply, 
  onComposeForward,
  onEmailClick 
}: EmailListProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchEmails();
  }, [page, contactId]);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const token = getAccessToken();
      
      let url = `/api/emails?page=${page}&limit=${limit}`;
      if (contactId) {
        url += `&contactId=${contactId}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
        setTotalPages(data.totalPages || 1);
      } else {
        setError('Failed to load emails');
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (emailId: number) => {
    try {
      const token = getAccessToken();
      await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true })
      });

      // Update local state
      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, is_read: true } : email
      ));
    } catch (err) {
      console.error('Error marking email as read:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchEmails}
          className="mt-2 text-blue-600 hover:text-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="mt-2">No emails found</p>
        <p className="text-sm">Connect an email account to sync your messages</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <div
          key={email.id}
          className={`border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
            !email.is_read ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => {
                markAsRead(email.id);
                onEmailClick?.(email);
              }}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className={`font-medium ${!email.is_read ? 'font-semibold' : ''}`}>
                  {email.from_name || email.from_email}
                </span>
                {!email.is_read && (
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
                {email.has_attachments && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </div>
              
              <h3 className={`text-sm mb-1 ${!email.is_read ? 'font-semibold' : 'font-medium'}`}>
                {email.subject || '(No Subject)'}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {email.snippet || (email.body_text || email.body_html)?.substring(0, 150)}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {formatDate(email.sent_at || email.synced_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {/* Reply Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComposeReply?.(email);
                }}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Reply"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>

              {/* Forward Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComposeForward?.(email);
                }}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Forward"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
