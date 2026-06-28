import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "ghar-se-daftar", timestamp: new Date().toISOString() });
}
