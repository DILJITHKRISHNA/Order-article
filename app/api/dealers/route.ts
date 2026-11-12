import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { listDealers, saveDealer } from "@/lib/dealers-repository";
import { dealerSchema } from "@/schemas/dealer-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Saved dealers for the signed-in user's zone. */
export async function GET() {
  const session = await getSession("user");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ dealers: await listDealers(session.zone) });
  } catch (error) {
    console.error("Failed to load dealers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dealers" },
      { status: 500 }
    );
  }
}

/** Add a dealer (or update the saved one with the same shop + phone). */
export async function POST(request: Request) {
  const session = await getSession("user");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = dealerSchema.safeParse(await request.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Invalid dealer details";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const dealer = await saveDealer(session.zone, parsed.data);
    return NextResponse.json({ dealer });
  } catch (error) {
    console.error("Failed to save dealer:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save dealer" },
      { status: 500 }
    );
  }
}
