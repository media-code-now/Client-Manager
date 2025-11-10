import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * OAuth2 configuration for different providers
 */
const getOAuthConfig = (provider: string) => {
  switch (provider) {
    case 'gmail':
      return {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/email/oauth/callback`,
        tokenUrl: 'https://oauth2.googleapis.com/token',
      };
    
    case 'outlook':
      return {
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/email/oauth/callback`,
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      };
    
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
};

/**
 * GET /api/integrations/email/oauth/callback
 * Handle OAuth callback from Gmail/Outlook
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed';
      console.error('OAuth error:', error, errorDescription);
      
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=Missing authorization code or state`
      );
    }

    // Parse state to get provider and user info
    let stateData;
    try {
      // Google may URL-encode the state, so decode it first
      const decodedState = decodeURIComponent(state);
      console.log('Raw state:', state);
      console.log('Decoded state string:', decodedState);
      
      stateData = JSON.parse(Buffer.from(decodedState, 'base64').toString());
      console.log('Parsed state data:', stateData);
    } catch (e) {
      console.error('Invalid state parameter:', e, 'Original state:', state);
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=Invalid state parameter`
      );
    }

    const { provider, userId, nonce } = stateData;

    if (!provider || !userId) {
      console.error('Missing required state fields:', { provider, userId, hasNonce: !!nonce, fullState: stateData });
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=Invalid state data (missing provider or userId)`
      );
    }

    // Get OAuth configuration
    const oauthConfig = getOAuthConfig(provider);

    // Exchange authorization code for tokens
    let tokenResponse;
    
    if (provider === 'gmail') {
      const oauth2Client = new google.auth.OAuth2(
        oauthConfig.clientId,
        oauthConfig.clientSecret,
        oauthConfig.redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code);
      
      // Get user email from Google
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      tokenResponse = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        email: profile.data.emailAddress,
        expires_in: tokens.expiry_date,
      };
    } else if (provider === 'outlook') {
      // Exchange code for tokens with Microsoft
      const tokenRequest = await fetch(oauthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: oauthConfig.redirectUri,
        }),
      });

      if (!tokenRequest.ok) {
        const errorData = await tokenRequest.text();
        console.error('Token exchange failed:', errorData);
        throw new Error('Token exchange failed');
      }

      const tokens = await tokenRequest.json();

      // Get user email from Microsoft Graph
      const profileRequest = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      const profile = await profileRequest.json();

      tokenResponse = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        email: profile.mail || profile.userPrincipalName,
        expires_in: tokens.expires_in,
      };
    }

    if (!tokenResponse) {
      throw new Error('Failed to get tokens');
    }

    // Store tokens temporarily in URL params for the frontend to handle
    // In production, you might want to use a more secure method
    const successUrl = new URL(`${appUrl}/dashboard`);
    successUrl.searchParams.set('oauth_success', 'true');
    successUrl.searchParams.set('provider', provider);
    successUrl.searchParams.set('email', tokenResponse.email || '');
    successUrl.searchParams.set('access_token', tokenResponse.access_token || '');
    successUrl.searchParams.set('refresh_token', tokenResponse.refresh_token || '');
    successUrl.searchParams.set('client_id', oauthConfig.clientId);
    successUrl.searchParams.set('client_secret', oauthConfig.clientSecret);

    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return NextResponse.redirect(
      `${appUrl}/dashboard?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'OAuth callback failed'
      )}`
    );
  }
}