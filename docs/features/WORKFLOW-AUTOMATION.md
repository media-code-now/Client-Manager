# Email Workflow Automation System

## Overview

The Email Workflow Automation system provides powerful, event-driven automation capabilities for your CRM. Similar to HubSpot or Mailchimp automation, it allows you to create sophisticated workflows that respond to email activity and automatically perform actions like updating lead stages, sending follow-ups, creating tasks, and notifying team members.

## Architecture

### Core Components

1. **Workflow Engine** (`src/lib/workflow-engine.ts`)
   - Event processing for email received/sent/opened/clicked/replied
   - Condition evaluation with flexible operators
   - Action execution with error handling
   - Scheduled follow-up management

2. **Database Schema** (8 tables)
   - `email_workflows`: Workflow definitions
   - `workflow_triggers`: Event triggers
   - `workflow_conditions`: Filtering conditions
   - `workflow_actions`: Actions to execute
   - `workflow_executions`: Execution history
   - `workflow_action_logs`: Per-action logs
   - `email_templates`: Email templates
   - `scheduled_followups`: Delayed email queue

3. **API Endpoints** (`src/app/api/workflows/`)
   - GET `/api/workflows` - List workflows
   - POST `/api/workflows` - Create workflow
   - GET `/api/workflows/[id]` - Get workflow details
   - PUT `/api/workflows/[id]` - Update workflow
   - DELETE `/api/workflows/[id]` - Delete workflow
   - PATCH `/api/workflows/[id]` - Toggle active status
   - POST `/api/workflows/[id]/execute` - Manual execution for testing

## Trigger Types

### Available Triggers

| Trigger Type | Description | When It Fires |
|-------------|-------------|---------------|
| `email_received` | Incoming email arrives | When email sync detects new email |
| `email_sent` | Outgoing email sent | When email is successfully sent |
| `email_opened` | Email tracking pixel loads | When recipient opens the email |
| `email_clicked` | Email link clicked | When recipient clicks tracked link |
| `email_replied` | Reply received to sent email | When reply is detected in thread |
| `no_reply_after_days` | No reply after X days | After specified days with no reply |
| `contact_created` | New contact added | When new client/contact is created |

### Trigger Configuration

Each trigger can have a configuration object:

```json
{
  "trigger_type": "no_reply_after_days",
  "trigger_config": {
    "days": 3
  }
}
```

## Condition Types

Conditions filter when workflows should execute:

### Available Conditions

| Condition Type | Description | Example Values |
|---------------|-------------|----------------|
| `lead_stage` | Contact's current stage | new, contacted, engaged, qualified, won |
| `contact_tag` | Tags associated with contact | vip, hot-lead, cold-lead |
| `email_subject_contains` | Email subject text | "proposal", "meeting", "inquiry" |
| `email_from_domain` | Sender's email domain | gmail.com, company.com |
| `days_since_last_contact` | Days since last interaction | 7, 14, 30 |
| `contact_status` | Contact's active status | active, inactive, archived |

### Operators

- `equals` - Exact match
- `not_equals` - Does not match
- `contains` - Contains substring
- `not_contains` - Does not contain substring
- `greater_than` - Numerical greater than
- `less_than` - Numerical less than
- `in` - In comma-separated list
- `not_in` - Not in comma-separated list

### Example Condition

```json
{
  "condition_type": "lead_stage",
  "operator": "equals",
  "value": "contacted"
}
```

## Action Types

Actions are executed when workflow triggers fire and conditions pass:

### Available Actions

| Action Type | Description | Required Config |
|------------|-------------|-----------------|
| `send_email` | Send email from template | template_id, delay_hours (optional) |
| `update_lead_stage` | Change lead stage | stage, reason (optional) |
| `add_tag` | Add tag to contact | tag |
| `remove_tag` | Remove tag from contact | tag |
| `create_task` | Create follow-up task | title, description, due_in_days, priority |
| `send_notification` | Notify user | user_id, message |
| `mark_as_engaged` | Update engagement score | reason (optional) |
| `update_contact_field` | Update contact field | field, value |
| `assign_to_user` | Assign contact to user | user_id |
| `webhook` | Call external webhook | url, method, body (planned) |

