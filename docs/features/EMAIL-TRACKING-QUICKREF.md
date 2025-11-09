# Email Tracking - Quick Reference

## 🚀 Quick Start

### 1. Send Email with Tracking (Automatic)

```typescript
// Tracking is enabled by default for all HTML emails
const formData = new FormData();
formData.append('integrationId', '1');
formData.append('to', 'recipient@example.com');
formData.append('subject', 'Hello!');
formData.append('html', '<p>Click <a href="https://example.com">here</a></p>');

const response = await fetch('/api/integrations/email/send', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 2. View Email Analytics

```typescript
// Per-email analytics
const analytics = await fetch('/api/emails/123/analytics', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(`Open Rate: ${analytics.analytics.openRate}%`);
console.log(`Click Rate: ${analytics.analytics.clickRate}%`);
```

### 3. Display Analytics Dashboard

```tsx
import EmailPerformanceDashboard from '@/components/EmailPerformanceDashboard';

<EmailPerformanceDashboard contactId={123} />
```

## 📊 Key Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Open Rate** | Percentage of emails opened | (opened / sent) × 100 |
| **Click Rate** | Percentage of opened emails clicked | (clicked / opened) × 100 |
| **Reply Rate** | Percentage of emails replied to | (replied / sent) × 100 |
| **Unique Opens** | Distinct recipients who opened | COUNT(DISTINCT ip_address) |
| **Unique Clicks** | Distinct recipients who clicked | COUNT(DISTINCT ip_address) |

## 🔧 API Endpoints

### Get Email Analytics
```
GET /api/emails/{emailId}/analytics
Authorization: Bearer {token}
```

### Get Dashboard Analytics
```
GET /api/analytics/email-performance?contactId=123&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}
```

### Tracking Pixel (Auto-called)
```
GET /api/tracking/pixel/{trackingId}
```

### Click Tracking (Auto-called)
```
GET /api/tracking/click/{trackingId}
```

## 💾 Database Tables

### email_tracking_events
- Stores all open and click events
- One row per event
- Indexed on `email_id`, `tracking_id`, `event_type`

### email_tracking_links
- Stores tracked links with UTM parameters
- One row per unique link per email
- Tracks click counts and timestamps

### emails (updated)
- Added `tracking_enabled`, `tracking_pixel_id`
- Added `open_count`, `click_count`, `reply_count`
- Added `first_opened_at`, `last_opened_at`

## 🎯 How It Works

### Email Sent
```
Original HTML:
<p>Click <a href="https://example.com">here</a></p>

Modified HTML (sent):
<p>Click <a href="https://crm.com/api/tracking/click/xyz?url=...">here</a></p>
<img src="https://crm.com/api/tracking/pixel/abc" width="1" height="1" />
```

### Recipient Opens Email
```
1. Email client loads tracking pixel
2. GET /api/tracking/pixel/abc
3. Server logs open event
4. Returns 1x1 transparent GIF
```

### Recipient Clicks Link
```
1. User clicks tracked link
2. GET /api/tracking/click/xyz
3. Server logs click event
4. Redirects to: https://example.com?utm_source=crm&utm_medium=email&...
```

## ⚙️ Configuration

### Disable Tracking for Specific Email
```typescript
formData.append('enableTracking', 'false');
```

### Custom UTM Parameters (in tracking service)
```typescript
const utmParams = {
  source: 'crm',
  medium: 'email',
  campaign: 'product-launch',
  content: 'button-cta',
  term: 'new-users'
};
```

## 📈 Dashboard Features

- **Summary Cards**: Total sent, open rate, click rate, reply rate
- **Activity Chart**: Emails sent/opened/clicked over time
- **Top Contacts**: Contacts with highest engagement
- **Top Emails**: Best performing email subjects
- **Date Filters**: Filter by date range
- **Contact Filter**: View specific contact performance

## 🔍 Troubleshooting

### No Opens Tracked
- Email client may block images
- Check if HTML email (tracking doesn't work with plain text)
- Test pixel URL directly: `curl https://crm.com/api/tracking/pixel/{id}`

### No Clicks Tracked
- Verify links are being wrapped
- Check database: `SELECT * FROM email_tracking_links WHERE email_id = 123`
- Test click URL: Visit `/api/tracking/click/{id}` in browser

### Dashboard Empty
- Verify emails sent: `SELECT COUNT(*) FROM emails WHERE is_sent = true`
- Check date range filter
- Verify JWT token is valid

## 📝 SQL Queries

### Check Tracking Status
```sql
SELECT id, subject, tracking_enabled, tracking_pixel_id, open_count, click_count
FROM emails 
WHERE id = 123;
```

### View Events
```sql
SELECT event_type, occurred_at, ip_address
FROM email_tracking_events
WHERE email_id = 123
ORDER BY occurred_at DESC;
```

### Calculate Open Rate
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END) as opened,
  ROUND((SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 1) as open_rate
FROM emails
WHERE is_sent = true;
```

## 🎨 React Component Props

### EmailPerformanceDashboard
```tsx
interface EmailPerformanceDashboardProps {
  contactId?: number;  // Filter by specific contact
  userId?: number;     // Filter by specific user
}
```

### Usage Examples
```tsx
// All emails
<EmailPerformanceDashboard />

// Specific contact
<EmailPerformanceDashboard contactId={123} />

// Specific user
<EmailPerformanceDashboard userId={456} />
```

## 🔐 Security Notes

- All analytics endpoints require JWT authentication
- Tracking IDs are UUID-based (not sequential)
- No PII in tracking URLs
- IP addresses logged for fraud detection only
- Tracking can be disabled per email

## 📦 Files Reference

| File | Purpose |
|------|---------|
| `src/lib/email-tracking-service.ts` | Core tracking logic |
| `src/app/api/tracking/pixel/[id]/route.ts` | Open tracking |
| `src/app/api/tracking/click/[id]/route.ts` | Click tracking |
| `src/app/api/emails/[id]/analytics/route.ts` | Email analytics |
| `src/app/api/analytics/email-performance/route.ts` | Dashboard data |
| `src/components/EmailPerformanceDashboard.tsx` | Analytics UI |

## ✅ Feature Checklist

- [x] Tracking pixels for opens
- [x] Link click tracking
- [x] UTM parameters
- [x] Open/click/reply counts
- [x] Per-email analytics
- [x] Dashboard analytics
- [x] Date range filtering
- [x] Contact filtering
- [x] Event timeline
- [x] Link performance breakdown

## 🚀 Production Deployment

1. Run migration script:
   ```bash
   node scripts/create-email-tracking-tables.js
   ```

2. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE '%tracking%';
   ```

3. Test tracking:
   - Send test email
   - Open email
   - Click link
   - Check analytics

4. Deploy dashboard:
   - Add route to navigation
   - Configure permissions
   - Test with users

## 📞 Support

For issues or questions:
1. Check full documentation: `docs/features/email-tracking.md`
2. Review implementation summary: `docs/features/EMAIL-TRACKING-SUMMARY.md`
3. Test with SQL queries above
4. Contact development team

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅
