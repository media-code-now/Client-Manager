import { NextRequest, NextResponse } from 'next/server';
import { EmailTrackingService } from '@/lib/email-tracking-service';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


/**
 * Email Analytics Endpoint
 * Returns detailed analytics for a specific email
 * 
 * GET /api/emails/[id]/analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = parseInt(params.id);

    if (isNaN(emailId)) {
      return NextResponse.json(
        { error: 'Invalid email ID' },
        { status: 400 }
      );
    }

    const trackingService = new EmailTrackingService();
    const analytics = await trackingService.getEmailAnalytics(emailId);

    return NextResponse.json({
      success: true,
      analytics
    });
  } catch (error: any) {
    console.error('Error fetching email analytics:', error);
    
    if (error.message === 'Email not found') {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch email analytics' },
      { status: 500 }
    );
  }
}
