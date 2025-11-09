# Email Composer Feature Documentation

## Overview

The Email Composer is a comprehensive email sending system integrated into the CRM dashboard. It allows users to compose, send, reply to, and forward emails directly from the CRM interface using their connected email accounts.

## Features

### ✅ Core Functionality

1. **Email Composition**
   - Rich text editor with formatting toolbar (Bold, Italic, Underline, Lists, Links)
   - To, CC, and BCC recipient fields
   - Subject line
   - File attachments support (multiple files)
   - Auto-save to drafts (planned)

2. **Email Sending**
   - Send through connected email accounts (Gmail, Outlook, Yahoo, SMTP)
   - Multiple recipient support
   - File attachment upload and transmission
   - Real-time delivery status
   - Error handling with user feedback

3. **Email History Tracking**
   - All sent emails automatically logged to database
   - Linked to contact records when applicable
   - Threading support for conversations
   - Full-text searchable
   - Attachment metadata storage

4. **Reply & Forward**
   - One-click reply to any received email
   - Forward emails with quoted content
   - Automatic subject prefixing (Re: / Fwd:)
   - Quoted original message in body
   - Thread preservation

## Components

### 1. EmailComposer Component

**Location**: `src/components/EmailComposer.tsx`

**Props**:
```typescript
interface EmailComposerProps {
  isOpen: boolean;                    // Controls modal visibility
  onClose: () => void;                // Callback when modal closes
  mode?: 'compose' | 'reply' | 'forward'; // Email composition mode
  replyToEmail?: Email;               // Original email for reply/forward
  prefilledTo?: string;               // Pre-populate recipient
  prefilledSubject?: string;          // Pre-populate subject
  contactId?: number;                 // Link email to contact
}
```

**Key Features**:
- Full-screen modal overlay
- Responsive design (mobile & desktop)
- Real-time validation
- File attachment preview with size display
- Rich text editing with contentEditable
- Integration selection dropdown
- Send button with loading state

**Rich Text Toolbar**:
- **Bold** (Ctrl+B)
- *Italic* (Ctrl+I)
- <u>Underline</u> (Ctrl+U)
- Bullet list
- Numbered list
- Hyperlink insertion

**Attachment Handling**:
- Drag & drop support (planned)
- Multiple file selection
- File size display
- Remove attachment option
- Preview for images (planned)

### 2. EmailList Component

**Location**: `src/components/EmailList.tsx`

**Props**:
```typescript
interface EmailListProps {
  contactId?: number;                 // Filter emails by contact
  onComposeReply?: (email: Email) => void;   // Reply callback
  onComposeForward?: (email: Email) => void; // Forward callback
  onEmailClick?: (email: Email) => void;     // Email click callback
}
```

**Features**:
- Paginated email list
- Read/unread indicators
- Attachment icons
- Time formatting (relative & absolute)
- Reply and Forward buttons on each email
- Mark as read on click
- Contact filtering
- Empty state handling
- Error handling with retry

**UI Elements**:
- **Blue dot** = Unread email
- **Paperclip icon** = Has attachments
- **Bold text** = Unread email
- **Reply button** = Opens composer in reply mode
- **Forward button** = Opens composer in forward mode

### 3. Dashboard Integration

**Location**: `src/components/DashboardLayout.tsx`

**Compose Button**:
- Located in top header (desktop)
- Gradient blue button with envelope icon
- Hidden on mobile (uses mobile menu)
- Opens EmailComposer in compose mode

**State Management**:
```typescript
const [emailComposerModal, setEmailComposerModal] = useState({
  show: false,
  mode: 'compose' | 'reply' | 'forward',
  replyToEmail: Email | undefined,
  prefilledTo: string,
  prefilledSubject: string,
  contactId: number | undefined
});
```

## API Endpoints

### Send Email Endpoint

**Endpoint**: `POST /api/integrations/email/send`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```typescript
{
  integrationId: string;      // Required: Email integration ID
  to: string;                 // Required: Recipient email(s)
  cc?: string;                // Optional: CC recipients
  bcc?: string;               // Optional: BCC recipients
  subject: string;            // Required: Email subject
  body?: string;              // Optional: Plain text body
  html?: string;              // Optional: HTML body
  contactId?: number;         // Optional: Link to contact
  inReplyTo?: string;         // Optional: Message ID for threading
  threadId?: string;          // Optional: Thread ID
  attachments?: File[];       // Optional: File attachments (multiple)
}
```

**Response** (Success):
```json
{
  "success": true,
  "messageId": "msg-123456789",
  "emailId": 42,
  "message": "Email sent successfully"
}
```

**Response** (Error):
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Key Features**:
- Handles multipart/form-data for file uploads
- Converts files to Buffer for email service
- Stores sent email in `emails` table
- Stores attachment metadata in `email_attachments` table
- Logs success/failure to `integration_logs` table
- Returns both message ID and database email ID
- Links email to contact if provided
- Preserves thread information for replies

## Database Schema

### emails Table

Sent emails are stored with the following fields:

```sql
INSERT INTO emails (
  integration_id,    -- Email integration used
  contact_id,        -- Linked contact (if applicable)
  message_id,        -- Provider's message ID
  thread_id,         -- Thread/conversation ID
  in_reply_to,       -- Message-ID being replied to
  from_email,        -- Sender email (user's account)
  from_name,         -- Sender name (integration name)
  to_emails,         -- Recipient(s)
  cc_emails,         -- CC recipient(s)
  bcc_emails,        -- BCC recipient(s)
  subject,           -- Email subject
  body_text,         -- Plain text body
  body_html,         -- HTML body
  snippet,           -- First 150 chars for preview
  is_read,           -- Always true for sent emails
  is_sent,           -- Always true for sent emails
  has_attachments,   -- Boolean flag
  attachments,       -- JSONB array of attachment metadata
  sent_at,           -- Timestamp when sent
  synced_at          -- Timestamp when stored
)
```

### email_attachments Table

```sql
INSERT INTO email_attachments (
  email_id,          -- Foreign key to emails table
  filename,          -- Original filename
  content_type,      -- MIME type
  size_bytes         -- File size in bytes
)
```

## Usage Examples

### 1. Compose New Email

```typescript
// Open composer in compose mode
setEmailComposerModal({
  show: true,
  mode: 'compose'
});

// Pre-fill recipient and subject
setEmailComposerModal({
  show: true,
  mode: 'compose',
  prefilledTo: 'customer@example.com',
  prefilledSubject: 'Follow-up on Project',
  contactId: 123
});
```

### 2. Reply to Email

```typescript
// When user clicks Reply button
const handleReply = (email: Email) => {
  setEmailComposerModal({
    show: true,
    mode: 'reply',
    replyToEmail: email,
    contactId: email.contact_id
  });
};

// Composer automatically:
// - Sets To: to original sender
// - Prefixes subject with "Re: "
// - Quotes original message
// - Sets inReplyTo and threadId
```

### 3. Forward Email

```typescript
// When user clicks Forward button
const handleForward = (email: Email) => {
  setEmailComposerModal({
    show: true,
    mode: 'forward',
    replyToEmail: email
  });
};

// Composer automatically:
// - Clears To: field (user must specify)
// - Prefixes subject with "Fwd: "
// - Includes original message with metadata
```

### 4. Display Email List with Actions

```tsx
<EmailList
  contactId={selectedContactId}
  onComposeReply={(email) => {
    setEmailComposerModal({
      show: true,
      mode: 'reply',
      replyToEmail: email
    });
  }}
  onComposeForward={(email) => {
    setEmailComposerModal({
      show: true,
      mode: 'forward',
      replyToEmail: email
    });
  }}
  onEmailClick={(email) => {
    // Show email detail modal
    setSelectedEmail(email);
  }}
/>
```

