import { createClient } from "@supabase/supabase-js";

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Supabase environment variables are not set",
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("submitted_order_items")
      .select("id", { count: "exact", head: true });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return { ok: true, message: "Connected" };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to connect to Supabase",
    };
  }
}
