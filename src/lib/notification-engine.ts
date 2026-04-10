/**
 * Smart Notification Engine
 * Handles notification rules, triggers, scheduling, and delivery
 * 
 * Features:
 * - Multiple trigger types (task-related, client-related, schedule-based)
 * - Flexible scheduling (immediate, digest, scheduled)
 * - Multi-channel delivery (in-app, email, SMS)
 * - User notification preferences
 * - Template system with variable substitution
 */

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE = 'task_due',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMPLETED = 'task_completed',
  TASK_BLOCKED = 'task_blocked',
  CLIENT_INACTIVE = 'client_inactive',
  CLIENT_MILESTONE = 'client_milestone',
  MENTION = 'mention',
  COMMENT = 'comment',
  CUSTOM = 'custom',
}

export enum NotificationTrigger {
  IMMEDIATE = 'immediate',
  DUE_DATE = 'due_date', // Task due tomorrow
  OVERDUE = 'overdue', // Task is overdue
  ASSIGNED = 'assigned', // Task assigned to user
  COMPLETED = 'completed', // Task completed
  BLOCKED = 'blocked', // Task is blocked
  INACTIVE_CLIENT = 'inactive_client', // No activity > 30 days
  MILESTONE = 'milestone', // Client reached milestone
  MENTION = 'mention', // User mentioned
  SCHEDULE = 'schedule', // Custom schedule
}

export enum ScheduleType {
  IMMEDIATE = 'immediate',
  DAILY_DIGEST = 'daily_digest',
  WEEKLY_DIGEST = 'weekly_digest',
  MONTHLY_DIGEST = 'monthly_digest',
  SCHEDULED = 'scheduled', // Specific time
}

