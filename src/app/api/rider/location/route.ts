import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AuthorizationError, requireRiderActor } from "@/lib/auth/guards";
import { describeDbError, isTransientDbError } from "@/lib/db/prisma";
import { recordRiderLocation } from "@/lib/delivery/operations";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

const bodySchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  accuracy: z.number().finite().min(0).max(100_000).nullable().optional()
});

/** Browsers send Origin on POST; only accept points from this site's own pages. */
function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/**
 * The rider app posts its position here while sharing is on. Identity comes
 * from the session cookie (the rider id is looked up server-side, never sent);
 * the point is stored only for the rider's own active, consented delivery and
 * at most every few seconds (see src/lib/delivery/geo.ts).
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403, headers: NO_STORE });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Expected JSON." }, { status: 415, headers: NO_STORE });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400, headers: NO_STORE });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid location." }, { status: 400, headers: NO_STORE });

  try {
    const { rider } = await requireRiderActor();
    const result = await recordRiderLocation({
      orderId: parsed.data.orderId,
      riderId: rider.id,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy ?? null
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: NO_STORE });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ ok: false, error: "Not allowed.", stop: true }, { status: 403, headers: NO_STORE });
    console.error(`Rider location: ${isTransientDbError(error) ? `database unavailable (${describeDbError(error)})` : error instanceof Error ? error.message : "unknown error"}`);
    return NextResponse.json({ ok: false, error: "Couldn't save your location right now.", stop: false }, { status: 503, headers: NO_STORE });
  }
}
