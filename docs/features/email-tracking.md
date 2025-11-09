# Email Tracking & Analytics System

Complete email tracking and analytics system with open tracking, click tracking, and performance dashboards.

## Features

### 1. **Email Open Tracking**
- Invisible 1x1 transparent GIF pixel embedded in email HTML
- Records timestamp, user agent, and IP address when email is opened
- Multiple opens tracked separately
- First and last open timestamps stored

### 2. **Link Click Tracking**
- All links in email HTML automatically wrapped with tracking redirect
- UTM parameters automatically added to track campaign performance
- Records click events with timestamp, user agent, IP address
- Redirects to original destination after logging click

### 3. **UTM Parameters**
- Automatically adds UTM parameters to all links:
  - `utm_source`: 'crm'
  - `utm_medium`: 'email'
  - `utm_campaign`: Dynamic based on contact or 'direct'
  - `utm_content`: Optional
  - `utm_term`: Optional

### 4. **Analytics Dashboard**
- Overall performance metrics (total sent, open rate, click rate, reply rate)
- Activity over time charts
- Top engaging contacts leaderboard
- Top performing emails table
- Date range filtering
- Contact/user filtering

### 5. **Per-Email Analytics**
- Individual email metrics
- Open count and unique opens
- Click count and unique clicks
- Reply count
- First/last opened timestamps
- Link-by-link performance
- Event timeline

## Database Schema

### `email_tracking_events` Table
Stores individual tracking events (opens and clicks).

```sql
CREATE TABLE email_tracking_events (
  id SERIAL PRIMARY KEY,
  email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,  -- 'open' or 'click'
  tracking_id VARCHAR(100) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  link_url TEXT,  -- For click events
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_tracking_events_email_id`
- `idx_tracking_events_tracking_id`
- `idx_tracking_events_event_type`
- `idx_tracking_events_occurred_at`

### `email_tracking_links` Table
Stores tracked links with UTM parameters and click counts.

```sql
CREATE TABLE email_tracking_links (
  id SERIAL PRIMARY KEY,
  email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  tracking_id VARCHAR(100) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  tracked_url TEXT NOT NULL,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  click_count INTEGER DEFAULT 0,
  first_clicked_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_tracking_links_email_id`
- `idx_tracking_links_tracking_id`

### `emails` Table Additions
New columns added to track email performance.

```sql
ALTER TABLE emails ADD COLUMN tracking_enabled BOOLEAN DEFAULT true;
ALTER TABLE emails ADD COLUMN tracking_pixel_id VARCHAR(100) UNIQUE;
ALTER TABLE emails ADD COLUMN first_opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emails ADD COLUMN last_opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emails ADD COLUMN open_count INTEGER DEFAULT 0;
ALTER TABLE emails ADD COLUMN click_count INTEGER DEFAULT 0;
ALTER TABLE emails ADD COLUMN reply_count INTEGER DEFAULT 0;
```

**Indexes:**
- `idx_emails_tracking_pixel_id`
- `idx_emails_first_opened_at`

## API Endpoints

### 1. Tracking Pixel Endpoint

**GET** `/api/tracking/pixel/[id]`

Serves a 1x1 transparent GIF and records email open event.

**Parameters:**
- `id` (path): Tracking pixel ID

**Response:**
- Returns: 1x1 transparent GIF image
- Status: 200 OK
- Content-Type: `image/gif`

**Side Effects:**
- Creates record in `email_tracking_events` with `event_type='open'`
- Updates `emails.open_count += 1`
- Updates `emails.first_opened_at` (if null)
- Updates `emails.last_opened_at`

**Example:**
```html
<img src="https://example.com/api/tracking/pixel/abc123" width="1" height="1" style="display:none" />
```

### 2. Link Click Tracking Endpoint

**GET** `/api/tracking/click/[id]`

Records click event and redirects to original URL.

**Parameters:**
- `id` (path): Tracking link ID
- `url` (query, optional): Fallback URL if tracking ID not found

**Response:**
- Status: 302 Found (redirect)
- Location: Original URL with UTM parameters

**Side Effects:**
- Creates record in `email_tracking_events` with `event_type='click'`
- Updates `email_tracking_links.click_count += 1`
- Updates `email_tracking_links.first_clicked_at` (if null)
- Updates `email_tracking_links.last_clicked_at`
- Updates `emails.click_count += 1`

