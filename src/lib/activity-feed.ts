/**
 * Activity Feed Engine
 * Manages client activity tracking, filtering, and timeline generation
 * 
 * Features:
 * - Multiple activity types (task, credential, note, call, email, meeting, file, contact)
 * - Activity filtering and search
 * - Timeline generation
 * - Activity summaries and statistics
 * - Activity grouping and formatting
 */

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum ActivityType {
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  TASK_DELETED = 'task_deleted',
  CREDENTIAL_CREATED = 'credential_created',
  CREDENTIAL_UPDATED = 'credential_updated',
  CREDENTIAL_DELETED = 'credential_deleted',
  CREDENTIAL_ACCESSED = 'credential_accessed',
  NOTE_ADDED = 'note_added',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  CALL_LOGGED = 'call_logged',
  EMAIL_SENT = 'email_sent',
  MEETING_SCHEDULED = 'meeting_scheduled',
  FILE_UPLOADED = 'file_uploaded',
  CLIENT_CONTACTED = 'client_contacted',
  CLIENT_UPDATED = 'client_updated',
  STATUS_CHANGED = 'status_changed',
  COMMENT_ADDED = 'comment_added',
}

export enum ActivityCategory {
  TASK = 'task',
  CREDENTIAL = 'credential',
  NOTE = 'note',
  COMMUNICATION = 'communication', // calls, emails, meetings
  FILE = 'file',
  CLIENT = 'client',
  COMMENT = 'comment',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ActivityItem {
  id: number;
  clientId: number;
  userId: string;
  userEmail: string;
  activityType: ActivityType;
  category: ActivityCategory;
  title: string;
  description?: string;
  relatedEntityType?: string; // 'task', 'credential', 'note', etc.
  relatedEntityId?: number;
  metadata?: Record<string, any>; // task name, credential type, etc.
  timestamp: Date;
  createdAt: Date;
}

export interface ActivityFilter {
  type?: ActivityType;
  category?: ActivityCategory;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActivitySummary {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByCategory: Record<ActivityCategory, number>;
  activitiesByUser: Record<string, number>;
  lastActivityAt?: Date;
  mostActiveUser?: string;
}

export interface TimelineEvent {
  date: string; // YYYY-MM-DD format
  activities: ActivityItem[];
  count: number;
}

export interface ActivityGrouped {
  date: string;
  dayName: string;
  activities: ActivityItem[];
}

// ============================================================================
// ACTIVITY DEFINITIONS
// ============================================================================

export const ACTIVITY_DEFINITIONS = {
  [ActivityType.TASK_CREATED]: {
    category: ActivityCategory.TASK,
    icon: '✏️',
    title: 'Task Created',
    color: 'blue',
  },
  [ActivityType.TASK_UPDATED]: {
    category: ActivityCategory.TASK,
    icon: '✏️',
    title: 'Task Updated',
    color: 'blue',
  },
  [ActivityType.TASK_COMPLETED]: {
    category: ActivityCategory.TASK,
    icon: '✅',
    title: 'Task Completed',
    color: 'green',
  },
  [ActivityType.TASK_DELETED]: {
    category: ActivityCategory.TASK,
    icon: '🗑️',
    title: 'Task Deleted',
    color: 'red',
  },
  [ActivityType.CREDENTIAL_CREATED]: {
    category: ActivityCategory.CREDENTIAL,
    icon: '🔐',
    title: 'Credential Added',
    color: 'purple',
  },
  [ActivityType.CREDENTIAL_UPDATED]: {
    category: ActivityCategory.CREDENTIAL,
    icon: '🔐',
    title: 'Credential Updated',
    color: 'purple',
  },
  [ActivityType.CREDENTIAL_DELETED]: {
    category: ActivityCategory.CREDENTIAL,
    icon: '🗑️',
    title: 'Credential Deleted',
    color: 'red',
  },
  [ActivityType.CREDENTIAL_ACCESSED]: {
    category: ActivityCategory.CREDENTIAL,
    icon: '👁️',
    title: 'Credential Accessed',
    color: 'yellow',
  },
  [ActivityType.NOTE_ADDED]: {
    category: ActivityCategory.NOTE,
    icon: '📝',
    title: 'Note Added',
    color: 'orange',
  },
  [ActivityType.NOTE_UPDATED]: {
    category: ActivityCategory.NOTE,
    icon: '📝',
    title: 'Note Updated',
    color: 'orange',
  },
  [ActivityType.NOTE_DELETED]: {
    category: ActivityCategory.NOTE,
    icon: '🗑️',
    title: 'Note Deleted',
    color: 'red',
  },
  [ActivityType.CALL_LOGGED]: {
    category: ActivityCategory.COMMUNICATION,
    icon: '📞',
    title: 'Call Logged',
    color: 'green',
  },
  [ActivityType.EMAIL_SENT]: {
    category: ActivityCategory.COMMUNICATION,
    icon: '📧',
    title: 'Email Sent',
    color: 'blue',
  },
  [ActivityType.MEETING_SCHEDULED]: {
    category: ActivityCategory.COMMUNICATION,
    icon: '📅',
    title: 'Meeting Scheduled',
    color: 'cyan',
  },
  [ActivityType.FILE_UPLOADED]: {
    category: ActivityCategory.FILE,
    icon: '📎',
    title: 'File Uploaded',
    color: 'gray',
  },
  [ActivityType.CLIENT_CONTACTED]: {
    category: ActivityCategory.COMMUNICATION,
    icon: '💬',
    title: 'Client Contacted',
    color: 'green',
  },
  [ActivityType.CLIENT_UPDATED]: {
    category: ActivityCategory.CLIENT,
    icon: '👤',
    title: 'Client Updated',
    color: 'blue',
  },
  [ActivityType.STATUS_CHANGED]: {
    category: ActivityCategory.CLIENT,
    icon: '🔄',
    title: 'Status Changed',
    color: 'purple',
  },
  [ActivityType.COMMENT_ADDED]: {
    category: ActivityCategory.COMMENT,
    icon: '💬',
    title: 'Comment Added',
    color: 'blue',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get activity definition by type
 */
export function getActivityDefinition(type: ActivityType) {
  return ACTIVITY_DEFINITIONS[type] || {
    category: ActivityCategory.TASK,
    icon: '•',
    title: type,
    color: 'gray',
  };
}

/**
 * Get emoji icon for activity type
 */
export function getActivityIcon(type: ActivityType): string {
  const def = getActivityDefinition(type);
  return def.icon;
}

/**
 * Get color for activity type (for UI)
 */
export function getActivityColor(type: ActivityType): string {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700',
  };
  const def = getActivityDefinition(type);
  return colors[def.color] || colors.gray;
}

/**
 * Group activities by date
 */
export function groupActivitiesByDate(activities: ActivityItem[]): ActivityGrouped[] {
  const grouped: Record<string, ActivityItem[]> = {};

  activities.forEach(activity => {
    const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(activity);
  });

  return Object.entries(grouped).map(([date, items]) => {
    const dateObj = new Date(date);
    return {
      date,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      activities: items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    };
  });
}

/**
 * Format activity for display
 */
export function formatActivityForDisplay(activity: ActivityItem): {
  icon: string;
  title: string;
  description: string;
  color: string;
  relativeTime: string;
} {
  const def = getActivityDefinition(activity.activityType);
  const relativeTime = getRelativeTime(new Date(activity.timestamp));

  let description = activity.description || '';
  if (activity.metadata?.taskName) {
    description += ` - "${activity.metadata.taskName}"`;
  }
  if (activity.metadata?.credentialType) {
    description += ` (${activity.metadata.credentialType})`;
  }

  return {
    icon: def.icon,
    title: def.title,
    description,
    color: getActivityColor(activity.activityType),
    relativeTime,
  };
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Calculate activity summary statistics
 */
export function calculateActivitySummary(activities: ActivityItem[]): ActivitySummary {
  const summary: ActivitySummary = {
    totalActivities: activities.length,
    activitiesByType: {} as Record<ActivityType, number>,
    activitiesByCategory: {} as Record<ActivityCategory, number>,
    activitiesByUser: {},
  };

  activities.forEach(activity => {
    // Count by type
    summary.activitiesByType[activity.activityType] =
      (summary.activitiesByType[activity.activityType] || 0) + 1;

    // Count by category
    summary.activitiesByCategory[activity.category] =
      (summary.activitiesByCategory[activity.category] || 0) + 1;

    // Count by user
    summary.activitiesByUser[activity.userEmail] =
      (summary.activitiesByUser[activity.userEmail] || 0) + 1;

    // Track last activity
    if (!summary.lastActivityAt || new Date(activity.timestamp) > summary.lastActivityAt) {
      summary.lastActivityAt = new Date(activity.timestamp);
    }
  });

  // Find most active user
  const userCounts = Object.entries(summary.activitiesByUser);
  if (userCounts.length > 0) {
    const [mostActive] = userCounts.sort(([, a], [, b]) => b - a)[0];
    summary.mostActiveUser = mostActive;
  }

  return summary;
}

/**
 * Filter activities based on criteria
 */
export function filterActivities(
  activities: ActivityItem[],
  filters: ActivityFilter
): ActivityItem[] {
  return activities.filter(activity => {
    // Filter by type
    if (filters.type && activity.activityType !== filters.type) {
      return false;
    }

    // Filter by category
    if (filters.category && activity.category !== filters.category) {
      return false;
    }

    // Filter by date range
    const activityDate = new Date(activity.timestamp);
    if (filters.startDate && activityDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && activityDate > filters.endDate) {
      return false;
    }

    // Filter by user
    if (filters.userId && activity.userId !== filters.userId) {
      return false;
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${activity.title} ${activity.description || ''} ${activity.userEmail || ''}`.toLowerCase();
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get activity count by category
 */
export function getActivityCountByCategory(activities: ActivityItem[]): Record<ActivityCategory, number> {
  const counts: Record<string, number> = {};

  activities.forEach(activity => {
    counts[activity.category] = (counts[activity.category] || 0) + 1;
  });

  return counts as Record<ActivityCategory, number>;
}

/**
 * Get activity timeline (activities grouped by date with counts)
 */
export function getActivityTimeline(activities: ActivityItem[]): TimelineEvent[] {
  const grouped = groupActivitiesByDate(activities);
  return grouped.map(group => ({
    date: group.date,
    activities: group.activities,
    count: group.activities.length,
  }));
}

/**
 * Convert audit_log record to ActivityItem
 */
export function auditLogToActivityItem(auditLog: any): ActivityItem {
  // Map audit log action to activity type
  const activityTypeMap: Record<string, ActivityType> = {
    'CREATE:task': ActivityType.TASK_CREATED,
    'UPDATE:task': ActivityType.TASK_UPDATED,
    'DELETE:task': ActivityType.TASK_DELETED,
    'CREATE:credential': ActivityType.CREDENTIAL_CREATED,
    'UPDATE:credential': ActivityType.CREDENTIAL_UPDATED,
    'DELETE:credential': ActivityType.CREDENTIAL_DELETED,
    'CREATE:note': ActivityType.NOTE_ADDED,
    'UPDATE:note': ActivityType.NOTE_UPDATED,
    'DELETE:note': ActivityType.NOTE_DELETED,
  };

  const key = `${auditLog.action}:${auditLog.table_name}`;
  const activityType = activityTypeMap[key] || ActivityType.TASK_UPDATED;
  const category = getCategoryFromActivityType(activityType);

  return {
    id: auditLog.id,
    clientId: auditLog.record_id || 0, // Will be overridden by API
    userId: auditLog.user_id || 'unknown',
    userEmail: auditLog.user_email || 'unknown@example.com',
    activityType,
    category,
    title: getActivityDefinition(activityType).title,
    description: generateActivityDescription(auditLog),
    relatedEntityType: auditLog.table_name,
    relatedEntityId: auditLog.record_id,
    metadata: auditLog.new_values || {},
    timestamp: new Date(auditLog.timestamp),
    createdAt: new Date(auditLog.timestamp),
  };
}

/**
 * Get category from activity type
 */
function getCategoryFromActivityType(type: ActivityType): ActivityCategory {
  const def = getActivityDefinition(type);
  return def.category;
}

/**
 * Generate activity description from audit log
 */
function generateActivityDescription(auditLog: any): string {
  if (auditLog.action === 'CREATE') {
    return `Created new ${auditLog.table_name.slice(0, -1)}`;
  }
  if (auditLog.action === 'UPDATE') {
    const changedFields = auditLog.changed_fields ? JSON.parse(auditLog.changed_fields) : [];
    if (Array.isArray(changedFields) && changedFields.length > 0) {
      return `Updated ${changedFields.join(', ')}`;
    }
    return `Updated ${auditLog.table_name.slice(0, -1)}`;
  }
  if (auditLog.action === 'DELETE') {
    return `Deleted ${auditLog.table_name.slice(0, -1)}`;
  }
  return `Modified ${auditLog.table_name.slice(0, -1)}`;
}

/**
 * Get color badge for category
 */
export function getCategoryColor(category: ActivityCategory): string {
  const colors: Record<ActivityCategory, string> = {
    [ActivityCategory.TASK]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    [ActivityCategory.CREDENTIAL]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    [ActivityCategory.NOTE]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    [ActivityCategory.COMMUNICATION]: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    [ActivityCategory.FILE]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    [ActivityCategory.CLIENT]: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
    [ActivityCategory.COMMENT]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  };
  return colors[category];
}
