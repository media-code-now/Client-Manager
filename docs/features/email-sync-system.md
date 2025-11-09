# Email Sync System Documentation

## Overview
The Email Sync System automatically fetches incoming emails from connected Gmail, Outlook, Yahoo, and custom SMTP/IMAP accounts every 5 minutes. It parses messages, matches senders with CRM contacts (creating new contacts if needed), and stores emails with full threading support.

## Features
- 📧 **Multi-Provider Support**: Gmail API, Outlook Graph API, IMAP
- 🔄 **Automatic Sync**: Background cron job runs every 5 minutes
- 👤 **Contact Matching**: Automatically links emails to existing contacts
- ➕ **Auto-Create Contacts**: Creates new contact records for unknown senders
- 🧵 **Email Threading**: Groups related emails into conversations
- 📎 **Attachment Support**: Stores attachment metadata and files
- ✅ **Read Status**: Track read/unread emails
- 🔍 **Full-Text Search**: Search emails by subject, sender, content
- 📄 **Pagination**: Efficient loading of large email volumes

## Database Schema

### emails Table
```sql
CREATE TABLE emails (
  id SERIAL PRIMARY KEY,
  integration_id INTEGER REFERENCES integrations(id),
  contact_id INTEGER REFERENCES clients(id),
  
  -- Identifiers
  message_id VARCHAR(500) UNIQUE,
  thread_id VARCHAR(500),
  in_reply_to VARCHAR(500),
  references TEXT,
  
  -- Email data
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  to_emails TEXT, -- JSON array
  cc_emails TEXT, -- JSON array
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  snippet TEXT,
  
  -- Status flags
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  has_attachments BOOLEAN,
  attachments JSONB,
  sent_at TIMESTAMP,
  received_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW(),
  labels JSONB,
  folder VARCHAR(255),
  size_bytes INTEGER
);
```

### email_sync_state Table
Tracks sync state for each integration to enable incremental syncing:
```sql
CREATE TABLE email_sync_state (
  id SERIAL PRIMARY KEY,
  integration_id INTEGER UNIQUE REFERENCES integrations(id),
  last_sync_at TIMESTAMP,
  last_message_id VARCHAR(500),
  last_history_id VARCHAR(100), -- Gmail History API
  sync_token TEXT, -- Outlook Delta API
  sync_status VARCHAR(50), -- idle, syncing, error
  sync_error TEXT,
  messages_synced INTEGER DEFAULT 0,
  last_sync_duration_ms INTEGER
);
```

### email_attachments Table
Detailed attachment storage:
```sql
CREATE TABLE email_attachments (
  id SERIAL PRIMARY KEY,
  email_id INTEGER REFERENCES emails(id),
  filename VARCHAR(500),
  content_type VARCHAR(255),
  size_bytes INTEGER,
  attachment_id VARCHAR(255),
  storage_path TEXT,
  is_inline BOOLEAN DEFAULT FALSE,
  content_id VARCHAR(255)
);
```

## Setup Instructions

### 1. Create Database Tables
```bash
node scripts/create-emails-tables.js
```

This creates:
- `emails` table (main email storage)
- `email_sync_state` table (sync tracking)
- `email_attachments` table (attachment details)
- 9 performance indexes
- Automatic timestamp triggers

### 2. Configure Environment Variables
Add to `.env.local`:
```bash
# Required for encryption
ENCRYPTION_KEY=your-64-char-hex-key-here

# OAuth credentials (if using Gmail/Outlook)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# Cron job security
CRON_SECRET=your-random-secret-key

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Cron Job

#### Option A: Vercel Cron (Recommended for production)
The `vercel.json` file is already configured:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-emails",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Deploy to Vercel and cron will automatically run every 5 minutes.

#### Option B: External Cron Service
Use a service like cron-job.org or EasyCron:

**URL**: `https://your-app.com/api/cron/sync-emails`  
**Method**: POST  
**Headers**: `Authorization: Bearer YOUR_CRON_SECRET`  
**Schedule**: `*/5 * * * *` (every 5 minutes)

#### Option C: Node-cron (Local development)
Create `scripts/cron-worker.js`:
```javascript
const cron = require('node-cron');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running email sync...');
  
  const response = await fetch('http://localhost:3000/api/cron/sync-emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
  });
  
  const result = await response.json();
  console.log('Sync result:', result);
});
```

