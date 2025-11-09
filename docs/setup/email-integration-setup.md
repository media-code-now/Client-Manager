# Email Integration Setup Guide

## ✅ Database Setup Complete

The email sync tables have been successfully created:
- `emails` - Stores synced email messages (31 columns)
- `email_sync_state` - Tracks sync state per integration (12 columns)
- `email_attachments` - Stores email attachment metadata (10 columns)

## 📝 Next Steps

### 1. Add Environment Variables

Add the following to your `.env.local` file:

```bash
# Email encryption key (generate using the command below)
ENCRYPTION_KEY=your-64-character-hex-key

# Gmail OAuth credentials (from Google Cloud Console)
GMAIL_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret

# Outlook OAuth credentials (from Azure AD)
OUTLOOK_CLIENT_ID=your-microsoft-oauth-client-id
OUTLOOK_CLIENT_SECRET=your-microsoft-oauth-client-secret

# Cron job secret (random string for security)
CRON_SECRET=your-random-secret-for-cron-endpoint
```

### 2. Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set Up Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/integrations/email/oauth/callback`
   - `https://your-domain.com/api/integrations/email/oauth/callback`
7. Copy Client ID and Client Secret to `.env.local`

### 4. Set Up Outlook OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: Your CRM - Email Integration
5. Supported account types: Accounts in any organizational directory and personal Microsoft accounts
6. Redirect URI: Web - `http://localhost:3000/api/integrations/email/oauth/callback`
7. After creation, go to "Certificates & secrets" → "New client secret"
8. Copy Application (client) ID and client secret value to `.env.local`
9. Go to "API permissions" → "Add a permission" → "Microsoft Graph"
10. Add these permissions:
    - Mail.ReadWrite (Delegated)
    - Mail.Send (Delegated)
    - User.Read (Delegated)

### 5. Test Email Integration

#### Test with Gmail:
1. Start the development server: `npm run dev`
2. Navigate to the Integrations section in the dashboard
3. Click on Gmail under "Email Providers"
4. Choose "OAuth Setup" tab
5. Click "Connect with Gmail"
6. Authorize the app
7. Integration should be created successfully

#### Test with Manual SMTP (Yahoo, Gmail App Password, Custom):
1. Go to Integrations → Email Providers
2. Click on the provider (e.g., Yahoo)
3. Choose "Manual Setup" tab
4. Fill in:
   - Name: My Yahoo Email
   - Email: your-email@yahoo.com
   - Password: Your app password (not regular password)
   - SMTP Host: smtp.mail.yahoo.com
   - SMTP Port: 587
   - IMAP Host: imap.mail.yahoo.com
   - IMAP Port: 993
5. Click "Test Connection"
6. If successful, click "Save Integration"

### 6. Test Email Sync

#### Manual Sync Test:
```bash
curl -X POST http://localhost:3000/api/emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"integrationId": "your-integration-id"}'
```

#### Check Synced Emails:
```bash
curl http://localhost:3000/api/emails?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Verify Cron Job

The cron job is configured in `vercel.json` to run every 5 minutes in production.

For local testing:
1. Set `CRON_SECRET` in `.env.local`
2. Trigger manually:
```bash
curl -X POST http://localhost:3000/api/cron/sync-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 8. Monitor Sync Status

Check sync status:
```bash
curl http://localhost:3000/api/cron/sync-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🔧 Troubleshooting

### OAuth Issues
- Make sure redirect URIs exactly match in Google/Azure console
- Check that OAuth credentials are correctly set in `.env.local`
- Verify that the callback URL is accessible

### SMTP/IMAP Connection Issues
- Gmail requires "App Passwords" (not regular password)
- Yahoo requires "App Passwords" (Account Security → Generate app password)
- Check firewall settings for IMAP/SMTP ports

### Sync Issues
- Check `integration_logs` table for error messages
- Verify `email_sync_state` table for last sync status
- Check that the integration status is 'active'

### Contact Matching
- Contacts are matched by email address (case-insensitive)
- If no match found, new contact is created with:
  - `status='lead'`
  - `source='email_sync'`
  - First and last name parsed from email display name

## 📚 Additional Documentation

- [Email Sync System Documentation](../features/email-sync-system.md)
- [Backend API Documentation](../api/backend-api.md)

## 🎯 Feature Status

- ✅ Email integration module (OAuth + Manual setup)
- ✅ Encryption service (AES-256-GCM)
- ✅ Email sync service (Gmail, Outlook, IMAP)
- ✅ Contact auto-matching and creation
- ✅ Email threading support
- ✅ Background cron job
- ✅ Database tables created
- ⏳ OAuth credentials configuration
- ⏳ Frontend email list UI
- ⏳ Email composition UI

## 🚀 Next Development Tasks

1. Configure OAuth credentials for Gmail and Outlook
2. Test end-to-end OAuth flow
3. Test manual SMTP/IMAP setup with Yahoo
4. Verify email sync and contact matching
5. Build frontend email list component
6. Add email detail view
7. Implement email composition UI
8. Add attachment download functionality
9. Deploy to Vercel and test production cron
