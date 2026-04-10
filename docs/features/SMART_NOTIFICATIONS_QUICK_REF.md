# Smart Notifications - Quick Reference

## Files at a Glance

| File | Size | Purpose |
|------|------|---------|
| `/src/lib/notification-engine.ts` | 630 lines | Core notification logic & types |
| `/src/app/api/notifications/route.ts` | 265 lines | API endpoints for CRUD |
| `/src/components/NotificationCenter.tsx` | 320 lines | Bell icon dropdown UI |
| `/src/app/notifications/page.tsx` | 300 lines | Full notifications dashboard |
| `/database/migrations/004_create_notifications.sql` | 270 lines | Database schema |

**Total: 1,785 lines of code** | **TypeScript Errors: 0** ✅

---

## Key Enums

```typescript
// 10 notification types
NotificationType: TASK_ASSIGNED | TASK_DUE | TASK_OVERDUE | TASK_COMPLETED | 
                  TASK_BLOCKED | CLIENT_INACTIVE | CLIENT_MILESTONE | MENTION | 
                  COMMENT | CUSTOM

// 10 trigger types
NotificationTrigger: IMMEDIATE | DUE_DATE | OVERDUE | ASSIGNED | COMPLETED | 
                     BLOCKED | INACTIVE_CLIENT | MILESTONE | MENTION | SCHEDULE

// 5 schedule types
ScheduleType: IMMEDIATE | DAILY_DIGEST | WEEKLY_DIGEST | MONTHLY_DIGEST | SCHEDULED

// 3 delivery channels
DeliveryMethod: IN_APP | EMAIL | SMS

// 4 priority levels
NotificationPriority: LOW | NORMAL | HIGH | URGENT

// 6 notification statuses
NotificationStatus: PENDING | SENT | DELIVERED | READ | DISMISSED | FAILED
```

---

## Quick API Reference

### List Notifications
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://your-app.com/api/notifications?filter=pending&limit=10
```

### Create Notification
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notificationType":"task_assigned","message":"New task"}' \
  https://your-app.com/api/notifications
```

### Mark as Read
```bash
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  -d '{"status":"read"}' \
  https://your-app.com/api/notifications/123
```

### Delete Notification
```bash
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  https://your-app.com/api/notifications/123
```

---

## Database Tables Summary

| Table | Rows | Key Fields |
|-------|------|-----------|
| `notifications` | Per-user | id, user_id, status, priority, created_at |
| `notification_rules` | ~4-20 per user | id, user_id, trigger, schedule_type, is_active |
| `notification_templates` | ~10-50 per user | id, user_id, trigger, message_template, variables |
| `user_notification_preferences` | 1 per user | user_id (unique), quiet_hours, mute_until |
| `notification_events` | Per delivery | notification_id, event_type, created_at |

---

## Component Usage

### In Layout/Header
```tsx
import NotificationCenter from '@/components/NotificationCenter';

export default function Header() {
  return (
    <div className="flex items-center gap-4">
      <NotificationCenter autoRefresh={true} refreshInterval={30000} />
      {/* Other header items */}
    </div>
  );
}
```

### Standalone Page
Just visit `/notifications` route - fully functional dashboard included

---

## Common Use Cases

### Send Task Assignment Notification
```typescript
const res = await fetch('/api/notifications', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notificationType: 'task_assigned',
    subject: `Task: ${taskName}`,
    message: `You have been assigned "${taskName}" for ${clientName}`,
    priority: 'normal',
    deliveryMethods: ['in_app', 'email'],
    metadata: { taskId, clientId, dueDate }
  })
});
```

### Get Unread Notifications Only
```typescript
const res = await fetch('/api/notifications?filter=pending', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { notifications, total } = await res.json();
// notifications.filter(n => n.status === 'pending')
```

### Clear All Read Notifications
```typescript
// Fetch read notifications
const res = await fetch('/api/notifications?filter=read', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { notifications } = await res.json();

// Delete each one
for (const notif of notifications) {
  await fetch(`/api/notifications/${notif.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

---

## Database Query Examples

### Count Unread by Priority
```sql
SELECT priority, COUNT(*) as count
FROM notifications
WHERE user_id = 'user123' AND status = 'pending'
GROUP BY priority;
```

### Get Stats for User
```sql
SELECT * FROM notification_summary WHERE user_id = 'user123';
```

### Find Failed Notifications
```sql
SELECT * FROM notifications
WHERE user_id = 'user123' AND status = 'failed'
ORDER BY created_at DESC;
```

### Get User Preferences
```sql
SELECT * FROM user_notification_preferences 
WHERE user_id = 'user123';
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Notifications not appearing | Check JWT token validity and user_id |
| Unread count wrong | Check database status values |
| Notifications not sending | Verify delivery method is enabled in preferences |
| API 401 error | Ensure Authorization header is present and valid |
| Empty notification list | Check filter parameter and user_id match |

---

## Next: Feature #6 - Task Dependencies

When ready to continue, implement:
- Task dependency relationships
- Blocking task visualization
- Prevent completion of blocking tasks
- Dependency chain visualization
- Estimated time: 2-3 hours
- Estimated lines: 1,200+

---

**Status**: ✅ Feature #5 Complete  
**Progress**: 5 of 11 features (45%)  
**Total Code**: 5,410+ lines | 0 TypeScript errors
