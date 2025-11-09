import { NextRequest, NextResponse } from 'next/server';
import { syncAllEmailIntegrations } from '@/lib/email-sync-service';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


/**
 * POST /api/cron/sync-emails
 * Background worker endpoint to sync emails from all active integrations
 * 
 * This should be called by a cron job every 5 minutes
 * 
 * Setup options:
 * 1. Vercel Cron Jobs: Add to vercel.json
 * 2. External cron service: https://cron-job.org, EasyCron, etc.
 * 3. Node-cron: Run from a separate worker process
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn('⚠️  CRON_SECRET not configured');
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📧 Starting email sync job...');
    const startTime = Date.now();

    // Sync all email integrations
    const result = await syncAllEmailIntegrations();

    const duration = Date.now() - startTime;

    console.log('✅ Email sync completed:', {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      messages: result.totalMessages,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalIntegrations: result.total,
        successfulSyncs: result.successful,
        failedSyncs: result.failed,
        totalMessagesSynced: result.totalMessages,
        durationMs: duration,
      },
    });

  } catch (error) {
    console.error('❌ Email sync job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * GET /api/cron/sync-emails
 * Get last sync status (for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);

    // Get last sync stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_integrations,
        COUNT(CASE WHEN sync_status = 'idle' THEN 1 END) as idle,
        COUNT(CASE WHEN sync_status = 'syncing' THEN 1 END) as syncing,
        COUNT(CASE WHEN sync_status = 'error' THEN 1 END) as errors,
        SUM(messages_synced) as total_messages_synced,
        MAX(last_sync_at) as last_sync_at,
        AVG(last_sync_duration_ms) as avg_duration_ms
      FROM email_sync_state
    `;

    const recentLogs = await sql`
      SELECT 
        integration_id,
        event_type,
        status,
        created_at
      FROM integration_logs
      WHERE event_type IN ('email_synced', 'contact_created')
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      stats: stats[0],
      recentActivity: recentLogs,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to get sync status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
