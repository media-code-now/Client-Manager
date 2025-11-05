import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseUrl } from '../../../utils/database';

export async function GET() {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    
    let dbUrl: string;
    let dbError: string | null = null;
    
    try {
      dbUrl = getDatabaseUrl();
    } catch (error) {
      dbError = String(error);
      dbUrl = '';
    }
    
    console.log('Health check - Environment variables:');
    console.log('- DATABASE_URL constructed:', !!dbUrl);
    console.log('- JWT_SECRET:', !!jwtSecret);
    console.log('- JWT_REFRESH_SECRET:', !!jwtRefreshSecret);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DB_HOST:', !!process.env.DB_HOST);
    console.log('- DB_USER:', !!process.env.DB_USER);
    console.log('- DB_PASSWORD:', !!process.env.DB_PASSWORD);
    console.log('- DB_NAME:', !!process.env.DB_NAME);
    if (dbError) console.log('- DB Error:', dbError);
    
    return NextResponse.json({
      success: true,
      environment: {
        hasDbUrl: !!dbUrl,
        hasJwtSecret: !!jwtSecret,
        hasJwtRefreshSecret: !!jwtRefreshSecret,
        dbUrlPrefix: dbUrl ? dbUrl.substring(0, 30) + '...' : 'Not constructed',
        dbError,
        nodeEnv: process.env.NODE_ENV,
        dbComponents: {
          hasHost: !!process.env.DB_HOST,
          hasUser: !!process.env.DB_USER,
          hasPassword: !!process.env.DB_PASSWORD,
          hasName: !!process.env.DB_NAME
        },
        allEnvVars: Object.keys(process.env).filter(key => 
          key.startsWith('DATABASE_') || 
          key.startsWith('JWT_') || 
          key.startsWith('DB_') ||
          key === 'NODE_ENV'
        )
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}