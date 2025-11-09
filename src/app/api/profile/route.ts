import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, we'll use a simple user ID from the token
    // In production, you'd decode the JWT token properly
    const userId = "user-1"; // This should come from JWT token

    const result = await sql`
      SELECT * FROM user_profiles WHERE id = ${userId}
    `;

    if (result.length === 0) {
      // Return default profile if not exists
      return NextResponse.json({
        id: userId,
        name: "John Doe",
        email: "john.doe@example.com",
        company: "CRM Solutions Inc.",
        role: "Account Manager",
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

    const userId = "user-1"; // This should come from JWT token
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