### 5. Programmatic Email Sending

```typescript
// Send email via API (without UI)
const sendEmail = async () => {
  const formData = new FormData();
  formData.append('integrationId', 'integration-123');
  formData.append('to', 'recipient@example.com');
  formData.append('subject', 'Automated Email');
  formData.append('html', '<p>Hello from CRM!</p>');
  formData.append('contactId', '456');
  
  // Add attachment
  const file = new File(['content'], 'report.pdf');
  formData.append('attachments', file);
  
  const response = await fetch('/api/integrations/email/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  console.log('Email sent:', result.emailId);
};
```

## Email Flow Diagrams

### Compose & Send Flow

```
User clicks "Compose" button
          ↓
EmailComposer modal opens
          ↓
User fills in recipients, subject, body
          ↓
User attaches files (optional)
          ↓
User clicks "Send"
          ↓
Frontend creates FormData with all fields
          ↓
POST /api/integrations/email/send
          ↓
Backend verifies integration & permissions
          ↓
Backend processes attachments (File → Buffer)
          ↓
EmailService sends via Gmail/Outlook/SMTP
          ↓
Backend stores email in emails table
          ↓
Backend stores attachments in email_attachments
          ↓
Backend logs to integration_logs
          ↓
Success response with emailId
          ↓
Composer closes
          ↓
Email appears in sent history
```

### Reply Flow

```
User clicks "Reply" on email
          ↓
EmailComposer opens with mode='reply'
          ↓
Composer auto-fills:
  - To: original sender
  - Subject: "Re: " + original subject
  - Body: quoted original message
          ↓
User edits message (optional)
          ↓
User clicks "Send"
          ↓
Backend receives inReplyTo & threadId
          ↓
Email sent and linked to thread
          ↓
Reply appears in conversation thread
```

## Styling & Theming

### Tailwind Classes Used

**Modal Overlay**:
```css
fixed inset-0 bg-black bg-opacity-50 z-50
```

**Modal Content**:
```css
bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh]
```

**Input Fields**:
```css
px-3 py-2 border border-gray-300 rounded-md 
focus:outline-none focus:ring-2 focus:ring-blue-500
```

**Send Button**:
```css
bg-blue-600 text-white rounded-md hover:bg-blue-700
transition-colors disabled:opacity-50
```

**Attachment Pills**:
```css
bg-gray-50 rounded border border-gray-200 p-2
```

### Dark Mode Support

All components include dark mode variants:
- `dark:bg-slate-900`
- `dark:text-slate-100`
- `dark:border-slate-700`
- `dark:hover:bg-slate-800`

## Error Handling

### Client-Side Validation

1. **Required Fields**:
   - To field cannot be empty
   - Subject field cannot be empty
   - Integration must be selected

2. **File Attachments**:
   - Maximum file size: 25MB per file (configurable)
   - Total attachment size: 50MB (configurable)
   - Allowed file types: All (can be restricted)

3. **Network Errors**:
   - Display user-friendly error messages
   - Retry button for failed sends
   - Preserve form data on error

### Server-Side Validation

1. **Authentication**:
   - JWT token required
   - User must own the integration
   - Integration must be active

2. **Email Validation**:
   - Valid email format for recipients
   - Integration credentials must be valid
   - SMTP/API connection must succeed

3. **Error Responses**:
   ```json
   {
     "error": "Failed to send email",
     "details": "SMTP connection timeout"
   }
   ```

## Performance Considerations

### Optimization Strategies

1. **File Uploads**:
   - Use multipart/form-data for streaming
   - Process attachments asynchronously
   - Chunk large files (planned)

2. **Email List**:
   - Pagination (20 emails per page)
   - Virtual scrolling for large lists (planned)
   - Lazy load email content

3. **Database**:
   - Indexed on: integration_id, contact_id, sent_at
   - JSONB for flexible attachment metadata
   - Separate table for attachment details