**Example:**
```
GET /api/tracking/click/xyz789
→ Redirects to: https://example.com/page?utm_source=crm&utm_medium=email&utm_campaign=contact-123
```

### 3. Email Analytics Endpoint

**GET** `/api/emails/[id]/analytics`

Returns detailed analytics for a specific email.

**Parameters:**
- `id` (path): Email ID

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "analytics": {
    "email": {
      "id": 123,
      "subject": "Meeting Follow-up",
      "to_emails": "contact@example.com",
      "sent_at": "2024-01-15T10:30:00Z",
      "open_count": 5,
      "click_count": 3,
      "reply_count": 1,
      "first_opened_at": "2024-01-15T11:00:00Z",
      "last_opened_at": "2024-01-16T09:15:00Z"
    },
    "opens": 5,
    "clicks": 3,
    "uniqueOpens": 2,
    "uniqueClicks": 1,
    "openRate": 100,
    "clickRate": 60,
    "replyCount": 1,
    "firstOpenedAt": "2024-01-15T11:00:00Z",
    "lastOpenedAt": "2024-01-16T09:15:00Z",
    "events": [
      {
        "event_type": "open",
        "occurred_at": "2024-01-15T11:00:00Z",
        "user_agent": "Mozilla/5.0...",
        "ip_address": "192.168.1.100"
      },
      {
        "event_type": "click",
        "occurred_at": "2024-01-15T11:05:00Z",
        "link_url": "https://example.com/page",
        "user_agent": "Mozilla/5.0...",
        "ip_address": "192.168.1.100"
      }
    ],
    "links": [
      {
        "original_url": "https://example.com/page?utm_source=crm&utm_medium=email",
        "tracked_url": "https://crm.com/api/tracking/click/xyz789",
        "click_count": 3,
        "first_clicked_at": "2024-01-15T11:05:00Z",
        "last_clicked_at": "2024-01-16T09:20:00Z"
      }
    ]
  }
}
```

### 4. Dashboard Analytics Endpoint

**GET** `/api/analytics/email-performance`

Returns aggregate analytics with filtering options.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `contactId` (optional): Filter by contact ID
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalSent": 150,
    "totalOpened": 120,
    "totalClicked": 45,
    "totalReplied": 30,
    "openRate": 80.0,
    "clickRate": 37.5,
    "replyRate": 20.0,
    "byContact": [
      {
        "contact_id": 5,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "emails_sent": 10,
        "emails_opened": 9,
        "emails_clicked": 5,
        "total_opens": 15,
        "total_clicks": 8
      }
    ],
    "byDate": [
      {
        "date": "2024-01-15",
        "emails_sent": 20,
        "emails_opened": 15,
        "emails_clicked": 8
      }
    ],
    "topPerformers": [
      {
        "id": 123,
        "subject": "Product Launch",
        "to_emails": "contact@example.com",
        "sent_at": "2024-01-15T10:00:00Z",
        "open_count": 10,
        "click_count": 5,
        "reply_count": 2
      }
    ]
  },
  "filters": {
    "contactId": 5,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

## Components

### EmailTrackingService

Main service class for tracking functionality.

**Location:** `src/lib/email-tracking-service.ts`

**Key Methods:**

```typescript
// Generate unique tracking ID
generateTrackingId(): string

// Generate tracking pixel HTML
generateTrackingPixel(emailId: number, trackingId: string): string

// Extract all links from HTML
extractLinks(html: string): string[]

// Generate tracked URL with UTM parameters
generateTrackedUrl(
  originalUrl: string, 
  trackingId: string, 
  utmParams?: UTMParams
): string

// Wrap all links with tracking
async wrapLinksWithTracking(
  emailId: number, 
  html: string, 
  utmParams?: UTMParams
): Promise<{ html: string; trackingLinks: any[] }>

// Inject tracking pixel and wrap links
async injectTracking(
  emailId: number, 
  html: string, 
  utmParams?: UTMParams
): Promise<string>

// Record email open event
async recordOpen(
  trackingId: string, 
  userAgent?: string, 
  ipAddress?: string
): Promise<boolean>

// Record link click event
async recordClick(
  trackingId: string, 
  userAgent?: string, 
  ipAddress?: string
): Promise<{ originalUrl?: string; success: boolean }>

