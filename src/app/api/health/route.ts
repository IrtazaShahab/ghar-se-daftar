import { NextResponse } from "next/server";
import { describeDbError, prisma } from "@/lib/db/prisma";
import { getSupabasePublicKey } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    database: "unknown",
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseKey: Boolean(getSupabasePublicKey())
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    // Error code only: Prisma messages can include the database host.
    console.error(`Health database check failed (${describeDbError(error)})`);
    checks.database = "error";
  }

  const healthy = checks.database === "ok" && checks.supabaseUrl && checks.supabaseKey;

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