export enum DeliveryMethod {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DISMISSED = 'dismissed',
  FAILED = 'failed',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface NotificationRule {
  id: number;
  userId: string;
  name: string;
  description?: string;
  trigger: NotificationTrigger;
  triggerConfig: Record<string, any>; // Flexible config based on trigger type
  scheduleType: ScheduleType;
  scheduleTime?: string; // HH:mm format for scheduled notifications
  deliveryMethods: DeliveryMethod[];
  priority: NotificationPriority;
  templateId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: number;
  userId: string;
  name: string;
  description?: string;
  trigger: NotificationTrigger;
  subject?: string; // For email
  messageTemplate: string; // Can include {{variable}} placeholders
  variables: string[]; // List of available variables
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number;
  userId: string;
  ruleId: number;
  triggerType: NotificationTrigger;
  notificationType: NotificationType;
  subject?: string;
  message: string;
  relatedEntityType?: string; // 'task', 'client', 'comment'
  relatedEntityId?: number;
  priority: NotificationPriority;
  deliveryMethods: DeliveryMethod[];
  status: NotificationStatus;
  readAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>; // Additional context (task details, client info, etc.)
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotificationPreferences {
  userId: string;
  enableNotifications: boolean;
  preferredDeliveryMethods: DeliveryMethod[];
  muteDuration?: number; // Minutes for mute
  muteUntil?: Date;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  digestFrequency: ScheduleType;
  unsubscribedTriggers: NotificationTrigger[]; // Opt-out from specific trigger types
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  smsFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  dismissedCount: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  sentSuccessfully: number;
  failedToSend: number;
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

export const DEFAULT_TEMPLATES: Omit<NotificationTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Task Assigned',
    trigger: NotificationTrigger.ASSIGNED,
    subject: 'Task Assigned: {{taskName}}',
    messageTemplate: 'You have been assigned a new task: {{taskName}} (Due: {{dueDate}})',
    variables: ['taskName', 'dueDate', 'clientName', 'priority'],
    isPublic: true,
  },
  {
    name: 'Task Due Tomorrow',
    trigger: NotificationTrigger.DUE_DATE,
    subject: '⏰ Task Due Tomorrow: {{taskName}}',
    messageTemplate: 'Reminder: {{taskName}} is due tomorrow. Client: {{clientName}}',
    variables: ['taskName', 'dueDate', 'clientName', 'priority'],
    isPublic: true,
  },
  {
    name: 'Task Overdue',
    trigger: NotificationTrigger.OVERDUE,
    subject: '🚨 Overdue Task: {{taskName}}',
    messageTemplate: '⚠️ {{taskName}} is {{daysOverdue}} days overdue. Client: {{clientName}}',
    variables: ['taskName', 'daysOverdue', 'clientName', 'priority'],
    isPublic: true,
  },
  {
    name: 'Task Completed',
    trigger: NotificationTrigger.COMPLETED,
    subject: '✅ Task Completed: {{taskName}}',
    messageTemplate: '{{completedBy}} completed {{taskName}} for {{clientName}}',
    variables: ['taskName', 'completedBy', 'clientName', 'completionTime'],
    isPublic: true,
  },
  {
    name: 'Blocked Task',
    trigger: NotificationTrigger.BLOCKED,
    subject: '🚫 Task Blocked: {{taskName}}',
    messageTemplate: '{{taskName}} is blocked by: {{blockingTasks}}. Client: {{clientName}}',
    variables: ['taskName', 'blockingTasks', 'clientName'],
    isPublic: true,
  },
  {
    name: 'Inactive Client Alert',
    trigger: NotificationTrigger.INACTIVE_CLIENT,
    subject: '⚠️ Inactive Client: {{clientName}}',
    messageTemplate: '{{clientName}} has been inactive for {{daysInactive}} days. Last activity: {{lastActivity}}',
    variables: ['clientName', 'daysInactive', 'lastActivity', 'accountManager'],
    isPublic: true,
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate if notification should be sent based on user preferences and quiet hours
 */
export function shouldSendNotification(
  preferences: UserNotificationPreferences,
  deliveryMethod: DeliveryMethod,
  priority: NotificationPriority
): boolean {
  // Check if notifications are enabled
  if (!preferences.enableNotifications) {
    return false;
  }

  // Check if muted
  if (preferences.muteUntil && new Date() < preferences.muteUntil) {
    return false;
  }

  // Check if trigger is unsubscribed
  // (handled in calling code, pass trigger separately if needed)

  // Check delivery method preference
  if (!preferences.preferredDeliveryMethods.includes(deliveryMethod)) {
    return false;
  }

  // Check quiet hours (except for urgent notifications)
  if (preferences.quietHoursEnabled && priority !== NotificationPriority.URGENT) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (preferences.quietHoursStart && preferences.quietHoursEnd) {
      if (currentTime >= preferences.quietHoursStart && currentTime < preferences.quietHoursEnd) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Determine if a notification should be batched into a digest
 */
export function shouldBatchIntoDigest(
  scheduleType: ScheduleType,
  preferences: UserNotificationPreferences
): boolean {
  return scheduleType === ScheduleType.DAILY_DIGEST ||
    scheduleType === ScheduleType.WEEKLY_DIGEST ||
    scheduleType === ScheduleType.MONTHLY_DIGEST;
}

/**
 * Substitute variables in template with actual values
 */
export function substituteTemplateVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  return result;
}

/**
 * Calculate next digest send time based on frequency
 */
export function getNextDigestTime(frequency: ScheduleType, baseTime?: string): Date {
  const nextTime = new Date();
  const [hours, minutes] = (baseTime || '09:00').split(':').map(Number);

  // Set to specified time
  nextTime.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case ScheduleType.DAILY_DIGEST:
      // Next day at specified time
      if (nextTime <= new Date()) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
      break;

    case ScheduleType.WEEKLY_DIGEST:
      // Next Monday at specified time
      const daysUntilMonday = (1 - nextTime.getDay() + 7) % 7 || 7;
      if (daysUntilMonday === 0 && nextTime <= new Date()) {
        nextTime.setDate(nextTime.getDate() + 7);
      } else {
        nextTime.setDate(nextTime.getDate() + daysUntilMonday);
      }
      break;

    case ScheduleType.MONTHLY_DIGEST:
      // First day of next month at specified time
      nextTime.setMonth(nextTime.getMonth() + 1);
      nextTime.setDate(1);
      if (nextTime <= new Date()) {
        nextTime.setMonth(nextTime.getMonth() + 1);
      }
      break;
  }

  return nextTime;
}

/**
 * Determine notification priority based on trigger type and conditions
 */
export function calculateNotificationPriority(
  trigger: NotificationTrigger,
  daysOverdue?: number,
  priority?: string
): NotificationPriority {
  // Overdue tasks are high/urgent
  if (trigger === NotificationTrigger.OVERDUE) {
    return daysOverdue && daysOverdue > 7 ? NotificationPriority.URGENT : NotificationPriority.HIGH;
  }

  // Task priority influences notification priority
  if (priority === 'high') {
    return NotificationPriority.HIGH;
  }
  if (priority === 'critical') {
    return NotificationPriority.URGENT;
  }

  // Blocked tasks and inactive clients are high priority
  if (trigger === NotificationTrigger.BLOCKED || trigger === NotificationTrigger.INACTIVE_CLIENT) {
    return NotificationPriority.HIGH;
  }

  // Default to normal
  return NotificationPriority.NORMAL;
}

/**
 * Create default notification rules for a new user
 */
export function createDefaultRulesForUser(userId: string): Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>[] {
  return [
    {
      userId,
      name: 'Task Assigned to Me',
      trigger: NotificationTrigger.ASSIGNED,
      triggerConfig: {},
      scheduleType: ScheduleType.IMMEDIATE,
      deliveryMethods: [DeliveryMethod.IN_APP, DeliveryMethod.EMAIL],
      priority: NotificationPriority.NORMAL,
      templateId: 1, // Will be set after template creation
      isActive: true,
    },
    {
      userId,
      name: 'Tasks Due Tomorrow',
      trigger: NotificationTrigger.DUE_DATE,
      triggerConfig: { daysBeforeDue: 1 },
      scheduleType: ScheduleType.DAILY_DIGEST,
      scheduleTime: '09:00',
      deliveryMethods: [DeliveryMethod.IN_APP, DeliveryMethod.EMAIL],
      priority: NotificationPriority.NORMAL,
      templateId: 2,
      isActive: true,
    },
    {
      userId,
      name: 'Overdue Tasks Alert',
      trigger: NotificationTrigger.OVERDUE,
      triggerConfig: {},
      scheduleType: ScheduleType.IMMEDIATE,
      deliveryMethods: [DeliveryMethod.IN_APP, DeliveryMethod.EMAIL],
      priority: NotificationPriority.HIGH,
      templateId: 3,
      isActive: true,
    },
    {
      userId,
      name: 'Inactive Clients Check',
      trigger: NotificationTrigger.INACTIVE_CLIENT,
      triggerConfig: { daysInactive: 30 },
      scheduleType: ScheduleType.WEEKLY_DIGEST,
      scheduleTime: '10:00',
      deliveryMethods: [DeliveryMethod.IN_APP, DeliveryMethod.EMAIL],
      priority: NotificationPriority.NORMAL,
      templateId: 6,
      isActive: true,
    },
  ];
}

/**
 * Filter notifications based on status
 */
export function filterNotificationsByStatus(
  notifications: Notification[],
  status: NotificationStatus
): Notification[] {
  return notifications.filter(n => n.status === status);
}

/**
 * Get notification statistics
 */
export function calculateNotificationStats(notifications: Notification[]): NotificationStats {
  const stats: NotificationStats = {
    totalNotifications: notifications.length,
    unreadCount: 0,
    readCount: 0,
    dismissedCount: 0,
    byType: {} as Record<NotificationType, number>,
    byPriority: {} as Record<NotificationPriority, number>,
    sentSuccessfully: 0,
    failedToSend: 0,
  };

  notifications.forEach(notification => {
    // Count by status
    if (notification.status === NotificationStatus.READ) {
      stats.readCount++;
    } else if (notification.status === NotificationStatus.PENDING) {
      stats.unreadCount++;
    } else if (notification.status === NotificationStatus.DISMISSED) {
      stats.dismissedCount++;
    } else if (notification.status === NotificationStatus.SENT) {
      stats.sentSuccessfully++;
    } else if (notification.status === NotificationStatus.FAILED) {
      stats.failedToSend++;
    }

    // Count by type
    stats.byType[notification.notificationType] = (stats.byType[notification.notificationType] || 0) + 1;

    // Count by priority
    stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
  });

  return stats;
}

/**
 * Validate notification rule trigger configuration
 */
export function validateRuleConfig(trigger: NotificationTrigger, config: Record<string, any>): boolean {
  switch (trigger) {
    case NotificationTrigger.DUE_DATE:
      return typeof config.daysBeforeDue === 'number' && config.daysBeforeDue >= 0;
    case NotificationTrigger.INACTIVE_CLIENT:
      return typeof config.daysInactive === 'number' && config.daysInactive > 0;
    case NotificationTrigger.SCHEDULE:
      return typeof config.time === 'string' && /^\d{2}:\d{2}$/.test(config.time);
    default:
      return true; // Other triggers don't require config
  }
}

/**
 * Format notification for display
 */
export function formatNotificationForDisplay(notification: Notification): {
  title: string;
  message: string;
  icon: string;
  color: string;
} {
  const priorityColor = {
    [NotificationPriority.LOW]: 'text-gray-500',
    [NotificationPriority.NORMAL]: 'text-blue-500',
    [NotificationPriority.HIGH]: 'text-orange-500',
    [NotificationPriority.URGENT]: 'text-red-500',
  };

  const priorityIcon = {
    [NotificationPriority.LOW]: '•',
    [NotificationPriority.NORMAL]: '•',
    [NotificationPriority.HIGH]: '⚠️',
    [NotificationPriority.URGENT]: '🚨',
  };

  const typeEmoji = {
    [NotificationType.TASK_ASSIGNED]: '📋',
    [NotificationType.TASK_DUE]: '⏰',
    [NotificationType.TASK_OVERDUE]: '⏰',
    [NotificationType.TASK_COMPLETED]: '✅',
    [NotificationType.TASK_BLOCKED]: '🚫',
    [NotificationType.CLIENT_INACTIVE]: '⚠️',
    [NotificationType.CLIENT_MILESTONE]: '🎉',
    [NotificationType.MENTION]: '@',
    [NotificationType.COMMENT]: '💬',
    [NotificationType.CUSTOM]: 'ℹ️',
  };

  return {
    title: `${typeEmoji[notification.notificationType]} ${notification.subject || 'Notification'}`,
    message: notification.message,
    icon: priorityIcon[notification.priority],
    color: priorityColor[notification.priority],
  };
}

/**
 * Get icon for notification type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    [NotificationType.TASK_ASSIGNED]: 'assignment',
    [NotificationType.TASK_DUE]: 'schedule',
    [NotificationType.TASK_OVERDUE]: 'schedule',
    [NotificationType.TASK_COMPLETED]: 'check_circle',
    [NotificationType.TASK_BLOCKED]: 'block',
    [NotificationType.CLIENT_INACTIVE]: 'warning',
    [NotificationType.CLIENT_MILESTONE]: 'celebration',
    [NotificationType.MENTION]: 'mention',
    [NotificationType.COMMENT]: 'comment',
    [NotificationType.CUSTOM]: 'info',
  };
  return icons[type];
}

/**
 * Snooze a notification
 */
export function snoozeNotification(notification: Notification, minutes: number): Notification {
  return {
    ...notification,
    createdAt: new Date(Date.now() + minutes * 60 * 1000),
  };
}
