import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/store";

// POST /api/setup - Initialize database schema
// Call once after setting up DATABASE_URL
export async function POST(request: NextRequest) {
  // Optional: Add a secret key check for production
  const authHeader = request.headers.get("authorization");
  const setupKey = process.env.SETUP_KEY;
  
  if (setupKey && authHeader !== `Bearer ${setupKey}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Database setup failed:", error);
    return NextResponse.json(
      { error: "Database setup failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/setup - Check database status
export async function GET() {
  const hasDatabase = !!process.env.DATABASE_URL;
  return NextResponse.json({
    database: hasDatabase ? "configured" : "not configured (using in-memory)",
    message: hasDatabase 
      ? "POST to this endpoint to initialize schema" 
      : "Set DATABASE_URL environment variable to enable persistence"
  });
}