4. **Caching**:
   - Cache integration list in state
   - Debounce email list refresh
   - Memoize formatted dates

## Security Considerations

### Data Protection

1. **Authentication**:
   - All API requests require JWT token
   - User can only access their own integrations
   - Integration ownership verified server-side

2. **Email Content**:
   - HTML sanitization (planned)
   - XSS prevention in rich text editor
   - Attachment virus scanning (planned)

3. **Credentials**:
   - Email credentials encrypted at rest (AES-256-GCM)
   - Never exposed in API responses
   - Stored securely in integrations table

4. **Rate Limiting**:
   - Per-user sending limits (planned)
   - Per-integration quotas (planned)
   - Abuse detection (planned)

## Testing

### Manual Testing Checklist

- [ ] Compose and send email via Gmail
- [ ] Compose and send email via Outlook
- [ ] Compose and send email via SMTP
- [ ] Add single attachment
- [ ] Add multiple attachments
- [ ] Reply to received email
- [ ] Forward received email
- [ ] Send to multiple recipients (To, CC, BCC)
- [ ] Use rich text formatting
- [ ] Send email linked to contact
- [ ] Verify email appears in sent history
- [ ] Verify attachment metadata stored
- [ ] Check email threading preservation
- [ ] Test error handling (invalid recipient)
- [ ] Test error handling (no integration)
- [ ] Test mobile responsive design

### Automated Testing (Planned)

```typescript
// Example test cases
describe('EmailComposer', () => {
  it('should open composer in compose mode', () => {});
  it('should validate required fields', () => {});
  it('should handle file attachments', () => {});
  it('should send email successfully', () => {});
  it('should display error on send failure', () => {});
  it('should pre-fill fields in reply mode', () => {});
  it('should quote original message in reply', () => {});
});
```

## Future Enhancements

### Planned Features

1. **Draft Auto-Save**:
   - Save draft every 30 seconds
   - Restore unsent drafts
   - Draft folder

2. **Templates**:
   - Pre-defined email templates
   - Variable substitution
   - Template library

3. **Scheduling**:
   - Send email at specific time
   - Timezone support
   - Recurring emails

4. **Rich Text Enhancements**:
   - Image inline insertion
   - Tables
   - Font selection
   - Color picker

5. **Attachment Improvements**:
   - Drag & drop upload
   - Image preview
   - File preview for PDFs
   - Cloud storage integration

6. **Email Tracking**:
   - Read receipts
   - Link click tracking
   - Open tracking

7. **Bulk Sending**:
   - Send to multiple contacts
   - Mail merge
   - Campaign tracking

8. **Email Signatures**:
   - Customizable signatures
   - Multiple signatures per integration
   - Auto-append on send

## Troubleshooting

### Common Issues

**Issue**: "No email accounts connected"
- **Solution**: Navigate to Integrations → Email and connect an account

**Issue**: "Failed to send email"
- **Solution**: Check integration status, test connection, verify credentials

**Issue**: "Attachment too large"
- **Solution**: Reduce file size or use cloud link

**Issue**: "Email not appearing in history"
- **Solution**: Check database, verify send API succeeded

**Issue**: "Reply button not working"
- **Solution**: Ensure email has valid message_id and from_email

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/integrations/email` | GET | List email integrations |
| `/api/integrations/email/send` | POST | Send email |
| `/api/emails` | GET | List emails (inbox/sent) |
| `/api/emails/[id]` | GET | Get email details |
| `/api/emails/[id]` | PATCH | Update email (mark read) |
| `/api/emails/[id]` | DELETE | Delete email |

## Conclusion

The Email Composer provides a complete email communication system within the CRM, allowing users to:
- ✅ Send professional emails with attachments
- ✅ Reply and forward emails seamlessly
- ✅ Track all email communications
- ✅ Link emails to contact records
- ✅ Use multiple email accounts
- ✅ Maintain conversation threads

All sent emails are automatically logged and searchable, providing a complete communication history for each contact.
