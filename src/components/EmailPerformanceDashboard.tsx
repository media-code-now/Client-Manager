'use client';

import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../utils/auth';

interface EmailPerformanceData {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  byContact: Array<{
    contact_id: number;
    first_name: string;
    last_name: string;
    email: string;
    emails_sent: number;
    emails_opened: number;
    emails_clicked: number;
    total_opens: number;
    total_clicks: number;
  }>;
  byDate: Array<{
    date: string;
    emails_sent: number;
    emails_opened: number;
    emails_clicked: number;
  }>;
  topPerformers: Array<{
    id: number;
    subject: string;
    to_emails: string;
    sent_at: string;
    open_count: number;
    click_count: number;
    reply_count: number;
  }>;
}

interface EmailPerformanceDashboardProps {
  contactId?: number;
  userId?: number;
}

export default function EmailPerformanceDashboard({
  contactId,
  userId
}: EmailPerformanceDashboardProps) {
  const [data, setData] = useState<EmailPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, [contactId, userId, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId.toString());
      if (userId) params.append('userId', userId.toString());
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(`/api/analytics/email-performance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result.analytics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading analytics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Email Performance Analytics</h2>
        <div className="flex gap-3">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalSent}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatPercentage(data.openRate)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{data.totalOpened} of {data.totalSent} emails opened</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Click Rate</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{formatPercentage(data.clickRate)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{data.totalClicked} clicks from opened emails</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reply Rate</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{formatPercentage(data.replyRate)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{data.totalReplied} replies received</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Date Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Over Time</h3>
          <div className="space-y-3">
            {data.byDate.slice(0, 10).map((item, index) => {
              const maxValue = Math.max(...data.byDate.map(d => d.emails_sent));
              const sentWidth = (item.emails_sent / maxValue) * 100;
              const openedWidth = (item.emails_opened / maxValue) * 100;
              const clickedWidth = (item.emails_clicked / maxValue) * 100;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">{formatDate(item.date)}</span>
                    <span className="text-gray-500">{item.emails_sent} sent</span>
                  </div>
                  <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                    <div 
                      className="absolute h-full bg-blue-200 rounded" 
                      style={{ width: `${sentWidth}%` }}
                    ></div>
                    <div 
                      className="absolute h-full bg-green-400 rounded" 
                      style={{ width: `${openedWidth}%` }}
                    ></div>
                    <div 
                      className="absolute h-full bg-purple-500 rounded" 
                      style={{ width: `${clickedWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span className="text-gray-600">Sent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-gray-600">Opened</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-gray-600">Clicked</span>
            </div>
          </div>
        </div>

        {/* Top Contacts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Engaging Contacts</h3>
          <div className="space-y-3">
            {data.byContact.slice(0, 8).map((contact, index) => {
              const openRate = contact.emails_sent > 0 
                ? (contact.emails_opened / contact.emails_sent) * 100 
                : 0;

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{contact.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatPercentage(openRate)}</p>
                    <p className="text-xs text-gray-500">{contact.emails_opened}/{contact.emails_sent}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {data.byContact.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No contact data available</p>
          )}
        </div>
      </div>

      {/* Top Performing Emails */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Emails</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subject</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">To</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sent</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Opens</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Clicks</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Replies</th>
              </tr>
            </thead>
            <tbody>
              {data.topPerformers.map((email, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">{email.subject}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{email.to_emails}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{formatDate(email.sent_at)}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {email.open_count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {email.click_count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {email.reply_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.topPerformers.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No email data available</p>
        )}
      </div>
    </div>
  );
}
