import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { EmailService } from '@/lib/email-service';
import { encryptEmailCredentials, EmailCredentials } from '@/lib/encryption';

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
 * POST /api/integrations/email/test
 * Test email connection with provided credentials
 */
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const body = await request.json();

    const { credentials } = body;

    if (!credentials) {
      return NextResponse.json(
        { error: 'Credentials are required' },
        { status: 400 }
      );
    }

    // Validate credentials structure
    const requiredFields = ['provider', 'email'];
    for (const field of requiredFields) {
      if (!credentials[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Provider-specific validation
    switch (credentials.provider) {
      case 'gmail':
      case 'outlook':
        if (!credentials.accessToken || !credentials.refreshToken) {
          return NextResponse.json(
            { error: 'OAuth tokens are required for this provider' },
            { status: 400 }
          );
        }
        break;
      
      case 'yahoo':
        if (!credentials.password) {
          return NextResponse.json(
            { error: 'App password is required for Yahoo' },
            { status: 400 }
          );
        }
        break;
      
      case 'smtp':
        if (!credentials.smtpHost || !credentials.username || !credentials.password) {
          return NextResponse.json(
            { error: 'SMTP host, username, and password are required' },
            { status: 400 }
          );
        }
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported email provider' },
          { status: 400 }
        );
    }

    // Encrypt credentials temporarily for testing
    const encryptedCredentials = encryptEmailCredentials(credentials);
    
    // Create email service and test connection
    const emailService = new EmailService(encryptedCredentials);
    const testResult = await emailService.testConnection();

    // Prepare response with detailed results
    const response = {
      success: testResult.success,
      provider: credentials.provider,
      email: credentials.email,
      details: {
        smtpConnected: testResult.details?.smtpConnected || false,
        imapConnected: testResult.details?.imapConnected || false,
        authValid: testResult.details?.authValid || false,
      },
      message: testResult.success 
        ? 'Connection successful! Your email account is properly configured.' 
        : 'Connection failed. Please check your credentials and try again.',
      error: testResult.error || null,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { 
      status: testResult.success ? 200 : 400 
    });

  } catch (error) {
    console.error('Email connection test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Connection test failed due to server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}