/**
 * Client Lifecycle Management
 * 
 * Manages client relationship stages and lifecycle transitions
 * Stages: Prospect → Lead → Active → Inactive → Archived
 */

export enum ClientLifecycleStage {
  PROSPECT = 'prospect',      // Initial contact, not yet a customer
  LEAD = 'lead',              // Interested prospect, qualified lead
  ACTIVE = 'active',          // Current paying customer
  INACTIVE = 'inactive',      // Was active, but no recent activity
  ARCHIVED = 'archived'       // Old/closed client
}

export interface LifecycleMetrics {
  stage: ClientLifecycleStage;
  daysInStage: number;
  lastActivityDate: string | null;
  transitionHistory: LifecycleTransition[];
  nextRecommendedAction?: string;
  riskLevel: 'low' | 'medium' | 'high';
  engagementScore: number; // 0-100
}

export interface LifecycleTransition {
  id: number;
  clientId: number;
  fromStage: ClientLifecycleStage;
  toStage: ClientLifecycleStage;
  reason?: string;
  timestamp: string;
  initiatedBy: string;
}

export interface StageConfig {
  stage: ClientLifecycleStage;
  displayName: string;
  color: string;
  icon: string;
  description: string;
  requiredActions: string[];
  riskFactors: string[];
}

// Configuration for each stage
export const LIFECYCLE_STAGE_CONFIG: Record<ClientLifecycleStage, StageConfig> = {
  [ClientLifecycleStage.PROSPECT]: {
    stage: ClientLifecycleStage.PROSPECT,
    displayName: 'Prospect',
    color: 'blue',
    icon: '🎯',
    description: 'Initial contact, exploring partnership',
    requiredActions: ['Send intro email', 'Schedule discovery call', 'Send proposal'],
    riskFactors: ['No response after 7 days', 'Competitor mentioned', 'Budget concerns']
  },
  [ClientLifecycleStage.LEAD]: {
    stage: ClientLifecycleStage.LEAD,
    displayName: 'Lead',
    color: 'purple',
    icon: '📞',
    description: 'Qualified lead, interested in services',
    requiredActions: ['Send detailed proposal', 'Schedule demo', 'Clarify requirements'],
    riskFactors: ['Delayed response', 'Scope creep discussions', 'Price negotiation']
  },
  [ClientLifecycleStage.ACTIVE]: {
    stage: ClientLifecycleStage.ACTIVE,
    displayName: 'Active',
    color: 'green',
    icon: '✅',
    description: 'Current paying customer with ongoing work',
    requiredActions: ['Regular check-ins', 'Monthly reports', 'Contract renewal discussion'],
    riskFactors: ['Payment delays', 'Support tickets increasing', 'Reduced communication']
  },
  [ClientLifecycleStage.INACTIVE]: {
    stage: ClientLifecycleStage.INACTIVE,
    displayName: 'Inactive',
    color: 'yellow',
    icon: '⏸️',
    description: 'Was active, but no recent activity/engagement',
    requiredActions: ['Re-engagement campaign', 'Check-in call', 'Offer special promotion'],
    riskFactors: ['No work in 60+ days', 'No communication in 30+ days', 'Unpaid invoices']
  },
  [ClientLifecycleStage.ARCHIVED]: {
    stage: ClientLifecycleStage.ARCHIVED,
    displayName: 'Archived',
    color: 'gray',
    icon: '📁',
    description: 'Closed or completed client relationship',
    requiredActions: ['Final documentation', 'Archive records', 'Maintain contact info'],
    riskFactors: []
  }
};

/**
 * Determine risk level based on metrics
 */