### Action Execution Order

Actions execute sequentially in the order specified by `execution_order`. Lower numbers execute first.

### Example Action

```json
{
  "action_type": "send_email",
  "action_config": {
    "template_id": 5,
    "delay_hours": 0
  },
  "execution_order": 1
}
```

## Common Workflow Examples

### 1. Auto-Engage Workflow

**Goal**: Mark leads as "engaged" when they open emails

```json
{
  "name": "Auto-Engage on Email Open",
  "description": "Automatically mark leads as engaged when they open our emails",
  "is_active": true,
  "triggers": [
    {
      "trigger_type": "email_opened",
      "trigger_config": {}
    }
  ],
  "conditions": [
    {
      "condition_type": "lead_stage",
      "operator": "equals",
      "value": "contacted"
    }
  ],
  "actions": [
    {
      "action_type": "update_lead_stage",
      "action_config": {
        "stage": "engaged",
        "reason": "Opened email"
      },
      "execution_order": 1
    },
    {
      "action_type": "mark_as_engaged",
      "action_config": {
        "reason": "Email opened"
      },
      "execution_order": 2
    },
    {
      "action_type": "send_notification",
      "action_config": {
        "user_id": 1,
        "message": "Lead opened your email and was marked as engaged"
      },
      "execution_order": 3
    }
  ]
}
```

### 2. 3-Day Follow-Up Workflow

**Goal**: Send automated follow-up if no reply after 3 days

```json
{
  "name": "3-Day Follow-Up",
  "description": "Send follow-up email if no reply after 3 days",
  "is_active": true,
  "triggers": [
    {
      "trigger_type": "no_reply_after_days",
      "trigger_config": {
        "days": 3
      }
    }
  ],
  "conditions": [
    {
      "condition_type": "lead_stage",
      "operator": "not_equals",
      "value": "won"
    }
  ],
  "actions": [
    {
      "action_type": "send_email",
      "action_config": {
        "template_id": 10
      },
      "execution_order": 1
    },
    {
      "action_type": "create_task",
      "action_config": {
        "title": "Follow up on proposal",
        "description": "Call to discuss the proposal",
        "due_in_days": 1,
        "priority": "High"
      },
      "execution_order": 2
    },
    {
      "action_type": "add_tag",
      "action_config": {
        "tag": "needs-followup"
      },
      "execution_order": 3
    }
  ]
}
```

### 3. New Lead Welcome Workflow

**Goal**: Send welcome email and notify sales team for new inbound leads

```json
{
  "name": "New Lead Welcome",
  "description": "Welcome new leads and notify sales team",
  "is_active": true,
  "triggers": [
    {
      "trigger_type": "email_received",
      "trigger_config": {}
    }
  ],
  "conditions": [
    {
      "condition_type": "contact_tag",
      "operator": "not_in",
      "value": "customer,partner,existing-lead"
    }
  ],
  "actions": [
    {
      "action_type": "update_lead_stage",
      "action_config": {
        "stage": "contacted",
        "reason": "Inbound email received"
      },
      "execution_order": 1
    },
    {
      "action_type": "add_tag",
      "action_config": {
        "tag": "new-lead"
      },
      "execution_order": 2
    },
    {
      "action_type": "send_email",
      "action_config": {
        "template_id": 3
      },
      "execution_order": 3
    },
    {
      "action_type": "send_notification",
      "action_config": {
        "user_id": 1,
        "message": "New inbound lead received an auto-reply"
      },
      "execution_order": 4
    }
  ]
}
```

### 4. High-Interest Lead Workflow

**Goal**: Tag and notify when leads click multiple links

