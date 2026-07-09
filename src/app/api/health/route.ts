import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const checks = {
    database: "unknown",
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    console.error("Health database check failed:", error);
    checks.database = "error";
  }

  const healthy = checks.database === "ok" && checks.supabaseUrl && checks.supabaseAnonKey;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "error",
      service: "ghar-se-daftar",
      checks,
      timestamp: new Date().toISOString()
    },
    { status: healthy ? 200 : 500 }
  );
}
