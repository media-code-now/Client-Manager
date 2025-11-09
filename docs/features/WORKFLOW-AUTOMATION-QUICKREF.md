# Email Workflow Automation - Quick Reference

## Quick Start

### 1. Create Your First Workflow

```javascript
const workflow = {
  name: "Auto-Engage Workflow",
  description: "Mark leads as engaged when they open emails",
  is_active: true,
  triggers: [{
    trigger_type: "email_opened"
  }],
  conditions: [{
    condition_type: "lead_stage",
    operator: "equals",
    value: "contacted"
  }],
  actions: [{
    action_type: "update_lead_stage",
    action_config: { stage: "engaged" },
    execution_order: 1
  }]
};

const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(workflow)
});
```

### 2. Integrate into Email Endpoints

```typescript
import WorkflowEngine from '@/lib/workflow-engine';

// After sending email
const engine = new WorkflowEngine();
await engine.processEmailSent(emailId);

// After email opened
await engine.processEmailOpened(emailId);

// After link clicked
await engine.processEmailClicked(emailId, linkUrl);

// After receiving email
await engine.processEmailReceived(emailId);
```

## Cheat Sheet

### Trigger Types
- `email_received` - Incoming email
- `email_sent` - Outgoing email
- `email_opened` - Tracking pixel loaded
- `email_clicked` - Link clicked
- `email_replied` - Reply received
- `no_reply_after_days` - No reply after X days
- `contact_created` - New contact added

### Condition Operators
- `equals` / `not_equals`
- `contains` / `not_contains`
- `greater_than` / `less_than`
- `in` / `not_in`

### Action Types
- `send_email` - Send from template
- `update_lead_stage` - Change lead stage
- `add_tag` / `remove_tag` - Manage tags
- `create_task` - Create follow-up task
- `send_notification` - Notify user
- `mark_as_engaged` - Update engagement score
- `update_contact_field` - Update contact data
- `assign_to_user` - Assign to team member

## Common Patterns

### Pattern 1: Auto-Engage on Open

```json
{
  "triggers": [{ "trigger_type": "email_opened" }],
  "conditions": [{ "condition_type": "lead_stage", "operator": "equals", "value": "contacted" }],
  "actions": [
    { "action_type": "update_lead_stage", "action_config": { "stage": "engaged" } },
    { "action_type": "mark_as_engaged", "action_config": {} }
  ]
}
```

### Pattern 2: Follow-Up After 3 Days

```json
{
  "triggers": [{ "trigger_type": "no_reply_after_days", "trigger_config": { "days": 3 } }],
  "conditions": [{ "condition_type": "lead_stage", "operator": "not_equals", "value": "won" }],
  "actions": [
    { "action_type": "send_email", "action_config": { "template_id": 10 } },
    { "action_type": "create_task", "action_config": { "title": "Follow up", "due_in_days": 1 } }
  ]
}
```

### Pattern 3: New Lead Welcome

```json
{
  "triggers": [{ "trigger_type": "email_received" }],
  "conditions": [{ "condition_type": "contact_tag", "operator": "not_in", "value": "customer,partner" }],
  "actions": [
    { "action_type": "update_lead_stage", "action_config": { "stage": "contacted" } },
    { "action_type": "send_email", "action_config": { "template_id": 3 } },
    { "action_type": "send_notification", "action_config": { "user_id": 1, "message": "New lead" } }
  ]
}
```

### Pattern 4: High-Interest Detection

```json
{
  "triggers": [{ "trigger_type": "email_clicked" }],
  "actions": [
    { "action_type": "add_tag", "action_config": { "tag": "high-interest" } },
    { "action_type": "mark_as_engaged", "action_config": {} },
    { "action_type": "create_task", "action_config": { "title": "Call ASAP", "priority": "High" } }
  ]
}
```

## API Quick Reference

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workflows` | List all workflows |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/[id]` | Get workflow details |
| PUT | `/api/workflows/[id]` | Update workflow |
| DELETE | `/api/workflows/[id]` | Delete workflow |
| PATCH | `/api/workflows/[id]` | Toggle active status |
| POST | `/api/workflows/[id]/execute` | Test workflow |

### Query Parameters

- `?is_active=true` - Filter by active status
- `?trigger_type=email_opened` - Filter by trigger type