Run with: `node scripts/cron-worker.js`

## Sync Process

### Gmail Sync Flow
1. Check `email_sync_state` for last `history_id`
2. If history ID exists:
   - Use Gmail History API for incremental sync
   - Fetch only new/changed messages since last sync
3. If no history ID (first sync):
   - Full sync: Fetch last 7 days of messages
   - Save new history ID for future incremental syncs
4. For each message:
   - Fetch full message details
   - Extract sender, recipients, subject, body, attachments
   - Match sender email to existing contact or create new
   - Store in `emails` table
   - Store attachments in `email_attachments` table

### Outlook Sync Flow
1. Check `email_sync_state` for `sync_token`
2. If token exists:
   - Use Microsoft Graph Delta API
   - Fetch only changed messages
3. If no token (first sync):
   - Fetch last 100 messages
   - Save delta link for future syncs
4. Parse and store messages same as Gmail

### IMAP Sync Flow (Yahoo, Custom SMTP)
1. Connect to IMAP server
2. Open INBOX folder
3. Search for messages from last 7 days
4. Fetch message details using UID
5. Parse with `mailparser`
6. Extract data and store

## Contact Matching Logic

### Automatic Contact Creation
When an email arrives from an unknown sender:

```javascript
// 1. Check if contact exists by email
const existing = await sql`
  SELECT id FROM clients 
  WHERE user_id = ${userId} 
  AND LOWER(email) = LOWER(${senderEmail})
`;

// 2. If not found, create new contact
if (existing.length === 0) {
  const [firstName, ...lastNameParts] = senderName.split(' ');
  const lastName = lastNameParts.join(' ');
  
  await sql`
    INSERT INTO clients (
      user_id,
      first_name,
      last_name,
      email,
      status,
      source
    ) VALUES (
      ${userId},
      ${firstName},
      ${lastName},
      ${senderEmail},
      'lead',
      'email_sync'
    )
  `;
}
```

### Contact Matching Rules
- **Case-insensitive** email matching
- Extracts name from "Name <email@example.com>" format
- Sets status to 'lead' for new contacts
- Tags source as 'email_sync' for reporting
- Logs contact creation in `integration_logs`

## API Endpoints

### List Emails
```http
GET /api/emails
Authorization: Bearer {jwt_token}

Query Parameters:
  page=1              # Page number (default: 1)
  limit=50            # Results per page (default: 50)
  contactId=123       # Filter by contact
  isRead=true         # Filter by read status
  threadId=abc        # Filter by thread
  integrationId=1     # Filter by integration
  search=keyword      # Full-text search

Response:
{
  "emails": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Email Details
```http
GET /api/emails/[id]
Authorization: Bearer {jwt_token}

Response:
{
  "email": {
    "id": 123,
    "subject": "Meeting tomorrow",
    "from_email": "john@example.com",
    "from_name": "John Doe",
    "body_text": "...",
    "body_html": "...",
    "sent_at": "2025-11-08T10:30:00Z",
    "is_read": false,
    "has_attachments": true,
    "contact_first_name": "John",
    "contact_last_name": "Doe"
  },
  "attachments": [
    {
      "filename": "document.pdf",
      "size_bytes": 245632,
      "content_type": "application/pdf"
    }
  ],
  "thread": [
    {
      "id": 122,
      "subject": "Re: Meeting tomorrow",
      "from_email": "me@example.com",
      "snippet": "Sure, I'll be there..."
    }
  ]
}
```

### Mark Email as Read
```http
PATCH /api/emails/[id]
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "isRead": true,
  "isStarred": false,
  "isImportant": false
}

Response:
{
  "success": true,
  "email": {...}
}
```

### Manual Sync Trigger
```http
POST /api/emails/sync
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "integrationId": 1
}

Response:
{
  "success": true,
  "messagesSynced": 15,
  "timestamp": "2025-11-08T12:00:00Z"
}
```

### Cron Job Endpoint
```http
POST /api/cron/sync-emails
Authorization: Bearer {cron_secret}

