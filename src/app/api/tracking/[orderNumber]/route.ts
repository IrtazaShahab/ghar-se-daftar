import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { describeDbError, isTransientDbError } from "@/lib/db/prisma";
import { getAdminTrackingByNumber, getCustomerTracking } from "@/lib/delivery/queries";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, private" };

/**
 * Live delivery status for one order, polled by the tracking page while the
 * order is out for delivery. Customers get only their own order (any other
 * number is a 404, same as one that doesn't exist); admins get any order.
 * Everyone else gets 404. Riders use their own pages, not this endpoint.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber: raw } = await params;
  const orderNumber = decodeURIComponent(raw).trim();
  if (!/^[A-Za-z0-9-]{3,40}$/.test(orderNumber)) return NextResponse.json({ error: "Not found." }, { status: 404, headers: NO_STORE });

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401, headers: NO_STORE });

    const view =
      user.role === "CUSTOMER" ? await getCustomerTracking(orderNumber, user.id) : user.role === "ADMIN" ? await getAdminTrackingByNumber(orderNumber) : null;
    if (!view) return NextResponse.json({ error: "Not found." }, { status: 404, headers: NO_STORE });
    return NextResponse.json(view, { headers: NO_STORE });
  } catch (error) {
    console.error(`Tracking: ${isTransientDbError(error) ? `database unavailable (${describeDbError(error)})` : error instanceof Error ? error.message : "unknown error"}`);
    return NextResponse.json({ error: "Couldn't load this right now. Try again." }, { status: 503, headers: NO_STORE });
  }
}
