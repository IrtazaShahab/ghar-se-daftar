import { NextResponse } from "next/server";
import { describeDbError, prisma } from "@/lib/db/prisma";
import { getDatabaseUrlWarnings, getMissingServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Public health check: { status: "ok" } or a generic 503. Details go to the
 * server log only (variable names and Prisma error codes, never hosts or URLs).
 */
export async function GET() {
  let healthy = true;

  const missing = getMissingServerEnv();
  if (missing.length > 0) {
    console.error(`Health: missing environment variables: ${missing.join(", ")}`);
    healthy = false;
  }
  for (const warning of getDatabaseUrlWarnings()) console.warn(`Health: ${warning}`);

  try {
    // A real round trip through the pooler, not just client construction.
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error(`Health: database check failed (${describeDbError(error)})`);
    healthy = false;
  }

  if (!healthy) {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: NO_STORE });
  }
  return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
}