```json
{
  "name": "High-Interest Lead Detection",
  "description": "Identify highly engaged leads based on link clicks",
  "is_active": true,
  "triggers": [
    {
      "trigger_type": "email_clicked",
      "trigger_config": {}
    }
  ],
  "conditions": [],
  "actions": [
    {
      "action_type": "add_tag",
      "action_config": {
        "tag": "high-interest"
      },
      "execution_order": 1
    },
    {
      "action_type": "mark_as_engaged",
      "action_config": {
        "reason": "Clicked email link"
      },
      "execution_order": 2
    },
    {
      "action_type": "send_notification",
      "action_config": {
        "user_id": 1,
        "message": "High-interest lead clicked a link in your email"
      },
      "execution_order": 3
    },
    {
      "action_type": "create_task",
      "action_config": {
        "title": "Call high-interest lead",
        "description": "Lead showed high interest by clicking links",
        "due_in_days": 0,
        "priority": "High"
      },
      "execution_order": 4
    }
  ]
}
```

## API Usage

### Create a Workflow

```javascript
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Auto-Engage Workflow",
    description: "Mark leads as engaged when they open emails",
    is_active: true,
    triggers: [
      {
        trigger_type: "email_opened",
        trigger_config: {}
      }
    ],
    conditions: [
      {
        condition_type: "lead_stage",
        operator: "equals",
        value: "contacted"
      }
    ],
    actions: [
      {
        action_type: "update_lead_stage",
        action_config: {
          stage: "engaged",
          reason: "Opened email"
        },
        execution_order: 1
      }
    ]
  })
});

const { workflow } = await response.json();
console.log('Created workflow:', workflow);
```

### List Workflows

```javascript
// Get all workflows
const response = await fetch('/api/workflows', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Filter by active status
const activeWorkflows = await fetch('/api/workflows?is_active=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Filter by trigger type
const openWorkflows = await fetch('/api/workflows?trigger_type=email_opened', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Update a Workflow

```javascript
const response = await fetch(`/api/workflows/${workflowId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Updated Workflow Name",
    description: "Updated description",
    is_active: true,
    triggers: [...],
    conditions: [...],
    actions: [...]
  })
});
```

### Toggle Workflow Active Status

```javascript
const response = await fetch(`/api/workflows/${workflowId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { is_active } = await response.json();
console.log('New status:', is_active);
```

### Delete a Workflow

```javascript
const response = await fetch(`/api/workflows/${workflowId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Test a Workflow

```javascript
const response = await fetch(`/api/workflows/${workflowId}/execute`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    testData: {
      email_id: 123,
      contact_id: 456,
      email_data: {
        subject: "Test Subject",
        from_email: "test@example.com"
      }
    }
  })
});

const { execution } = await response.json();
console.log('Test execution:', execution);
```

## Workflow Engine Integration

### Integrating Triggers into Email Endpoints

To activate workflows, you need to call the WorkflowEngine from your email endpoints:

#### Email Sent

```typescript
// In src/app/api/integrations/email/send/route.ts
import WorkflowEngine from '@/lib/workflow-engine';

// After successful email send
const engine = new WorkflowEngine();
await engine.processEmailSent(emailId);
```

#### Email Opened

```typescript
// In src/app/api/tracking/pixel/[id]/route.ts
import WorkflowEngine from '@/lib/workflow-engine';

// After logging pixel view
const engine = new WorkflowEngine();
await engine.processEmailOpened(emailId);
```

#### Email Clicked

```typescript
// In src/app/api/tracking/click/[id]/route.ts
import WorkflowEngine from '@/lib/workflow-engine';

// After logging click
const engine = new WorkflowEngine();
await engine.processEmailClicked(emailId, linkUrl);
```

#### Email Received

```typescript
// In email sync service
import WorkflowEngine from '@/lib/workflow-engine';

// After fetching new email
const engine = new WorkflowEngine();
await engine.processEmailReceived(emailId);
```

## Background Jobs

### Processing Scheduled Follow-Ups

Create a cron job to process pending follow-ups:

```typescript
// In src/app/api/cron/process-followups/route.ts
import { NextResponse } from 'next/server';
import WorkflowEngine from '@/lib/workflow-engine';

