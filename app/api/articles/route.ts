import { NextResponse } from "next/server";

import { parseArticlesWorkbook } from "@/lib/articles/parse";
import { readArticleFile } from "@/lib/articles/storage";
import { getSession } from "@/lib/auth/session";
import { getZoneLabel } from "@/lib/zones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Article catalog for the logged-in user's zone. */
export async function GET() {
  const session = await getSession("user");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const file = await readArticleFile(session.zone);
    if (!file) {
      return NextResponse.json(
        {
          error: `No article sheet has been uploaded for ${getZoneLabel(session.zone)} yet. Please contact your admin.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      zone: session.zone,
      articles: parseArticlesWorkbook(file.buffer),
    });
  } catch (error) {
    console.error("Failed to load articles:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load articles",
      },
      { status: 500 }
    );
  }
}
