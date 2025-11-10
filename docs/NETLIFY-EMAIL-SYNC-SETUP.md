# Netlify Automatic Email Sync Setup Guide

## Overview

This guide shows you how to set up **automatic email syncing** from Gmail to your CRM. Once configured, your CRM will automatically fetch new emails every 5 minutes without any user intervention.

---

## What Gets Automated

Once set up, this happens automatically:

1. ✅ **Every 5 minutes**: System checks all connected Gmail accounts
2. ✅ **Fetches new emails**: Only emails received since last sync
3. ✅ **Matches to clients**: Automatically associates emails with client records
4. ✅ **Triggers workflows**: Executes automation rules based on email events
5. ✅ **Updates dashboard**: New emails appear in the Mails tab
6. ✅ **Sends notifications**: Alerts users about important emails (if configured)

**Zero user action required** after initial setup!

---

## Setup Options

Netlify offers two ways to run scheduled jobs:

### Option 1: Netlify Scheduled Functions (Easiest) 💰
- **Pros**: Fully managed, no external services needed
- **Cons**: Requires Netlify Pro plan ($19/month)
- **Best for**: Production apps with budget

### Option 2: External Cron Service (Free) 🆓
- **Pros**: Works on free Netlify tier
- **Cons**: Requires external service setup
- **Best for**: Development, testing, budget-conscious projects

---

## Option 1: Netlify Scheduled Functions (Paid Plan)

### Prerequisites
- ✅ Netlify Pro plan or higher
- ✅ Gmail OAuth configured (see `GMAIL-OAUTH-SETUP.md`)
- ✅ At least one Gmail account connected in the CRM

### Step 1: Enable in netlify.toml

The `netlify.toml` file is already created in your project root. Edit it:

```toml
[[functions]]
  path = "/api/cron/sync-emails"
  schedule = "*/5 * * * *"  # Every 5 minutes
```

