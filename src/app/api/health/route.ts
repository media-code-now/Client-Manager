import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;
    
    return NextResponse.json({
      success: true,
      environment: {
        hasDbUrl: !!dbUrl,
        hasJwtSecret: !!jwtSecret,
        dbUrlPrefix: dbUrl ? dbUrl.substring(0, 20) + '...' : 'Not found',
        nodeEnv: process.env.NODE_ENV
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