// Get email analytics
async getEmailAnalytics(emailId: number): Promise<EmailAnalytics>

// Get dashboard analytics
async getDashboardAnalytics(filters: AnalyticsFilters): Promise<DashboardAnalytics>
```

**Usage Example:**

```typescript
import { EmailTrackingService } from '@/lib/email-tracking-service';

const trackingService = new EmailTrackingService();

// Inject tracking before sending email
const trackedHtml = await trackingService.injectTracking(
  emailId,
  originalHtml,
  {
    source: 'crm',
    medium: 'email',
    campaign: 'product-launch'
  }
);

// Send email with tracked HTML
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Product Launch',
  html: trackedHtml
});
```

### EmailPerformanceDashboard Component

React component for displaying email analytics.

**Location:** `src/components/EmailPerformanceDashboard.tsx`

**Props:**
```typescript
interface EmailPerformanceDashboardProps {
  contactId?: number;  // Optional: Filter by contact
  userId?: number;     // Optional: Filter by user
}
```

**Features:**
- Summary cards (total sent, open rate, click rate, reply rate)
- Activity over time bar chart
- Top engaging contacts list
- Top performing emails table
- Date range picker for filtering

**Usage:**

```tsx
import EmailPerformanceDashboard from '@/components/EmailPerformanceDashboard';

// In your page/component
<EmailPerformanceDashboard contactId={123} />
```

## Integration with Email Sending

### Automatic Tracking Injection

The send email API (`/api/integrations/email/send`) automatically injects tracking:

1. **Email record created** in database before sending
2. **Tracking service called** to inject pixel and wrap links
3. **Modified HTML sent** to recipient
4. **Tracking pixel ID stored** in email record

**Flow:**

```
User composes email
       ↓
POST /api/integrations/email/send
       ↓
Create email record in DB
       ↓
Call trackingService.injectTracking()
       ├─ Generate tracking pixel ID
       ├─ Create tracking pixel HTML
       ├─ Extract all <a href> tags
       ├─ Generate tracking URLs
       ├─ Store tracking links in DB
       └─ Return modified HTML
       ↓
Send email via EmailService
       ↓
Return success with emailId
```

### Disabling Tracking

To disable tracking for a specific email:

```typescript
// In EmailComposer or API call
const formData = new FormData();
formData.append('to', 'recipient@example.com');
formData.append('subject', 'Subject');
formData.append('html', '<p>Body</p>');
formData.append('enableTracking', 'false');  // Disable tracking

await fetch('/api/integrations/email/send', {
  method: 'POST',
  body: formData
});
```

## Tracking Workflow

### Open Tracking

```
1. Email sent with tracking pixel:
   <img src="/api/tracking/pixel/abc123" width="1" height="1" />

2. Recipient opens email in email client

3. Email client loads image

4. Request sent to: GET /api/tracking/pixel/abc123

5. Server:
   - Finds email by tracking_pixel_id
   - Creates event in email_tracking_events
   - Updates emails.open_count
   - Updates emails.first_opened_at, last_opened_at
   - Returns 1x1 transparent GIF

6. Email client displays image (invisible to user)
```

### Click Tracking

```
1. Email sent with tracked link:
   <a href="/api/tracking/click/xyz789?url=https://example.com">
     Click here
   </a>

2. Recipient clicks link

3. Browser navigates to: GET /api/tracking/click/xyz789

4. Server:
   - Finds tracking link by tracking_id
   - Creates event in email_tracking_events
   - Updates email_tracking_links.click_count
   - Updates email_tracking_links.first_clicked_at, last_clicked_at
   - Updates emails.click_count
   - Gets original URL from database
   - Redirects (302) to original URL with UTM parameters

5. Browser follows redirect to final destination
```

## Performance Considerations

### Database Optimization

- **Indexes** on all foreign keys and frequently queried columns
- **Denormalized counts** on `emails` table for fast dashboard queries
- **Separate tables** for events and links (better performance than single table)
- **Cascade deletes** maintain referential integrity

### Query Optimization

```sql
-- Fast dashboard query (uses denormalized counts)
SELECT COUNT(*) as total_sent,
       SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END) as total_opened
FROM emails
WHERE is_sent = true AND sent_at >= '2024-01-01';

