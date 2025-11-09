import { NextRequest, NextResponse } from 'next/server';
import { EmailTrackingService } from '@/lib/email-tracking-service';

// 1x1 transparent GIF (base64 encoded)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * Email Tracking Pixel Endpoint
 * Serves a 1x1 transparent GIF and records email open event
 * 
 * GET /api/tracking/pixel/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackingId = params.id;

    if (!trackingId) {
      return new NextResponse(TRANSPARENT_GIF, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Extract user agent and IP address
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     undefined;

    // Record the open event asynchronously (don't wait)
    const trackingService = new EmailTrackingService();
    trackingService.recordOpen(trackingId, userAgent, ipAddress).catch(error => {
      console.error('Error recording email open:', error);
    });

    // Return the transparent GIF immediately
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': TRANSPARENT_GIF.length.toString()
      }
    });
  } catch (error) {
    console.error('Error in tracking pixel endpoint:', error);
    
    // Always return a GIF even on error to avoid broken image icons
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