**Uncomment these lines** (they're commented out by default for free tier users).

### Step 2: Set CRON_SECRET Environment Variable

1. Go to Netlify Dashboard → Your Site
2. Navigate to **Site configuration** → **Environment variables**
3. Click **Add a variable**
4. Add:
   - **Key**: `CRON_SECRET`
   - **Value**: Generate a secure random string (e.g., use https://randomkeygen.com/)
   - **Scopes**: Check all environments

Example: Use a long random string like `xK9mP2vL8nQ5wR3zA7bC1dF6hJ4gT0yE` (32+ characters)

> **Why?** This secret prevents unauthorized access to your email sync endpoint.

### Step 3: Deploy

```bash
git add netlify.toml
git commit -m "Enable Netlify scheduled email sync"
git push origin main
```

Netlify will automatically detect the scheduled function and start running it.

### Step 4: Verify It's Working

1. **Check Netlify Logs**:
   - Go to Netlify Dashboard → Functions
   - Look for `sync-emails` function
   - Check execution logs

2. **Check Your CRM**:
   - Log in to your CRM
   - Go to Mails tab
   - Send a test email to one of your connected Gmail accounts
   - Wait 5 minutes
   - Refresh the Mails tab
   - Email should appear ✅

### Schedule Options

You can customize the sync frequency by changing the schedule:

```toml
# Every 5 minutes (default, most responsive)
schedule = "*/5 * * * *"

# Every 15 minutes (lower cost, less frequent)
schedule = "*/15 * * * *"

# Every 30 minutes (minimal cost)
schedule = "*/30 * * * *"

# Every hour (for low-volume email)
schedule = "0 * * * *"

# Every 2 hours (very low volume)
schedule = "0 */2 * * *"

# Business hours only (9 AM - 5 PM, Mon-Fri)
schedule = "*/5 9-17 * * 1-5"
```

**Cron Format**: `minute hour day month weekday`

---

## Option 2: External Cron Service (Free Tier)

### Recommended Services

1. **cron-job.org** (Free, reliable) ⭐ Recommended
2. **EasyCron** (Free tier available)
3. **Uptime Robot** (Can trigger webhooks)

### Setup with cron-job.org

#### Step 1: Generate CRON_SECRET

1. Generate a secure random string: https://randomkeygen.com/
2. Copy the "Fort Knox Password" value
3. Add to Netlify environment variables:
   - **Key**: `CRON_SECRET`
   - **Value**: Your generated secret

#### Step 2: Create Cron Job

1. Go to https://cron-job.org/
2. Sign up for free account
3. Click **Create Cronjob**

**Configure the job:**
- **Title**: CRM Email Sync
- **Address (URL)**: `https://your-app-name.netlify.app/api/cron/sync-emails`
- **Schedule**: Every 5 minutes
  - Pattern: `*/5 * * * *`
- **Request Method**: POST
- **Request headers**: Click "Add header"
  - Header name: `Authorization`
  - Header value: `Bearer YOUR_CRON_SECRET` (replace with your actual secret)

4. Click **Create**

#### Step 3: Test the Job

1. In cron-job.org, click your job
2. Click "Execute now"
3. Check the response:
   - ✅ **200 OK**: Working perfectly
   - ❌ **401 Unauthorized**: Check CRON_SECRET
   - ❌ **500 Error**: Check Netlify logs for details

#### Step 4: Verify in CRM

Same as Option 1 Step 4 above.

### Setup with EasyCron

1. Go to https://www.easycron.com/
2. Sign up for free account
3. Click **Add Cron Job**
4. Configure:
   - **URL**: `https://your-app-name.netlify.app/api/cron/sync-emails`
   - **Cron Expression**: `*/5 * * * *`
   - **HTTP Method**: POST
   - **HTTP Headers**:
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     Content-Type: application/json
     ```
5. Save and enable

---

## Monitoring & Troubleshooting

### Check Sync Status

Your CRM tracks email sync status in the database. To check:

1. **Via CRM Dashboard** (if you build a sync status page):
   - Shows last sync time
   - Number of emails synced
   - Any errors

2. **Via Netlify Logs**:
   - Go to Netlify Dashboard → Functions
   - Filter for `sync-emails`
   - Review execution logs

### Expected Log Output (Success)

```
📧 Starting email sync job...
✅ Syncing integration: Gmail Account (user@example.com)
📥 Fetched 3 new messages
✅ Integration synced successfully: 3 messages
✅ Email sync completed: {
  total: 1,
  successful: 1,
  failed: 0,
  messages: 3,
  duration: "2341ms"
}
```

### Common Issues

#### Issue: "Unauthorized" (401)
**Cause**: CRON_SECRET mismatch or missing
**Solution**:
1. Check CRON_SECRET is set in Netlify environment variables
2. Verify Authorization header in cron service matches exactly
3. Format must be: `Bearer YOUR_SECRET` (note the space after "Bearer")

#### Issue: "gmail OAuth not configured" (500)
**Cause**: OAuth credentials not set
**Solution**: Follow `GMAIL-OAUTH-SETUP.md` to configure OAuth

#### Issue: "No active integrations found"
**Cause**: No Gmail accounts connected yet
**Solution**: 
1. Log into CRM
2. Go to Settings → Integrations
3. Connect at least one Gmail account

#### Issue: Cron job not running
**Netlify Scheduled Functions**:
- Verify you're on a paid plan
- Check function is uncommented in `netlify.toml`
- Redeploy after changes

**External Cron Service**:
- Check job is enabled
- Verify URL is correct (no typos)
- Check service account has sufficient credits

#### Issue: Emails not appearing in CRM
**Debugging steps**:
1. Check cron job is executing (200 response)
2. Check Netlify function logs for errors
3. Verify Gmail account is properly connected
4. Check email inbox has new emails since last sync
5. Try manual sync: Send POST to `/api/cron/sync-emails` with valid auth

---

## Performance & Costs

### Netlify Scheduled Functions Costs

Netlify Pro plan includes:
- Unlimited scheduled functions
- 125k function invocations/month
- 100 hours compute time/month

**Email sync usage** (5-minute interval):
- Invocations per day: 288 (24h × 12 per hour)
- Invocations per month: ~8,640
- **Well within limits** ✅

### External Cron Service Costs

**cron-job.org Free Tier**:
- 10 jobs
- 1-minute minimum interval
- **Perfect for email sync** ✅

**EasyCron Free Tier**:
- 1 cron job
- 20-minute minimum interval
- Works, but slower sync

---

## Advanced Configuration

### Adjust Sync Frequency Based on Time

You can sync more frequently during business hours:

**Netlify (two scheduled functions)**:
```toml
# Business hours: every 5 minutes
[[functions]]
  path = "/api/cron/sync-emails"
  schedule = "*/5 9-17 * * 1-5"

# After hours: every 30 minutes
[[functions]]
  path = "/api/cron/sync-emails"
  schedule = "*/30 0-8,18-23 * * *"
```

**External Cron**: Create two separate jobs with different schedules

### Sync Specific Accounts Only

Modify `/api/cron/sync-emails/route.ts` to filter by account:

```typescript
// Only sync high-priority accounts during off-hours
const integrations = await getActiveIntegrations();
const filtered = integrations.filter(i => 
  i.priority === 'high' || isBusinessHours()
);
```

### Custom Sync Intervals per Account

Store sync preferences in database:
- VIP clients: Every 5 minutes
- Regular clients: Every 15 minutes  
- Archive accounts: Every hour

---

## Security Best Practices

1. **Always use CRON_SECRET**:
   - Never expose sync endpoint without authentication
   - Use long, random secret (32+ characters)
   - Rotate secret periodically

2. **Use HTTPS only**:
   - Netlify provides HTTPS by default
   - Never use HTTP for cron endpoints

3. **Monitor sync logs**:
   - Watch for unusual activity
   - Set up alerts for excessive failures
   - Review sync patterns regularly

4. **Rate limiting**:
   - Gmail API has quotas (250 quota units/user/second)
   - Email sync service respects these limits
   - Don't sync more frequently than needed

---

## Testing Your Setup

### Manual Test

Trigger sync manually to verify everything works:

```bash
# Replace with your actual values
NETLIFY_URL="https://your-app.netlify.app"
CRON_SECRET="your-cron-secret"

curl -X POST \
  "$NETLIFY_URL/api/cron/sync-emails" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected Response** (success):
```json
{
  "success": true,
  "total": 1,
  "successful": 1,
  "failed": 0,
  "totalMessages": 3,
  "results": [
    {
      "integrationId": "uuid-here",
      "success": true,
      "messagesSynced": 3
    }
  ]
}
```

### End-to-End Test

1. **Send test email**:
   - Send email to your connected Gmail account
   - Note the time

2. **Wait for sync**:
   - Wait 5 minutes (or your configured interval)
   - Check cron service shows successful execution

3. **Verify in CRM**:
   - Log into CRM
   - Go to Mails tab
   - Email should appear with correct:
     - Subject
     - Sender
     - Timestamp
     - Preview text
     - Matched client (if applicable)

4. **Check workflow triggers** (if configured):
   - Verify any automation rules executed
   - Check for created tasks, notifications, etc.

---

## Next Steps

After email sync is working:

1. **Connect Gmail OAuth** (if not done): See `GMAIL-OAUTH-SETUP.md`
2. **Set up workflows**: Automate actions based on email events
3. **Configure notifications**: Get alerted for important emails
4. **Build sync status dashboard**: Show users sync health
5. **Set up email tracking**: Track opens and clicks

---

## Support

### Documentation
- Gmail OAuth Setup: `docs/GMAIL-OAUTH-SETUP.md`
- Workflow Automation: `docs/workflows/README.md`
- Email Service: `docs/EMAIL-SERVICE-OVERVIEW.md`

### Troubleshooting
- Netlify Logs: Dashboard → Functions → sync-emails
- CRM Logs: Settings → System → Logs (if available)
- Database Sync State: `email_sync_state` table

---

## Summary Checklist

- [ ] Choose sync option (Netlify Scheduled or External Cron)
- [ ] Set CRON_SECRET environment variable on Netlify
- [ ] Configure sync schedule (5 minutes recommended)
- [ ] Deploy changes
- [ ] Test manual sync execution
- [ ] Verify emails appear in CRM
- [ ] Monitor for 24 hours to ensure stability
- [ ] Set up alerts for failures (optional)

Once complete, your CRM will **automatically fetch new emails every 5 minutes** with zero manual intervention! 🎉
