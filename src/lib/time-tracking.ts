/**
 * Task Time Tracking Service
 * 
 * Handles time entry creation, retrieval, and aggregation for billing.
 * Features:
 * - Log manual time entries
 * - Calculate billable hours
 * - Daily/weekly/monthly summaries
 * - Export for invoicing
 */

export interface TimeEntry {
  id: number;
  taskId: number;
  userId: string;
  date: string;
  hoursWorked: number;
  notes?: string;
  billable: boolean;
  createdAt: string;
}

export interface TimeEntrySummary {
  taskId: number;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  entries: TimeEntry[];
  averageHourlyRate?: number;
  totalValue?: number;
}

export interface DailySummary {
  date: string;
  totalHours: number;
  billableHours: number;
  entriesCount: number;
}

/**
 * Format hours for display (e.g., 1.5 hours = "1h 30m")
 */
export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Calculate total billable value
 */
export function calculateBillableValue(hours: number, hourlyRate: number): number {
  return parseFloat((hours * hourlyRate).toFixed(2));
}

/**
 * Validate time entry data
 */
export function validateTimeEntry(data: {
  hoursWorked: number;
  date: string;
}): { valid: boolean; error?: string } {
  if (!data.hoursWorked || data.hoursWorked <= 0) {
    return { valid: false, error: 'Hours worked must be greater than 0' };
  }
  
  if (data.hoursWorked > 24) {
    return { valid: false, error: 'Hours worked cannot exceed 24 hours per day' };
  }
  
  const entryDate = new Date(data.date);
  const today = new Date();
  
  if (entryDate > today) {
    return { valid: false, error: 'Cannot log time in the future' };
  }
  
  return { valid: true };
}

/**
 * Group time entries by date
 */
export function groupByDate(entries: TimeEntry[]): Record<string, TimeEntry[]> {
  return entries.reduce(
    (acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = [];
      }
      acc[entry.date].push(entry);
      return acc;
    },
    {} as Record<string, TimeEntry[]>
  );
}

/**
 * Calculate daily summary
 */
export function calculateDailySummary(entries: TimeEntry[]): DailySummary[] {
  const grouped = groupByDate(entries);
  
  return Object.entries(grouped).map(([date, dayEntries]) => ({
    date,
    totalHours: dayEntries.reduce((sum, e) => sum + e.hoursWorked, 0),
    billableHours: dayEntries
      .filter(e => e.billable)
      .reduce((sum, e) => sum + e.hoursWorked, 0),
    entriesCount: dayEntries.length
  }));
}

/**
 * Calculate time entry summary for a task
 */
export function calculateTaskSummary(
  entries: TimeEntry[],
  hourlyRate?: number
): TimeEntrySummary {
  const taskId = entries[0]?.taskId || 0;
  const totalHours = entries.reduce((sum, e) => sum + e.hoursWorked, 0);
  const billableHours = entries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + e.hoursWorked, 0);

  return {
    taskId,
    totalHours,
    billableHours,
    nonBillableHours: totalHours - billableHours,
    entries,
    averageHourlyRate: hourlyRate,
    totalValue: hourlyRate ? calculateBillableValue(billableHours, hourlyRate) : undefined
  };
}

/**
 * Get week summary (last 7 days)
 */
export function getWeekSummary(entries: TimeEntry[]): {
  totalHours: number;
  billableHours: number;
  daysWorked: number;
} {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weekEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= weekAgo && entryDate <= today;
  });

  return {
    totalHours: weekEntries.reduce((sum, e) => sum + e.hoursWorked, 0),
    billableHours: weekEntries
      .filter(e => e.billable)
      .reduce((sum, e) => sum + e.hoursWorked, 0),
    daysWorked: new Set(weekEntries.map(e => e.date)).size
  };
}

/**
 * Format time entry for display
 */
export function formatTimeEntry(entry: TimeEntry): string {
  const date = new Date(entry.date).toLocaleDateString();
  const hours = formatHours(entry.hoursWorked);
  const status = entry.billable ? '💰 Billable' : '⏸️ Non-billable';
  
  return `${date}: ${hours} (${status})${entry.notes ? ` - ${entry.notes}` : ''}`;
}

/**
 * Export time entries as CSV
 */
export function exportTimeEntriesAsCSV(entries: TimeEntry[], taskId?: number): string {
  const headers = ['Date', 'Hours', 'Billable', 'Notes'];
  const rows = entries.map(e => [
    e.date,
    e.hoursWorked,
    e.billable ? 'Yes' : 'No',
    e.notes || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
}

/**
 * Download time entries as file
 */
export function downloadTimeEntriesCSV(entries: TimeEntry[], taskId: number): void {
  const csv = exportTimeEntriesAsCSV(entries, taskId);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `time-entries-task-${taskId}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
