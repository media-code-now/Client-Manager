import { NextRequest, NextResponse } from 'next/server';
import { EmailTrackingService } from '@/lib/email-tracking-service';

/**
 * Email Link Click Tracking Endpoint
 * Records click event and redirects to original URL
 * 
 * GET /api/tracking/click/[id]?original_url=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackingId = params.id;
    const searchParams = request.nextUrl.searchParams;
    
    // The original URL is stored in the database, but we also accept it as a fallback
    const fallbackUrl = searchParams.get('url') || 'https://example.com';

    if (!trackingId) {
      return NextResponse.redirect(fallbackUrl);
    }

    // Extract user agent and IP address
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     undefined;

    // Record the click event and get original URL
    const trackingService = new EmailTrackingService();
    const result = await trackingService.recordClick(trackingId, userAgent, ipAddress);

    // Redirect to original URL (or fallback if not found)
    const redirectUrl = result.originalUrl || fallbackUrl;
    
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error in click tracking endpoint:', error);
    
    // Redirect to a safe fallback URL on error
    const searchParams = request.nextUrl.searchParams;
    const fallbackUrl = searchParams.get('url') || 'https://example.com';
    
    return NextResponse.redirect(fallbackUrl, {
      status: 302
    });
  }
}
