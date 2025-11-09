# Mails Tab - Quick Reference

## Overview
Dedicated tab in dashboard for managing all email functionality including inbox, composition, and analytics.

## Navigation

### Accessing Mails Tab
```
Dashboard → Mails (7th item in sidebar)
Icon: Envelope icon
```

## Features

### 1. Inbox Tab (Default)
**What it shows:**
- List of all emails (sent and received)
- Pagination (20 emails per page)
- Read/unread indicators
- Attachment icons
- Relative timestamps (e.g., "2 hours ago")

**Actions available:**
- ✉️ **Compose** - Create new email
- ↩️ **Reply** - Reply to email
- ➡️ **Forward** - Forward email
- 👁️ **Mark as Read** - Click to mark email as read

### 2. Analytics Tab
**What it shows:**
- **Summary Cards:**
  - Total emails sent
  - Open rate percentage
  - Click rate percentage
  - Reply rate percentage

- **Activity Over Time:**
  - Bar chart showing sent/opened/clicked
  - Last 10 days of data
  - Color-coded (blue=sent, green=opened, purple=clicked)

- **Top Engaging Contacts:**
  - List of contacts with highest open rates
  - Shows name, email, and engagement percentage
  - Top 8 contacts displayed

- **Top Performing Emails:**
  - Table with subject, recipient, sent date
  - Open count, click count, reply count
  - Color-coded badges for metrics

**Filters:**
- Date range picker (start date and end date)
- Auto-refresh when filters change

## User Flows

### Composing New Email
```
1. Click "Mails" in sidebar
2. Click "+ Compose" button (top right)
3. Fill in To, Subject, Body
4. Add attachments (optional)
5. Click "Send"
```

### Replying to Email
```
1. Click "Mails" in sidebar
2. Find email in list
3. Click "Reply" button
4. Composer opens with:
   - To: Pre-filled with sender
   - Subject: Pre-filled with "Re: [subject]"
   - Quoted original message in body
5. Add your response
6. Click "Send"
```

### Forwarding Email
```
1. Click "Mails" in sidebar
2. Find email in list
3. Click "Forward" button
4. Composer opens with:
   - Subject: Pre-filled with "Fwd: [subject]"
   - Original message in body
5. Add recipients
6. Add your message
7. Click "Send"
```

### Viewing Email Analytics
```
1. Click "Mails" in sidebar
2. Click "Analytics" tab
3. View performance metrics
4. Use date range filters for specific periods
5. Analyze engagement trends
```

## Component Structure

```
Mails Tab
├── Header
│   ├── [Inbox] [Analytics] tabs
│   └── [+ Compose] button (inbox only)
│
├── Inbox View (EmailList)
│   ├── Email items with:
│   │   ├── From name/email
│   │   ├── Subject
│   │   ├── Snippet
│   │   ├── Timestamp
│   │   ├── Reply button
│   │   └── Forward button
│   └── Pagination controls
│
└── Analytics View (EmailPerformanceDashboard)
    ├── Summary cards (4 metrics)
    ├── Activity over time chart
    ├── Top contacts list
    └── Top emails table
```

## State Management

### Active Tab State
```typescript
mailsActiveTab: 'inbox' | 'analytics'
Default: 'inbox'
```

### Email Composer Modal State
```typescript
emailComposerModal: {
  show: boolean;
  mode?: 'compose' | 'reply' | 'forward';
  replyToEmail?: Email;
  prefilledTo?: string;
  prefilledSubject?: string;
  contactId?: number;
}
```

## Keyboard Shortcuts (Planned)

Future enhancements:
- `C` - Compose new email
- `R` - Reply to selected email
- `F` - Forward selected email
- `E` - Archive selected email
- `/` - Focus search
- `J/K` - Navigate up/down in list

## API Integration

### Endpoints Used

**Inbox:**
- `GET /api/emails` - Fetch email list
- `PATCH /api/emails/[id]` - Mark as read

**Analytics:**
- `GET /api/analytics/email-performance` - Dashboard metrics
- `GET /api/emails/[id]/analytics` - Per-email analytics

**Compose/Send:**
- `POST /api/integrations/email/send` - Send email with tracking

## Responsive Design

### Desktop (≥768px)
- Full sidebar visible
- Tab navigation horizontal
- Compose button visible
- All columns in table visible

### Mobile (<768px)
- Collapsible sidebar
- Tab navigation stacked
- Compose button in header
- Simplified table layout

## Dark Mode Support

All components support dark mode:
- Background: `bg-white dark:bg-slate-800`
- Text: `text-slate-900 dark:text-slate-100`
- Borders: `border-slate-200 dark:border-slate-700`
- Hover states adapt to theme

## Performance

### Optimization Features
- Pagination (20 emails/page) - Reduces initial load
- Lazy loading - Images load on demand
- Debounced search - Reduces API calls
- Cached analytics - Dashboard data cached for 5 minutes
- Virtual scrolling - Planned for large email lists

### Loading States
- Inbox: Spinner while fetching emails
- Analytics: Spinner while loading metrics
- Compose: Disabled send button during sending

## Error Handling

### Common Errors

**No emails found:**
- Shows empty state message
- Suggests composing first email

**Failed to send email:**
- Shows error notification
- Email remains in composer
- User can retry or save draft

**Analytics load failure:**
- Shows error message
- Provides retry button

## Accessibility

### ARIA Labels
- Navigation items labeled
- Tab panels have proper roles
- Buttons have descriptive labels

### Keyboard Navigation
- Tab key navigates through interactive elements
- Enter/Space activates buttons
- Escape closes modals

### Screen Reader Support
- Email count announced
- New email notifications
- Status changes announced

## Tips & Best Practices

### For Best Results
✅ Use descriptive subject lines
✅ Add recipients to contacts first for better tracking
✅ Enable tracking for analytics (default enabled)
✅ Review analytics weekly to optimize engagement
✅ Use templates for common emails (coming soon)

### Common Mistakes
❌ Forgetting to add subject
❌ Not checking analytics before campaigns
❌ Sending to invalid email addresses
❌ Large attachments without compression

## Troubleshooting

### Emails Not Appearing
1. Check if email integration is connected
2. Verify sync is working (Integrations tab)
3. Refresh the page
4. Check date filters in analytics

### Compose Button Missing
- Ensure you're on Inbox tab (not Analytics)
- Check screen size (may be in mobile menu)

### Analytics Not Loading
1. Verify emails have been sent
2. Check date range filter
3. Wait for tracking data (takes time after sending)
4. Ensure tracking is enabled for emails

## Future Enhancements

### Coming Soon
- 📁 Folders & Labels
- 🔍 Advanced Search
- 📝 Email Templates
- ⚡ Quick Responses
- 🔄 Auto-sync Intervals
- 📊 More Analytics (geographic, device type)
- 🎨 Custom Email Signatures
- 🔔 Real-time Notifications

---

**Last Updated:** January 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready
