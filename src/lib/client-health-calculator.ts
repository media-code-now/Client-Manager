/**
 * Client Health Score Calculator
 * 
 * Calculates a comprehensive health score (0-100) for each client based on:
 * - Overdue tasks (-15 points each)
 * - Open/pending tasks (-5 points each)
 * - Recent activity (+10 points if in last 7 days)
 * - Task completion rate (bonus if > 80% completed)
 * - Credential freshness (+5 points if updated recently)
 * 
 * Score Interpretation:
 * 90-100: Excellent (green) - Healthy, engaged client
 * 70-89:  Good (blue) - Solid, steady client
 * 50-69:  Needs Attention (yellow) - Some pending work
 * <50:    Critical (red) - Urgent action needed
 */

export interface HealthScoreData {
  clientId: number;
  clientName: string;
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'attention' | 'critical';
  healthColor: string;
  
  // Detailed breakdown
  overdueTasks: number;
  pendingTasks: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  
  // Activity metrics
  lastActivityDate: string | null;
  daysWithoutActivity: number;
  hasRecentActivity: boolean;
  
  // Credential metrics
  credentialsCount: number;
  credentialsNeedingUpdate: number;
  lastCredentialUpdate: string | null;
  
  // Trend indicators
  trend: 'improving' | 'stable' | 'declining';
  trendDirection: string;
}

export function calculateHealthScore(data: {
  overdueTasks: number;
  pendingTasks: number;
  completedTasks: number;
  totalTasks: number;
  lastActivityDate: string | null;
  credentialsCount: number;
  credentialsLastUpdated: string | null;
}): number {
  let score = 100;

  // Penalize overdue tasks (-15 points each)
  score -= Math.min(data.overdueTasks * 15, 30); // Cap at -30

  // Penalize pending tasks (-5 points each, cap at -25)
  score -= Math.min(data.pendingTasks * 5, 25);

  // Reward recent activity (+10 points if active in last 7 days)
  if (data.lastActivityDate) {
    const lastActivity = new Date(data.lastActivityDate);
    const daysAgo = Math.floor(
      (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysAgo <= 7) {
      score += 10;
    } else if (daysAgo > 30) {
      // Penalize inactivity
      score -= Math.min(Math.floor((daysAgo - 30) / 10) * 5, 15);
    }
  } else {
    // No activity at all - penalize
    score -= 15;
  }

  // Reward high completion rate (+15 bonus if > 80% tasks completed)
  if (data.totalTasks > 0) {
    const completionRate = data.completedTasks / data.totalTasks;
    if (completionRate > 0.8) {
      score += 15;
    } else if (completionRate < 0.2) {
      score -= 10;
    }
  }

  // Reward credential freshness (+5 if updated in last 30 days)
  if (data.credentialsLastUpdated) {
    const lastUpdate = new Date(data.credentialsLastUpdated);
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceUpdate <= 30 && data.credentialsCount > 0) {
      score += 5;
    }
  }

  // Ensure score stays within 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getHealthStatus(score: number): 'excellent' | 'good' | 'attention' | 'critical' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'attention';
  return 'critical';
}

export function getHealthColor(score: number): string {
  if (score >= 90) return 'bg-green-100 border-green-300 text-green-900';
  if (score >= 70) return 'bg-blue-100 border-blue-300 text-blue-900';
  if (score >= 50) return 'bg-yellow-100 border-yellow-300 text-yellow-900';
  return 'bg-red-100 border-red-300 text-red-900';
}

export function getHealthStatusLabel(status: string): string {
  const labels = {
    excellent: '✨ Excellent',
    good: '👍 Good',
    attention: '⚠️ Needs Attention',
    critical: '🚨 Critical'
  };
  return labels[status as keyof typeof labels] || status;
}

export function getHealthBadgeColor(status: string): string {
  const colors = {
    excellent: 'bg-green-500 text-white',
    good: 'bg-blue-500 text-white',
    attention: 'bg-yellow-500 text-white',
    critical: 'bg-red-500 text-white'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
}

export function formatHealthMetric(label: string, value: string | number, unit?: string): string {
  return `${label}: ${value}${unit ? ' ' + unit : ''}`;
}

export function getTrendIndicator(trend: 'improving' | 'stable' | 'declining'): string {
  const indicators = {
    improving: '📈 Improving',
    stable: '➡️ Stable',
    declining: '📉 Declining'
  };
  return indicators[trend];
}

/**
 * Generates human-readable insights from health data
 */
export function generateHealthInsights(data: HealthScoreData): string[] {
  const insights: string[] = [];

  // Overdue tasks insights
  if (data.overdueTasks > 0) {
    insights.push(
      `⚠️ ${data.overdueTasks} overdue task${data.overdueTasks > 1 ? 's' : ''} need${data.overdueTasks > 1 ? '' : 's'} immediate attention`
    );
  }

  // Pending tasks insights
  if (data.pendingTasks > 5) {
    insights.push(`📋 ${data.pendingTasks} pending tasks - consider prioritizing or delegating`);
  }

  // Completion rate insights
  if (data.completionRate > 0.8) {
    insights.push(`✅ Excellent completion rate (${Math.round(data.completionRate * 100)}%) - keep it up!`);
  } else if (data.completionRate < 0.2 && data.totalTasks > 0) {
    insights.push(`⚠️ Low completion rate (${Math.round(data.completionRate * 100)}%) - may indicate resource constraints`);
  }

  // Activity insights
  if (data.daysWithoutActivity > 30) {
    insights.push(`📭 No activity for ${data.daysWithoutActivity} days - time to reconnect`);
  } else if (data.hasRecentActivity) {
    insights.push(`🔥 Active client with recent engagement`);
  }

  // Credential insights
  if (data.credentialsNeedingUpdate > 0) {
    insights.push(
      `🔐 ${data.credentialsNeedingUpdate} credential${data.credentialsNeedingUpdate > 1 ? 's' : ''} should be updated`
    );
  }

  return insights;
}

/**
 * Calculates overall health status based on multiple factors
 */
export function formatHealthData(
  clientId: number,
  clientName: string,
  rawData: any
): HealthScoreData {
  const overdueTasks = rawData.overdue_tasks || 0;
  const pendingTasks = rawData.pending_tasks || 0;
  const completedTasks = rawData.completed_tasks || 0;
  const totalTasks = rawData.total_tasks || 0;
  const lastActivityDate = rawData.last_activity || null;
  const credentialsCount = rawData.credentials_count || 0;
  const credentialsLastUpdated = rawData.credentials_last_updated || null;

  const score = calculateHealthScore({
    overdueTasks,
    pendingTasks,
    completedTasks,
    totalTasks,
    lastActivityDate,
    credentialsCount,
    credentialsLastUpdated
  });

  const status = getHealthStatus(score);
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const lastActivity = lastActivityDate ? new Date(lastActivityDate) : null;
  const daysWithoutActivity = lastActivity
    ? Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    : 9999;

  // Determine trend (for now, stable - could be enhanced with historical data)
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (overdueTasks > 0) {
    trend = 'declining';
  } else if (completionRate > 0.8 && daysWithoutActivity < 7) {
    trend = 'improving';
  }

  return {
    clientId,
    clientName,
    healthScore: score,
    healthStatus: status,
    healthColor: getHealthColor(score),
    
    overdueTasks,
    pendingTasks,
    completedTasks,
    totalTasks,
    completionRate: Math.round(completionRate * 100),
    
    lastActivityDate,
    daysWithoutActivity: Math.min(daysWithoutActivity, 9999),
    hasRecentActivity: daysWithoutActivity <= 7,
    
    credentialsCount,
    credentialsNeedingUpdate: Math.max(0, Math.floor(credentialsCount * 0.3)), // Estimate 30% need updates
    lastCredentialUpdate: credentialsLastUpdated,
    
    trend,
    trendDirection: getTrendIndicator(trend)
  };
}
