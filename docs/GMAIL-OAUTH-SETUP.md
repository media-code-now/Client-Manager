# Gmail OAuth Setup Guide

## Error: "gmail OAuth not configured"

This error means your Gmail OAuth credentials are not configured. Follow this guide to set them up.

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "CRM Email Integration")
4. Click "Create"
5. Wait for project creation to complete

---

## Step 2: Enable Gmail API

1. In the Google Cloud Console, select your project
2. Go to "APIs & Services" → "Library"
3. Search for "Gmail API"
4. Click on "Gmail API"
5. Click "Enable"

---

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Click "Create"

**Fill in required information:**
- **App name**: Your CRM Name (e.g., "Client Manager CRM")
- **User support email**: Your email address
- **Developer contact information**: Your email address
- **App domain** (optional but recommended):
  - Homepage: `https://your-app.netlify.app`
  - Privacy policy: `https://your-app.netlify.app/privacy`
  - Terms of service: `https://your-app.netlify.app/terms`

4. Click "Save and Continue"

**Add Scopes:**
1. Click "Add or Remove Scopes"
2. Add these Gmail scopes:
   - `https://www.googleapis.com/auth/gmail.send` (Send email)
   - `https://www.googleapis.com/auth/gmail.readonly` (Read email)
   - `https://www.googleapis.com/auth/gmail.modify` (Modify email)
3. Click "Update"
4. Click "Save and Continue"

**Test Users (for development):**
1. Add your email address as a test user
2. Click "Save and Continue"

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"

**Configure OAuth Client:**
- **Name**: CRM Web Client
- **Authorized JavaScript origins**:
  - `http://localhost:3000` (for local development)
  - `https://your-app.netlify.app` (your production URL)
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/integrations/email/oauth/callback` (local)
  - `https://your-app.netlify.app/api/integrations/email/oauth/callback` (production)

4. Click "Create"
5. **IMPORTANT**: Copy your Client ID and Client Secret
   - Keep these safe! You'll need them for the next step

---

## Step 5: Add Environment Variables

### For Local Development (.env.local)

Create or update `.env.local` file in your project root:

```bash
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here

# Callback URL for OAuth
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Existing variables (keep these)
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### For Production (Netlify)

1. Go to your Netlify dashboard
2. Select your site
3. Go to "Site configuration" → "Environment variables"
4. Add the following variables:

| Key | Value | Notes |
|-----|-------|-------|
| `GMAIL_CLIENT_ID` | Your Google Client ID | From Step 4 |
| `GMAIL_CLIENT_SECRET` | Your Google Client Secret | From Step 4 |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.netlify.app` | Your Netlify URL |

**Important**: After adding environment variables:
1. Click "Save"
2. Go to "Deploys"
3. Click "Trigger deploy" → "Clear cache and deploy site"
4. Wait for deployment to complete

---

## Step 6: Test OAuth Flow

### Local Testing:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:3000/dashboard`
3. Navigate to Settings → Integrations
4. Click "Add Email Integration"
5. Select "Gmail" from dropdown
6. Choose "OAuth (Recommended)"
7. Click "Connect with Gmail"
8. Should redirect to Google OAuth consent screen
9. Authorize your app
10. Should redirect back with success message

### Production Testing:

1. Ensure environment variables are set on Netlify
2. Deploy your site
3. Go to: `https://your-app.netlify.app/dashboard`
4. Navigate to Settings → Integrations
5. Click "Add Email Integration"
6. Select "Gmail"
7. Choose "OAuth (Recommended)"
8. Click "Connect with Gmail"
9. Authorize on Google
10. Should complete successfully

---

## Troubleshooting

### Error: "gmail OAuth not configured"
**Cause**: `GMAIL_CLIENT_ID` environment variable is not set
**Solution**: 
- Check `.env.local` file has the correct variable
- For production, verify environment variables on Netlify
- Redeploy after adding variables

### Error: "redirect_uri_mismatch"
**Cause**: The redirect URI in Google Cloud doesn't match your actual URL
**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add the exact redirect URI:
   - Local: `http://localhost:3000/api/integrations/email/oauth/callback`
   - Production: `https://your-actual-netlify-url.netlify.app/api/integrations/email/oauth/callback`
4. Save and try again

### Error: "Access blocked: Authorization Error"
**Cause**: App is in testing mode and user is not added as test user
**Solution**:
1. Go to Google Cloud Console → OAuth consent screen
2. Add user's email to "Test users"
3. OR publish the app (requires verification for production)

### Error: "invalid_client"
**Cause**: Client ID or Client Secret is incorrect
**Solution**:
1. Go to Google Cloud Console → Credentials
2. Copy the correct Client ID and Client Secret
3. Update environment variables
4. Restart dev server or redeploy

### OAuth works locally but not in production
**Causes**:
1. Environment variables not set on Netlify
2. Wrong `NEXT_PUBLIC_APP_URL` value
3. Redirect URI not added for production URL

**Solution**:
1. Verify all environment variables on Netlify
2. Set `NEXT_PUBLIC_APP_URL` to your actual Netlify URL (no trailing slash)
3. Add production redirect URI to Google Cloud Console
4. Clear cache and redeploy on Netlify

---

## Security Best Practices

1. **Never commit credentials**:
   - Keep `.env.local` in `.gitignore`
   - Never push OAuth secrets to Git

2. **Use different credentials for dev/prod**:
   - Create separate OAuth clients for development and production
   - Helps with testing and security

3. **Restrict API access**:
   - In Google Cloud Console, restrict API keys to specific domains
   - Limit OAuth redirect URIs to your actual domains

4. **Rotate credentials regularly**:
   - Generate new Client Secret periodically
   - Update environment variables after rotation

5. **Monitor usage**:
   - Check Google Cloud Console for unusual API usage
   - Review OAuth consent grants regularly

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

## Quick Reference

### Required Environment Variables

```bash
# Minimum required for Gmail OAuth
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

### OAuth Callback URL Format

```
{NEXT_PUBLIC_APP_URL}/api/integrations/email/oauth/callback
```

### Gmail API Scopes Used

- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify`

---

## Summary

To fix "gmail OAuth not configured" error:

1. ✅ Create Google Cloud Project
2. ✅ Enable Gmail API
3. ✅ Configure OAuth Consent Screen
4. ✅ Create OAuth 2.0 Credentials
5. ✅ Add `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` to environment variables
6. ✅ Redeploy (if on Netlify)
7. ✅ Test OAuth flow

After completing these steps, the "Connect with Gmail" button will work correctly!
