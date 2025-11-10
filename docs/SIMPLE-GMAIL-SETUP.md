# Simple Gmail & Calendar Sync Setup

## 🎯 Goal
Connect your Gmail account to the CRM and automatically sync emails.

---

## ⏱️ Time Required
- **Gmail OAuth**: 30 minutes
- **Email Sync**: 15 minutes
- **Total**: 45 minutes

---

## 📋 Part 1: Gmail OAuth Setup (30 min)

### What This Does
Allows users to click "Connect with Gmail" and authorize access with one click.

### Step-by-Step

#### 1. Go to Google Cloud Console
**Link**: https://console.cloud.google.com/

#### 2. Create New Project
- Click "Select a project" (top navigation)
- Click "New Project"
- Project name: `CRM Email Sync`
- Click "Create"
- Wait ~30 seconds

#### 3. Enable Gmail API
- With your new project selected
- Go to: APIs & Services → Library
- Search: "Gmail API"
- Click "Gmail API"
- Click "Enable"
- Wait ~10 seconds

#### 4. Enable Google Calendar API (Optional)
- Still in Library
- Search: "Google Calendar API"
- Click "Google Calendar API"
- Click "Enable"
- Wait ~10 seconds

#### 5. Configure OAuth Consent Screen
- Go to: APIs & Services → OAuth consent screen
- Select: "External"
- Click "Create"

**Fill in**:
- **App name**: Your CRM Name (e.g., "My CRM")
- **User support email**: Your email
- **Developer contact**: Your email
- Click "Save and Continue"

**Add Scopes**:
- Click "Add or Remove Scopes"
- Search and add these scopes:
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.modify`
  - `https://www.googleapis.com/auth/calendar` (if you want calendar)
- Click "Update"
- Click "Save and Continue"

**Test Users**:
- Click "Add Users"
- Add your Gmail address
- Click "Add"
- Click "Save and Continue"

#### 6. Create OAuth Credentials
- Go to: APIs & Services → Credentials
- Click "Create Credentials" → "OAuth client ID"
- Application type: "Web application"
- Name: "CRM Web Client"

**Authorized redirect URIs**:
- Click "Add URI"
- For local: `http://localhost:3000/api/integrations/email/oauth/callback`
- Click "Add URI" again
- For production: `https://YOUR-NETLIFY-APP.netlify.app/api/integrations/email/oauth/callback`
  - ⚠️ Replace `YOUR-NETLIFY-APP` with your actual Netlify site name!

- Click "Create"

**IMPORTANT**: 
- Copy your **Client ID** (looks like: `123456-abc.apps.googleusercontent.com`)
- Copy your **Client Secret** (looks like: `GOCSPX-abc123xyz`)
- Keep these safe!

#### 7. Add Credentials to Netlify
- Go to: https://app.netlify.com/
- Select your site
- Go to: Site configuration → Environment variables
- Add these variables:

```
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

⚠️ Replace the values with your actual credentials and URL!

- Click "Save"

#### 8. Deploy
```bash
# In your terminal:
cd "/Users/noamsadi/Projects/Client Manager"
git add .
git commit -m "Configure Gmail OAuth"
git push
```

Wait ~2 minutes for deployment to complete.

#### 9. Test Connection
- Go to your CRM: `https://your-app.netlify.app/dashboard`
- Navigate to: Settings → Integrations
- Click "Add Email Integration"
- Select "Gmail"
- Click "Connect with Gmail"
- Should redirect to Google
- Click "Allow"
- Should redirect back with success message ✅

---

## 📋 Part 2: Automatic Email Sync (15 min)

### What This Does
Automatically checks Gmail every 5 minutes and fetches new emails.

### Step-by-Step

#### 1. Generate CRON_SECRET
- Go to: https://www.random.org/passwords/?num=1&len=32&format=plain&rnd=new
- Copy the password (save it temporarily)

#### 2. Add CRON_SECRET to Netlify
- In Netlify Dashboard → Environment variables
- Click "Add a variable"
- Key: `CRON_SECRET`
- Value: [paste the password from step 1]
- Click "Create variable"

#### 3. Redeploy
- Go to: Deploys tab
- Click "Trigger deploy" → "Clear cache and deploy site"
- Wait ~2 minutes

#### 4. Sign Up at cron-job.org
- Go to: https://console.cron-job.org/signup
- Fill in username, email, password
- Accept terms
- Click "Sign up"
- Verify your email
- Log in: https://console.cron-job.org/login

#### 5. Create Email Sync Job
- Click "Create cronjob"
- Fill in:

```
Title: CRM Email Sync
URL: https://YOUR-NETLIFY-APP.netlify.app/api/cron/sync-emails
Enabled: ✓
Schedule: */5 * * * * (Every 5 minutes)
```

- Click "Advanced" tab
- Request Method: POST
- Add header:
  - Header name: `Authorization`
  - Header value: `Bearer YOUR_CRON_SECRET` (from step 1)
  - ⚠️ Include "Bearer " with a space!

- Click "Create"

#### 6. Test It
- Click your new cron job
- Click "Execute now"
- Should see: "200 OK" ✅

#### 7. Verify Emails Sync
- Send an email to your Gmail account
- Wait 5 minutes
- Check CRM → Mails tab
- Email should appear! ✅

---

## 📋 Part 3: Calendar Sync (Future)

### Current Status
- ❌ Not yet built
- 🔧 Can be added if you need it

### What Would It Do?
- Sync Google Calendar events to CRM
- Show meetings in CRM dashboard
- Create events from CRM
- Bidirectional sync

### Want This Feature?
Let me know and I can build it! It would take about 2-3 hours to implement.

---

## ✅ What You'll Have After Setup

### Emails:
- ✅ One-click Gmail connection
- ✅ Automatic sync every 5 minutes
- ✅ All emails in CRM Mails tab
- ✅ Emails matched to clients automatically
- ✅ Send emails from CRM
- ✅ Track opens and clicks
- ✅ Email workflows and automation

### Calendar (Future):
- ⏳ Sync calendar events
- ⏳ Show meetings in CRM
- ⏳ Create events from CRM
- ⏳ Meeting reminders

---

## 🆘 Quick Troubleshooting

### "gmail OAuth not configured"
→ Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to Netlify
→ Redeploy

### "Unauthorized" (401)
→ Check CRON_SECRET matches in both places
→ Include "Bearer " (with space) before secret

### Emails not syncing
→ Make sure cron job is enabled
→ Check it shows "200 OK" when executed
→ Verify Gmail account is connected in CRM

---

## 📚 Detailed Documentation

If you need more details:
- Gmail OAuth: `docs/GMAIL-OAUTH-SETUP.md`
- Email Sync: `docs/CRON-JOB-ORG-SETUP.md`
- Complete Guide: `docs/AUTO-GMAIL-SETUP-COMPLETE.md`

---

## 🎯 Summary

**What you're setting up**:
1. Gmail OAuth → Connect Gmail with one click
2. Email Sync → Automatic sync every 5 minutes

**What you're NOT setting up** (because it's not built yet):
- Calendar sync (can be added later if needed)

**Time**: ~45 minutes
**Cost**: $0 (everything is free)
**Maintenance**: ~0 (fully automatic)

---

## 🚀 Ready to Start?

Follow the steps above in order:
1. Gmail OAuth (30 min)
2. Email Sync (15 min)
3. Test everything (5 min)

Let me know if you get stuck on any step!
