import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_FETCH_BATCH_SIZE = 1000;

export async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  options?: {
    select?: string;
    orderBy?: string;
    ascending?: boolean;
  }
): Promise<T[]> {
  const select = options?.select ?? "*";
  const orderBy = options?.orderBy ?? "submitted_at";
  const ascending = options?.ascending ?? false;

  const all: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order(orderBy, { ascending })
      .range(from, from + SUPABASE_FETCH_BATCH_SIZE - 1);

    if (error) {
      throw new Error(`Supabase read failed: ${error.message}`);
    }

    const batch = (data ?? []) as unknown as T[];
    all.push(...batch);

    if (batch.length < SUPABASE_FETCH_BATCH_SIZE) {
      break;
    }

    from += SUPABASE_FETCH_BATCH_SIZE;
  }

  return all;
}