## Database Schema Quick Ref

### Tables
- `email_workflows` - Workflow definitions
- `workflow_triggers` - Event triggers
- `workflow_conditions` - Filter conditions
- `workflow_actions` - Actions to execute
- `workflow_executions` - Execution history
- `workflow_action_logs` - Action-level logs
- `email_templates` - Email templates
- `scheduled_followups` - Delayed email queue

### Key Columns

**email_workflows**
- `id`, `user_id`, `name`, `description`, `is_active`

**workflow_triggers**
- `workflow_id`, `trigger_type`, `trigger_config` (JSONB)

**workflow_conditions**
- `workflow_id`, `condition_type`, `operator`, `value`

**workflow_actions**
- `workflow_id`, `action_type`, `action_config` (JSONB), `execution_order`

**workflow_executions**
- `workflow_id`, `status`, `actions_executed`, `actions_total`, `error_message`

## Testing Workflows

### Test with Mock Data

```javascript
const testData = {
  email_id: 123,
  contact_id: 456,
  email_data: {
    subject: "Test Subject",
    from_email: "test@example.com",
    open_count: 1,
    click_count: 0
  }
};

const response = await fetch(`/api/workflows/${workflowId}/execute`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ testData })
});

const { execution } = await response.json();
console.log('Actions executed:', execution.action_results);
```

## Debugging

### Check Execution Status

```sql
SELECT id, workflow_id, status, error_message 
FROM workflow_executions 
WHERE workflow_id = $1 
ORDER BY started_at DESC 
LIMIT 10;
```

### View Action Logs

```sql
SELECT action_type, status, result, error_message
FROM workflow_action_logs
WHERE execution_id = $1;
```

### Find Failed Workflows

```sql
SELECT w.name, COUNT(*) as failures
FROM workflow_executions e
JOIN email_workflows w ON w.id = e.workflow_id
WHERE e.status = 'failed'
GROUP BY w.id, w.name
ORDER BY failures DESC;
```

## Common Issues

### Issue: Workflow Not Executing
**Solution**: Check if `is_active = true` and conditions are passing

### Issue: Action Failing
**Solution**: Verify action_config has all required fields

### Issue: Template Not Found
**Solution**: Ensure template_id exists in email_templates table

### Issue: No Contact Data
**Solution**: Verify email has contact_id linked

## Performance Tips

1. **Use Specific Conditions** - Reduce unnecessary executions
2. **Order Actions Efficiently** - Update data before sending notifications
3. **Limit Active Workflows** - Too many can slow down email processing
4. **Monitor Execution Logs** - Identify and fix slow workflows
5. **Use Background Jobs** - Process follow-ups asynchronously

## Security Checklist

- ✅ Workflows scoped to user_id
- ✅ JWT authentication on all endpoints
- ✅ Execution logging for audit trail
- ⚠️ Validate action configs before execution
- ⚠️ Rate limiting (TODO)
- ⚠️ Template variable sanitization (TODO)

## Background Job Setup

### Vercel Cron

```json
{
  "crons": [{
    "path": "/api/cron/process-followups",
    "schedule": "*/5 * * * *"
  }]
}
```

### Cron Endpoint

```typescript
// src/app/api/cron/process-followups/route.ts
import WorkflowEngine from '@/lib/workflow-engine';

export async function GET() {
  const engine = new WorkflowEngine();
  await engine.processPendingFollowUps();
  return Response.json({ success: true });
}
```

## Next Steps

1. ✅ Database schema created
2. ✅ Workflow engine implemented
3. ✅ API endpoints ready
4. ⏳ Build WorkflowBuilder UI component
5. ⏳ Create EmailTemplateEditor component
6. ⏳ Integrate into existing email endpoints
7. ⏳ Setup background job for follow-ups
8. ⏳ Add workflow monitoring dashboard

## Resources

- Full Documentation: `docs/features/WORKFLOW-AUTOMATION.md`
- Database Schema: `docs/database/migrations/009_create_email_workflows_tables.sql`
- Workflow Engine: `src/lib/workflow-engine.ts`
- API Routes: `src/app/api/workflows/`

---

**Version**: 1.0.0  
**Last Updated**: January 2025
