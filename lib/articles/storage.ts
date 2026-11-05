import { promises as fs } from "node:fs";
import path from "node:path";

import { getWritableDataFilePath } from "@/lib/server-data-path";
import {
  createSupabaseAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { Zone } from "@/lib/zones";

/**
 * Per-zone article workbook storage.
 *  - Supabase configured: private Storage bucket, one object per zone.
 *  - Otherwise: local `data/articles/<zone>.xlsx` (dev fallback).
 * Kerala falls back to the bundled public/data/size12.xlsx until an admin uploads one.
 */
export const ARTICLES_BUCKET = "article-sheets";
export const MAX_ARTICLE_FILE_BYTES = 10 * 1024 * 1024;

const LEGACY_DEFAULT_FILES: Partial<Record<Zone, string>> = {
  kerala: path.join(process.cwd(), "public", "data", "size12.xlsx"),
};

export interface StoredArticleFile {
  buffer: Buffer;
  source: "uploaded" | "default";
  updatedAt: string | null;
}

function objectPath(zone: Zone): string {
  return `${zone}/articles.xlsx`;
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.createBucket(ARTICLES_BUCKET, {
    public: false,
    fileSizeLimit: MAX_ARTICLE_FILE_BYTES,
  });

  // "already exists" is the normal case after the first call.
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`Could not prepare storage bucket: ${error.message}`);
  }
  return supabase;
}

async function readUploaded(zone: Zone): Promise<StoredArticleFile | null> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(ARTICLES_BUCKET)
      .download(objectPath(zone));

    if (error || !data) return null;

    const { data: files } = await supabase.storage
      .from(ARTICLES_BUCKET)
      .list(zone, { search: "articles.xlsx", limit: 1 });

    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      source: "uploaded",
      updatedAt: files?.[0]?.updated_at ?? null,
    };
  }

  const filePath = await getWritableDataFilePath(path.join("articles", `${zone}.xlsx`));
  if (!filePath) return null;

  try {
    const [buffer, stat] = await Promise.all([
      fs.readFile(filePath),
      fs.stat(filePath),
    ]);
    return { buffer, source: "uploaded", updatedAt: stat.mtime.toISOString() };
  } catch {
    return null;
  }
}

export async function readArticleFile(
  zone: Zone
): Promise<StoredArticleFile | null> {
  const uploaded = await readUploaded(zone);
  if (uploaded) return uploaded;

  const defaultPath = LEGACY_DEFAULT_FILES[zone];
  if (!defaultPath) return null;

  try {
    return {
      buffer: await fs.readFile(defaultPath),
      source: "default",
      updatedAt: null,
    };
  } catch {
    return null;
  }
}

export async function writeArticleFile(
  zone: Zone,
  buffer: Buffer
): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await ensureBucket();
    const { error } = await supabase.storage
      .from(ARTICLES_BUCKET)
      .upload(objectPath(zone), buffer, {
        upsert: true,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return;
  }

  const dir = await getWritableDataFilePath("articles");
  if (!dir) throw new Error("No writable storage available for article files");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${zone}.xlsx`), buffer);
}

/** Removes the zone's uploaded file. The Kerala bundled default is never deleted. */
export async function deleteArticleFile(zone: Zone): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(ARTICLES_BUCKET)
      .remove([objectPath(zone)]);
    if (error) throw new Error(`Delete failed: ${error.message}`);
    return;
  }

  const dir = await getWritableDataFilePath("articles");
  if (!dir) return;
  await fs.rm(path.join(dir, `${zone}.xlsx`), { force: true });
}
