import { NextResponse } from "next/server";

import {
  getActiveStorageName,
  isCloudStorageEnabled,
} from "@/lib/orders-repository";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    provider: getActiveStorageName(),
    cloudEnabled: isCloudStorageEnabled(),
    supabaseConfigured: isSupabaseConfigured(),
  });
}