export function calculateRiskLevel(
  stage: ClientLifecycleStage,
  daysInStage: number,
  lastActivityDays: number,
  tasksOverdue: number
): 'low' | 'medium' | 'high' {
  if (stage === ClientLifecycleStage.ARCHIVED) return 'low';
  
  let riskScore = 0;

  // Stage progression risk
  if (stage === ClientLifecycleStage.PROSPECT && daysInStage > 30) riskScore += 25;
  if (stage === ClientLifecycleStage.LEAD && daysInStage > 60) riskScore += 30;
  if (stage === ClientLifecycleStage.ACTIVE && daysInStage > 730) riskScore += 10; // 2 years

  // Activity risk
  if (lastActivityDays > 30) riskScore += 20;
  if (lastActivityDays > 60) riskScore += 15;
  if (lastActivityDays > 90) riskScore += 25;

  // Task risk
  if (tasksOverdue > 0) riskScore += Math.min(tasksOverdue * 10, 30);

  return riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
}

/**
 * Calculate engagement score (0-100)
 */
export function calculateEngagementScore(
  taskCount: number,
  completedTasks: number,
  lastActivityDays: number,
  communicationCount: number
): number {
  let score = 100;

  // Task completion impact
  if (taskCount > 0) {
    const completionRate = (completedTasks / taskCount) * 100;
    score -= (100 - completionRate) * 0.3; // 30% weight
  }

  // Activity recency impact
  if (lastActivityDays > 30) score -= Math.min((lastActivityDays - 30) * 0.5, 40); // 40% max deduction
  
  // Communication impact
  if (communicationCount === 0) score -= 20;
  else if (communicationCount > 10) score = Math.min(score + 10, 100);

  return Math.max(0, Math.round(score));
}

/**
 * Recommend next stage based on current stage and metrics
 */
export function recommendNextStage(
  currentStage: ClientLifecycleStage,
  daysInStage: number,
  lastActivityDays: number,
  tasksCompleted: number,
  totalTasks: number
): ClientLifecycleStage | null {
  const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

  switch (currentStage) {
    case ClientLifecycleStage.PROSPECT:
      // Move to LEAD if proposal sent or discovery meeting scheduled
      if (daysInStage > 14 && completionRate > 50) {
        return ClientLifecycleStage.LEAD;
      }
      break;

    case ClientLifecycleStage.LEAD:
      // Move to ACTIVE if contract signed (indicated by completed tasks)
      if (daysInStage > 30 && completionRate > 80) {
        return ClientLifecycleStage.ACTIVE;
      }
      break;

    case ClientLifecycleStage.ACTIVE:
      // Move to INACTIVE if no activity for 60+ days
      if (lastActivityDays > 60) {
        return ClientLifecycleStage.INACTIVE;
      }
      break;

    case ClientLifecycleStage.INACTIVE:
      // Move back to ACTIVE if engagement resumes
      if (lastActivityDays < 7) {
        return ClientLifecycleStage.ACTIVE;
      }
      // Move to ARCHIVED if inactive for 180+ days
      if (lastActivityDays > 180) {
        return ClientLifecycleStage.ARCHIVED;
      }
      break;

    case ClientLifecycleStage.ARCHIVED:
      // Can't move from archived unless manually
      break;
  }

  return null;
}

/**
 * Get recommended actions for a client stage
 */
export function getRecommendedActions(
  stage: ClientLifecycleStage,
  daysInStage: number,
  lastActivityDays: number
): string[] {
  const config = LIFECYCLE_STAGE_CONFIG[stage];
  const actions = [...config.requiredActions];

  // Add context-specific actions
  if (daysInStage > 30 && stage === ClientLifecycleStage.PROSPECT) {
    actions.push('Follow up on proposal');
  }

  if (lastActivityDays > 14 && stage === ClientLifecycleStage.LEAD) {
    actions.push('Reach out - check status');
  }

  if (lastActivityDays > 60 && stage === ClientLifecycleStage.ACTIVE) {
    actions.push('Schedule re-engagement call');
    actions.push('Check for unpaid invoices');
  }

  if (stage === ClientLifecycleStage.INACTIVE && lastActivityDays < 7) {
    actions.push('Confirm continued interest');
  }

  return actions;
}

/**
 * Get timeline of lifecycle events
 */
export function generateLifecycleTimeline(
  transitions: LifecycleTransition[],
  createdDate: string
): Array<{
  date: string;
  event: string;
  stage: ClientLifecycleStage;
  details?: string;
}> {
  return [
    {
      date: createdDate,
      event: 'Client created',
      stage: ClientLifecycleStage.PROSPECT,
      details: 'Initial contact recorded'
    },
    ...transitions.map(t => ({
      date: t.timestamp,
      event: `Moved from ${t.fromStage} to ${t.toStage}`,
      stage: t.toStage,
      details: t.reason
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Check if stage transition is valid
 */
export function isValidTransition(
  fromStage: ClientLifecycleStage,
  toStage: ClientLifecycleStage
): boolean {
  // Define allowed transitions
  const allowedTransitions: Record<ClientLifecycleStage, ClientLifecycleStage[]> = {
    [ClientLifecycleStage.PROSPECT]: [
      ClientLifecycleStage.LEAD,
      ClientLifecycleStage.ARCHIVED
    ],
    [ClientLifecycleStage.LEAD]: [
      ClientLifecycleStage.ACTIVE,
      ClientLifecycleStage.PROSPECT,
      ClientLifecycleStage.ARCHIVED
    ],
    [ClientLifecycleStage.ACTIVE]: [
      ClientLifecycleStage.INACTIVE,
      ClientLifecycleStage.ARCHIVED
    ],
    [ClientLifecycleStage.INACTIVE]: [
      ClientLifecycleStage.ACTIVE,
      ClientLifecycleStage.ARCHIVED
    ],
    [ClientLifecycleStage.ARCHIVED]: [] // Can't transition out
  };

  return allowedTransitions[fromStage]?.includes(toStage) ?? false;
}

/**
 * Calculate days since entering current stage
 */
export function calculateDaysInStage(stageEntryDate: string): number {
  const entryDate = new Date(stageEntryDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - entryDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days since last activity
 */
export function calculateDaysSinceActivity(lastActivityDate: string | null): number {
  if (!lastActivityDate) return Number.MAX_SAFE_INTEGER;
  
  const activityDate = new Date(lastActivityDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - activityDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate lifecycle health summary
 */
export function generateLifecycleSummary(metrics: LifecycleMetrics): {
  summary: string;
  urgency: 'low' | 'medium' | 'high';
  actions: string[];
} {
  const config = LIFECYCLE_STAGE_CONFIG[metrics.stage];
  const daysInStage = metrics.daysInStage;
  const daysSinceActivity = metrics.lastActivityDate 
    ? calculateDaysSinceActivity(metrics.lastActivityDate)
    : null;

  let summary = '';
  let urgency: 'low' | 'medium' | 'high' = 'low';
  const actions = getRecommendedActions(
    metrics.stage,
    daysInStage,
    daysSinceActivity || 999
  );

  switch (metrics.stage) {
    case ClientLifecycleStage.PROSPECT:
      summary = `Prospect for ${daysInStage} days - Awaiting qualification`;
      urgency = daysInStage > 30 ? 'high' : daysInStage > 14 ? 'medium' : 'low';
      break;

    case ClientLifecycleStage.LEAD:
      summary = `Qualified lead for ${daysInStage} days - Moving toward closure`;
      urgency = daysInStage > 60 ? 'high' : daysInStage > 30 ? 'medium' : 'low';
      break;

    case ClientLifecycleStage.ACTIVE:
      summary = `Active client - Engagement score: ${metrics.engagementScore}/100`;
      urgency = daysSinceActivity && daysSinceActivity > 60 ? 'high' : 'low';
      break;

    case ClientLifecycleStage.INACTIVE:
      summary = `Inactive for ${daysSinceActivity} days - Risk of churn`;
      urgency = daysSinceActivity && daysSinceActivity > 90 ? 'high' : 'medium';
      break;

    case ClientLifecycleStage.ARCHIVED:
      summary = 'Archived client - Relationship concluded';
      urgency = 'low';
      break;
  }

  return { summary, urgency, actions };
}