export async function GET() {
  try {
    const engine = new WorkflowEngine();
    await engine.processPendingFollowUps();
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing follow-ups:', error);
    return NextResponse.json({ error: 'Failed to process follow-ups' }, { status: 500 });
  }
}
```

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-followups",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes to check for due follow-ups.

## Monitoring & Debugging

### Execution Logs

Query workflow executions:

```sql
SELECT 
  e.id,
  e.workflow_id,
  w.name as workflow_name,
  e.trigger_type,
  e.status,
  e.actions_executed,
  e.actions_total,
  e.started_at,
  e.completed_at,
  e.error_message
FROM workflow_executions e
JOIN email_workflows w ON w.id = e.workflow_id
WHERE e.workflow_id = $1
ORDER BY e.started_at DESC
LIMIT 50;
```

### Action Logs

View detailed action execution:

```sql
SELECT 
  l.id,
  l.execution_id,
  l.action_type,
  l.status,
  l.result,
  l.error_message
FROM workflow_action_logs l
WHERE l.execution_id = $1
ORDER BY l.id ASC;
```

### Workflow Performance

```sql
SELECT 
  w.name,
  COUNT(e.id) as total_executions,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed,
  AVG(EXTRACT(EPOCH FROM (e.completed_at - e.started_at))) as avg_duration_seconds
FROM email_workflows w
LEFT JOIN workflow_executions e ON e.workflow_id = w.id
GROUP BY w.id, w.name
ORDER BY total_executions DESC;
```

## Best Practices

### 1. Start Simple
- Begin with one trigger and one action
- Test thoroughly before adding complexity
- Add conditions gradually

### 2. Use Execution Order
- Order actions logically
- Update data before sending notifications
- Send emails last

### 3. Monitor Performance
- Check execution logs regularly
- Review failed executions
- Optimize slow workflows

### 4. Prevent Infinite Loops
- Don't create workflows that trigger themselves
- Use conditions to limit execution frequency
- Set reasonable delay times

### 5. Test Before Activating
- Use the execute endpoint to test
- Verify with test data
- Check all actions execute correctly

### 6. Document Workflows
- Use descriptive names
- Add detailed descriptions
- Note the business logic

## Limitations & Future Enhancements

### Current Limitations
- Email templates not yet implemented (planned)
- Webhook actions not yet functional (planned)
- No workflow versioning
- No A/B testing support

### Planned Features
- Visual workflow builder UI
- Workflow templates library
- Advanced condition logic (AND/OR groups)
- Workflow analytics dashboard
- Email template editor with variables
- Webhook integration
- Workflow scheduling (run at specific times)
- Multi-step sequences
- Lead scoring system
- Integration with external CRMs

## Troubleshooting

### Workflow Not Executing

1. **Check if workflow is active**
   ```sql
   SELECT is_active FROM email_workflows WHERE id = $1;
   ```

2. **Verify trigger integration**
   - Ensure WorkflowEngine is called from email endpoints
   - Check for errors in console logs

3. **Review conditions**
   - Test conditions independently
   - Verify contact data matches condition values

### Action Failures

1. **Check action logs**
   ```sql
   SELECT * FROM workflow_action_logs WHERE status = 'failed' ORDER BY id DESC LIMIT 10;
   ```

2. **Common issues**
   - Missing template_id for send_email action
   - Invalid contact_id in trigger data
   - Missing required config fields

### Performance Issues

1. **Too many workflows**
   - Limit active workflows
   - Combine similar workflows
   - Use more specific conditions

2. **Slow action execution**
   - Check database indexes
   - Optimize email sending
   - Use background jobs for heavy operations

## Security Considerations

- ✅ User-scoped workflows (user_id required)
- ✅ JWT authentication on all endpoints
- ✅ Execution logging for audit trail
- ⚠️ Validate action configurations before execution
- ⚠️ Rate limiting on workflow triggers (TODO)
- ⚠️ Sanitize email template variables (TODO)
- ⚠️ Webhook URL validation (TODO)

## Support

For questions or issues with workflow automation:
- Check execution logs first
- Review workflow configuration
- Test with manual execution endpoint
- Contact support with workflow_id and execution_id

---

**Last Updated**: January 2025  
**Version**: 1.0.0
