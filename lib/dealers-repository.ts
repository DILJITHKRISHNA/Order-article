import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";

import type { DealerPayload } from "@/schemas/dealer-schema";
import { getWritableDataFilePath } from "@/lib/server-data-path";
import {
  createSupabaseAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { Zone } from "@/lib/zones";
import type { Dealer } from "@/types/order";

/**
 * Saved dealers per zone.
 *  - Supabase configured: `dealers` table (see supabase/schema.sql).
 *  - Otherwise: local `data/dealers.json` (dev fallback).
 */
const DEALERS_FILENAME = "dealers.json";

interface DealerRow {
  id: string;
  customer_name: string;
  shop_name: string | null;
  executive_name: string | null;
  location: string;
  phone_number: string;
}

function mapRow(row: DealerRow): Dealer {
  return {
    id: row.id,
    customerName: row.customer_name,
    shopName: row.shop_name ?? "",
    executiveName: row.executive_name ?? "",
    location: row.location,
    phoneNumber: row.phone_number,
  };
}

function clean(payload: DealerPayload): DealerPayload {
  return {
    customerName: payload.customerName.trim(),
    shopName: payload.shopName.trim(),
    executiveName: payload.executiveName.trim(),
    location: payload.location.trim(),
    phoneNumber: payload.phoneNumber.trim(),
  };
}

// --- local fallback ---------------------------------------------------------

type LocalStore = Record<string, Dealer[]>;
let memoryStore: LocalStore = {};

async function readLocal(): Promise<LocalStore> {
  const filePath = await getWritableDataFilePath(DEALERS_FILENAME);
  if (!filePath) return memoryStore;
  try {
    memoryStore = JSON.parse(await fs.readFile(filePath, "utf8")) as LocalStore;
  } catch {
    // missing or unreadable file: keep what we have in memory
  }
  return memoryStore;
}

async function writeLocal(store: LocalStore): Promise<void> {
  memoryStore = store;
  const filePath = await getWritableDataFilePath(DEALERS_FILENAME);
  if (filePath) await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

// --- public API ---------------------------------------------------------------

export async function listDealers(zone: Zone): Promise<Dealer[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await createSupabaseAdminClient()
      .from("dealers")
      .select("id, customer_name, shop_name, executive_name, location, phone_number")
      .eq("zone", zone)
      .order("shop_name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DealerRow[]).map(mapRow);
  }

  const store = await readLocal();
  return [...(store[zone] ?? [])].sort((a, b) =>
    a.shopName.localeCompare(b.shopName)
  );
}

/** Adds a dealer, or updates the saved one with the same shop + phone in this zone. */
export async function saveDealer(
  zone: Zone,
  payload: DealerPayload
): Promise<Dealer> {
  const dealer = clean(payload);

  if (isSupabaseConfigured()) {
    const { data, error } = await createSupabaseAdminClient()
      .from("dealers")
      .upsert(
        {
          zone,
          customer_name: dealer.customerName,
          shop_name: dealer.shopName,
          executive_name: dealer.executiveName,
          location: dealer.location,
          phone_number: dealer.phoneNumber,
        },
        { onConflict: "zone,shop_name,phone_number" }
      )
      .select("id, customer_name, shop_name, executive_name, location, phone_number")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as DealerRow);
  }

  const store = await readLocal();
  const list = store[zone] ?? [];
  const existing = list.find(
    (item) =>
      item.shopName === dealer.shopName &&
      item.phoneNumber === dealer.phoneNumber
  );
  const saved: Dealer = { id: existing?.id ?? randomUUID(), ...dealer };
  await writeLocal({
    ...store,
    [zone]: [...list.filter((item) => item.id !== saved.id), saved],
  });
  return saved;
}
