import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { EmailService } from '@/lib/email-service';
import crypto from 'crypto';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


/**
 * Verify JWT token and get user ID
 */
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
  return decoded.userId;
}

/**
 * POST /api/integrations/email/oauth/initiate
 * Start OAuth flow for Gmail/Outlook
 */
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const body = await request.json();

    const { provider } = body;

    if (!provider || !['gmail', 'outlook'].includes(provider)) {
      return NextResponse.json(
        { error: 'Provider must be gmail or outlook' },
        { status: 400 }
      );
    }

    // Get client ID from environment
    const clientId = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_ID 
      : process.env.OUTLOOK_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: `${provider} OAuth not configured` },
        { status: 500 }
      );
    }

    // Generate secure state parameter
    const nonce = crypto.randomBytes(16).toString('hex');
    const stateData = {
      provider,
      userId,
      nonce,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Generate OAuth URL
    const authUrl = EmailService.generateOAuthURL(provider as 'gmail' | 'outlook', clientId, state);

    return NextResponse.json({
      success: true,
      authUrl,
      provider,
      state, // Return state for frontend tracking
    });

  } catch (error) {
    console.error('OAuth initiation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate OAuth',
    }, { status: 500 });
  }
}