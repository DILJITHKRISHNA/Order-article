import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { parseArticlesWorkbook } from "@/lib/articles/parse";
import {
  deleteArticleFile,
  MAX_ARTICLE_FILE_BYTES,
  readArticleFile,
  writeArticleFile,
} from "@/lib/articles/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function describeFile(zone: Parameters<typeof readArticleFile>[0]) {
  const file = await readArticleFile(zone);
  if (!file) {
    return { exists: false as const };
  }

  let articleCount: number | null = null;
  let parseError: string | null = null;
  try {
    articleCount = parseArticlesWorkbook(file.buffer).length;
  } catch (error) {
    parseError = error instanceof Error ? error.message : "Invalid file";
  }

  return {
    exists: true as const,
    source: file.source,
    sizeBytes: file.buffer.length,
    updatedAt: file.updatedAt,
    articleCount,
    parseError,
  };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({
      zone: session.zone,
      file: await describeFile(session.zone),
    });
  } catch (error) {
    console.error("Failed to read article file info:", error);
    return NextResponse.json(
      { error: "Failed to read article file" },
      { status: 500 }
    );
  }
}

/** Upload (replace) the article workbook for the admin's own zone. */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const upload = form.get("file");

    if (!(upload instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!/\.xlsx$/i.test(upload.name)) {
      return NextResponse.json(
        { error: "Only .xlsx files are supported" },
        { status: 400 }
      );
    }
    if (upload.size === 0 || upload.size > MAX_ARTICLE_FILE_BYTES) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 10 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await upload.arrayBuffer());

    // Validate before storing so a bad file never replaces a working one.
    try {
      parseArticlesWorkbook(buffer);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid Excel file",
        },
        { status: 422 }
      );
    }

    await writeArticleFile(session.zone, buffer);

    return NextResponse.json({
      success: true,
      file: await describeFile(session.zone),
    });
  } catch (error) {
    console.error("Failed to upload article file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteArticleFile(session.zone);
    return NextResponse.json({
      success: true,
      file: await describeFile(session.zone),
    });
  } catch (error) {
    console.error("Failed to delete article file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
