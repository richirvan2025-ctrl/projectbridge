import { NextResponse } from "next/server";

export async function GET() {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  return NextResponse.json({
    ok: true,
    app: "projectbridge",
    milestone: 5,
    supabaseConfigured,
    timestamp: new Date().toISOString(),
  });
}
