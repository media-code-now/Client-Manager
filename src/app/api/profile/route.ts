import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL!);

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface DecodedToken {
  id: number;
  userId?: number;
  uuid: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT token to get user ID
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.userId || decoded.id;

    const result = await sql`
      SELECT * FROM user_profiles WHERE id = ${userId}
    `;

    if (result.length === 0) {
      // Return user info from JWT token if profile doesn't exist
      return NextResponse.json({
        id: userId,
        name: decoded.name,
        email: decoded.email,
        company: "",
        role: decoded.role || "User",
        timezone: "America/New_York",
        language: "en",
        twoFactorEnabled: false,
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT token to get user ID
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.userId || decoded.id;
    const body = await request.json();

    const {
      name,
      email,
      company,
      role,
      timezone,
      language,
      twoFactorEnabled,
      emailNotifications,
      pushNotifications,
      marketingEmails,
    } = body;

    // Check if profile exists
    const existingProfile = await sql`
      SELECT id FROM user_profiles WHERE id = ${userId}
    `;

    let result;
    if (existingProfile.length === 0) {
      // Insert new profile
      result = await sql`
        INSERT INTO user_profiles (
          id, name, email, company, role, timezone, language,
          two_factor_enabled, email_notifications, push_notifications, marketing_emails,
          created_at, updated_at
        ) VALUES (
          ${userId}, ${name}, ${email}, ${company || null}, ${role || null},
          ${timezone || "America/New_York"}, ${language || "en"},
          ${twoFactorEnabled || false}, ${emailNotifications !== false},
          ${pushNotifications !== false}, ${marketingEmails || false},
          NOW(), NOW()
        )
        RETURNING *
      `;
    } else {
      // Update existing profile
      result = await sql`
        UPDATE user_profiles
        SET
          name = ${name},
          email = ${email},
          company = ${company || null},
          role = ${role || null},
          timezone = ${timezone || "America/New_York"},
          language = ${language || "en"},
          two_factor_enabled = ${twoFactorEnabled || false},
          email_notifications = ${emailNotifications !== false},
          push_notifications = ${pushNotifications !== false},
          marketing_emails = ${marketingEmails || false},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
