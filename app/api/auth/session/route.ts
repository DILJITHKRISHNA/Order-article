import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession("user");
  return NextResponse.json({
    authenticated: Boolean(session),
    zone: session?.zone ?? null,
  });
}
