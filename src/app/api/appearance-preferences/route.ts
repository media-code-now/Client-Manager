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

// GET /api/appearance-preferences - Get user appearance preferences
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
      SELECT * FROM appearance_preferences WHERE user_id = ${userId}
    `;

    if (result.length === 0) {
      // Return default preferences if not exists
      return NextResponse.json({
        theme: "system",
        colorScheme: "blue",
        viewDensity: "comfortable",
        language: "en",
        reducedMotion: false,
        highContrast: false,
      });
    }

    // Map snake_case to camelCase
    const preferences = result[0];
    return NextResponse.json({
      theme: preferences.theme,
      colorScheme: preferences.color_scheme,
      viewDensity: preferences.view_density,
      language: preferences.language,
      reducedMotion: preferences.reduced_motion,
      highContrast: preferences.high_contrast,
    });
  } catch (error) {
    console.error("Error fetching appearance preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch appearance preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/appearance-preferences - Update user appearance preferences
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
      theme,
      colorScheme,
      viewDensity,
      language,
      reducedMotion,
      highContrast,
    } = body;

    // Check if preferences exist
    const existingPreferences = await sql`
      SELECT id FROM appearance_preferences WHERE user_id = ${userId}
    `;

    let result;
    if (existingPreferences.length === 0) {
      // Insert new preferences
      result = await sql`
        INSERT INTO appearance_preferences (
          id, user_id, theme, color_scheme, view_density, language,
          reduced_motion, high_contrast, created_at, updated_at
        ) VALUES (
          ${`pref-${userId}-${Date.now()}`}, ${userId},
          ${theme || "system"}, ${colorScheme || "blue"},
          ${viewDensity || "comfortable"}, ${language || "en"},
          ${reducedMotion || false}, ${highContrast || false},
          NOW(), NOW()
        )
        RETURNING *
      `;
    } else {
      // Update existing preferences
      result = await sql`
        UPDATE appearance_preferences
        SET
          theme = ${theme || "system"},
          color_scheme = ${colorScheme || "blue"},
          view_density = ${viewDensity || "comfortable"},
          language = ${language || "en"},
          reduced_motion = ${reducedMotion || false},
          high_contrast = ${highContrast || false},
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;
    }

    // Map snake_case to camelCase for response
    const savedPreferences = result[0];
    return NextResponse.json({
      theme: savedPreferences.theme,
      colorScheme: savedPreferences.color_scheme,
      viewDensity: savedPreferences.view_density,
      language: savedPreferences.language,
      reducedMotion: savedPreferences.reduced_motion,
      highContrast: savedPreferences.high_contrast,
    });
  } catch (error) {
    console.error("Error updating appearance preferences:", error);
    return NextResponse.json(
      { error: "Failed to update appearance preferences" },
      { status: 500 }
    );
  }
}