Response:
{
  "success": true,
  "timestamp": "2025-11-08T12:00:00Z",
  "stats": {
    "totalIntegrations": 5,
    "successfulSyncs": 5,
    "failedSyncs": 0,
    "totalMessagesSynced": 23,
    "durationMs": 4521
  }
}
```

### Monitor Sync Status
```http
GET /api/cron/sync-emails

Response:
{
  "success": true,
  "stats": {
    "total_integrations": 5,
    "idle": 4,
    "syncing": 1,
    "errors": 0,
    "total_messages_synced": 1234,
    "last_sync_at": "2025-11-08T12:00:00Z",
    "avg_duration_ms": 3456
  },
  "recentActivity": [...]
}
```

## Email Threading

Emails are automatically grouped into threads using:
- `thread_id`: Provider's thread/conversation ID
- `in_reply_to`: References parent message
- `references`: Chain of message IDs

### Thread Query Example
```sql
SELECT *
FROM emails
WHERE thread_id = 'abc123'
ORDER BY sent_at ASC
```

## Performance Optimization

### Indexes
9 indexes created for optimal query performance:
- `idx_emails_integration_id`
- `idx_emails_contact_id`
- `idx_emails_message_id` (unique constraint)
- `idx_emails_thread_id`
- `idx_emails_from_email`
- `idx_emails_sent_at` (DESC for recent emails)
- `idx_emails_is_read`
- `idx_emails_synced_at`
- `idx_email_attachments_email_id`

### Incremental Sync
- **Gmail**: Uses History API with history IDs
- **Outlook**: Uses Delta API with sync tokens
- **IMAP**: Searches by date range

This minimizes API calls and sync time.

### Pagination
All list endpoints support pagination to handle large email volumes efficiently.

## Error Handling

### Sync Errors
Errors are logged to `email_sync_state.sync_error` and `integration_logs`:
- OAuth token expiration
- API rate limits
- Network connectivity
- Invalid credentials
- IMAP connection failures

### Monitoring
Check sync health:
```sql
SELECT 
  i.name,
  s.sync_status,
  s.sync_error,
  s.last_sync_at,
  s.messages_synced
FROM email_sync_state s
JOIN integrations i ON s.integration_id = i.id
WHERE s.sync_status = 'error';
```

## Security

### Credential Encryption
All email credentials encrypted with AES-256-GCM:
- Access tokens
- Refresh tokens
- Passwords
- API keys

### Authorization
All API endpoints require JWT authentication:
- User can only access their own emails
- Email ownership verified via integration.user_id

### Cron Security
Cron endpoint protected with bearer token:
```bash
Authorization: Bearer {CRON_SECRET}
```

## Testing

### Manual Sync Test
```bash
curl -X POST http://localhost:3000/api/emails/sync \
  -H "Authorization: Bearer {your_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"integrationId": 1}'
```

### Check Sync Status
```bash
curl http://localhost:3000/api/cron/sync-emails
```

### View Recent Emails
```bash
curl "http://localhost:3000/api/emails?page=1&limit=10" \
  -H "Authorization: Bearer {your_jwt}"
```

## Troubleshooting

### No Emails Syncing
1. Check integration is active: `SELECT * FROM integrations WHERE type = 'email'`
2. Check sync state: `SELECT * FROM email_sync_state`
3. Check logs: `SELECT * FROM integration_logs WHERE event_type LIKE '%email%'`
4. Manually trigger sync via API
5. Check credentials are not expired

### Duplicate Emails
Prevented by `UNIQUE` constraint on `message_id`. Uses `ON CONFLICT DO UPDATE` or `DO NOTHING`.

### Performance Issues
- Reduce sync frequency
- Add more indexes if needed
- Archive old emails
- Use pagination in UI

## Future Enhancements
- ✉️ Send email replies from CRM
- 🔔 Real-time notifications for new emails
- 🤖 AI-powered email categorization
- 📊 Email analytics and insights
- 🗂️ Email templates
- 📤 Batch email operations
- 🔍 Advanced search with filters
- 📎 Attachment download and preview
- 🏷️ Custom email labels/tags

## Support

For issues or questions:
1. Check logs in `integration_logs` table
2. Review sync state in `email_sync_state` table
3. Verify environment variables are set
4. Test connection manually
5. Check OAuth tokens haven't expired
