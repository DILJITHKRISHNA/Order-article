import { NextResponse } from "next/server";

import {
  getActiveStorageName,
  isCloudStorageEnabled,
} from "@/lib/orders-repository";
import {
  isSupabaseConfigured,
  testSupabaseConnection,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  const connection = supabaseConfigured
    ? await testSupabaseConnection()
    : { ok: false, message: "Supabase environment variables are not set" };

  return NextResponse.json({
    provider: getActiveStorageName(),
    cloudEnabled: isCloudStorageEnabled(),
    supabaseConfigured,
    supabaseConnected: connection.ok,
    supabaseMessage: connection.message,
  });
}