-- Efficient event timeline (uses index on email_id + occurred_at)
SELECT * FROM email_tracking_events
WHERE email_id = 123
ORDER BY occurred_at DESC
LIMIT 50;
```

### API Performance

- **Tracking pixel endpoint**: Returns immediately, logs asynchronously
- **Click tracking endpoint**: Logs synchronously but minimal database operations
- **Analytics endpoints**: Use indexed queries with aggregation in database

## Privacy & Security

### Privacy Features

1. **UUID Tracking IDs**: Not sequential or guessable
2. **No PII in URLs**: Tracking URLs don't contain personal information
3. **Optional Tracking**: Can be disabled per email
4. **IP Hashing**: (Planned) Hash IP addresses for privacy

### Security Considerations

1. **Authorization**: All analytics endpoints require JWT token
2. **Rate Limiting**: (Recommended) Prevent abuse of tracking endpoints
3. **Input Validation**: All parameters validated before database queries
4. **SQL Injection Prevention**: Using parameterized queries with neon
5. **XSS Prevention**: HTML content sanitized in components

## Troubleshooting

### Tracking Not Working

**Symptom:** Opens/clicks not being recorded

**Checks:**
1. Verify tracking is enabled: Check `emails.tracking_enabled = true`
2. Check tracking pixel ID: `SELECT tracking_pixel_id FROM emails WHERE id = 123`
3. Test pixel directly: Visit `/api/tracking/pixel/[id]` in browser
4. Check browser console: Look for network errors
5. Verify database: Query `email_tracking_events` for records

**Common Issues:**
- Email client blocks images (tracking pixels won't load)
- Plain text emails (tracking only works with HTML)
- Ad blockers may block tracking requests
- Some email clients strip tracking pixels

### Analytics Not Displaying

**Symptom:** Dashboard shows no data

**Checks:**
1. Verify emails sent: `SELECT COUNT(*) FROM emails WHERE is_sent = true`
2. Check date range: Ensure filtering includes sent emails
3. Verify tracking events: `SELECT COUNT(*) FROM email_tracking_events`
4. Check API response: Use browser dev tools Network tab
5. Verify authentication: Ensure valid JWT token

### High Click Count but No Opens

**Symptom:** Emails show clicks but no opens

**Possible Causes:**
- Email client blocks images but allows link clicks
- Tracking pixel stripped by email client
- User clicked before images loaded
- VPN or privacy tools blocking pixel but not redirects

**Solution:**
- This is expected behavior in privacy-focused email clients
- Click count is more reliable metric than open count

## Testing

### Manual Testing

1. **Send test email** with tracking enabled
2. **Open email** in different clients (Gmail, Outlook, Apple Mail)
3. **Click links** and verify redirects work
4. **Check database** for tracking events
5. **View analytics** dashboard

### Test Queries

```sql
-- Check if tracking was injected
SELECT id, subject, tracking_pixel_id, tracking_enabled
FROM emails
WHERE id = 123;

-- View tracking events
SELECT event_type, occurred_at, ip_address
FROM email_tracking_events
WHERE email_id = 123
ORDER BY occurred_at DESC;

-- View tracked links
SELECT original_url, click_count, first_clicked_at
FROM email_tracking_links
WHERE email_id = 123;

-- Check open rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END) as opened,
  (SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as open_rate
FROM emails
WHERE is_sent = true;
```

## Future Enhancements

### Planned Features

1. **Real-time notifications** when email opened/clicked
2. **Email heatmaps** showing where users click
3. **A/B testing** for subject lines and content
4. **Optimal send time** predictions based on open patterns
5. **Bounce tracking** for invalid email addresses
6. **Unsubscribe tracking** with one-click unsubscribe
7. **Mobile vs desktop** analytics
8. **Geographic tracking** based on IP address
9. **Email client** detection and analytics
10. **Engagement scoring** based on opens, clicks, replies

### Potential Improvements

- Cache frequently accessed analytics
- Background job for aggregating metrics
- Export analytics to CSV/PDF
- Email templates with built-in tracking
- Webhook notifications for tracking events
- Custom UTM parameter templates
- Link shortening for cleaner tracked URLs

## Conclusion

The email tracking system provides comprehensive visibility into email performance with minimal impact on user experience. Tracking is automatic, reliable, and respects user privacy while delivering actionable insights through intuitive dashboards.

For support or questions, refer to the main CRM documentation or contact the development team.
