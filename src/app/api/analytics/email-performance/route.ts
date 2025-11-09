import { NextRequest, NextResponse } from 'next/server';
import { EmailTrackingService } from '@/lib/email-tracking-service';

/**
 * Email Performance Dashboard Analytics Endpoint
 * Returns aggregate email analytics with filters
 * 
 * GET /api/analytics/email-performance?userId=...&contactId=...&startDate=...&endDate=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const filters: {
      userId?: number;
      contactId?: number;
      startDate?: Date;
      endDate?: Date;
    } = {};

    const userIdParam = searchParams.get('userId');
    if (userIdParam) {
      filters.userId = parseInt(userIdParam);
    }

    const contactIdParam = searchParams.get('contactId');
    if (contactIdParam) {
      filters.contactId = parseInt(contactIdParam);
    }

    const startDateParam = searchParams.get('startDate');
    if (startDateParam) {
      filters.startDate = new Date(startDateParam);
    }

    const endDateParam = searchParams.get('endDate');
    if (endDateParam) {
      filters.endDate = new Date(endDateParam);
    }

    const trackingService = new EmailTrackingService();
    const analytics = await trackingService.getDashboardAnalytics(filters);

    return NextResponse.json({
      success: true,
      analytics,
      filters
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}
