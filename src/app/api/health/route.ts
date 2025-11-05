import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    
    console.log('Health check - Environment variables:');
    console.log('- DATABASE_URL:', !!dbUrl);
    console.log('- JWT_SECRET:', !!jwtSecret);
    console.log('- JWT_REFRESH_SECRET:', !!jwtRefreshSecret);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    return NextResponse.json({
      success: true,
      environment: {
        hasDbUrl: !!dbUrl,
        hasJwtSecret: !!jwtSecret,
        hasJwtRefreshSecret: !!jwtRefreshSecret,
        dbUrlPrefix: dbUrl ? dbUrl.substring(0, 30) + '...' : 'Not found',
        nodeEnv: process.env.NODE_ENV,
        allEnvVars: Object.keys(process.env).filter(key => 
          key.startsWith('DATABASE_') || 
          key.startsWith('JWT_') || 
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