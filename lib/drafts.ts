import { ORDER_STORAGE_KEY } from "@/lib/storage";
import { savedOrderSchema } from "@/schemas/saved-order-schema";
import type { CustomerDetails, OrderRow, SavedOrder } from "@/types/order";
import type { Zone } from "@/lib/zones";

/**
 * Unsubmitted orders ("drafts"), kept in this browser.
 * One list per zone, one draft per order (keyed by its order number), so
 * starting an order for another shop never overwrites an unfinished one.
 */
const DRAFTS_KEY_PREFIX = "order-management:drafts:";
const LEGACY_LAST_ZONE_KEY = "order-management:last-zone";
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRAFTS_PER_ZONE = 20;

export type OrderDraft = SavedOrder;

function storageKey(zone: Zone): string {
  return `${DRAFTS_KEY_PREFIX}${zone}`;
}

/** Imports the old single-slot draft into the zone it belonged to, once. */
function migrateLegacyDraft(zone: Zone, drafts: OrderDraft[]): OrderDraft[] {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return drafts;
    if (localStorage.getItem(LEGACY_LAST_ZONE_KEY) !== zone) return drafts;

    localStorage.removeItem(ORDER_STORAGE_KEY);
    const parsed = savedOrderSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return drafts;
    const legacy = parsed.data;
    if (drafts.some((d) => d.customer.orderNumber === legacy.customer.orderNumber)) {
      return drafts;
    }
    return [legacy, ...drafts];
  } catch {
    return drafts;
  }
}

function writeDrafts(zone: Zone, drafts: OrderDraft[]): void {
  try {
    if (drafts.length === 0) {
      localStorage.removeItem(storageKey(zone));
      return;
    }
    localStorage.setItem(storageKey(zone), JSON.stringify(drafts));
  } catch {
    // Storage full or blocked: drafts are best-effort.
  }
}

/** Unexpired drafts for the zone, newest first. */
export function listDrafts(zone: Zone): OrderDraft[] {
  if (typeof window === "undefined") return [];

  let drafts: OrderDraft[] = [];
  try {
    const raw = localStorage.getItem(storageKey(zone));
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        drafts = parsed.flatMap((item) => {
          const result = savedOrderSchema.safeParse(item);
          return result.success ? [result.data] : [];
        });
      }
    }
  } catch {
    drafts = [];
  }

  drafts = migrateLegacyDraft(zone, drafts);

  const cutoff = Date.now() - MAX_DRAFT_AGE_MS;
  return drafts
    .filter((draft) => new Date(draft.savedAt).getTime() >= cutoff)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Saves the order in progress, or removes its draft once it has nothing worth keeping. */
export function upsertDraft(
  zone: Zone,
  customer: CustomerDetails,
  rows: OrderRow[]
): void {
  if (typeof window === "undefined") return;

  const others = listDrafts(zone).filter(
    (draft) => draft.customer.orderNumber !== customer.orderNumber
  );

  if (rows.length === 0 && !customer.shopName.trim()) {
    writeDrafts(zone, others);
    return;
  }

  const draft: OrderDraft = {
    customer,
    rows,
    savedAt: new Date().toISOString(),
  };
  writeDrafts(zone, [draft, ...others].slice(0, MAX_DRAFTS_PER_ZONE));
}

export function deleteDraft(zone: Zone, orderNumber: string): void {
  if (typeof window === "undefined") return;
  writeDrafts(
    zone,
    listDrafts(zone).filter((draft) => draft.customer.orderNumber !== orderNumber)
  );
}

/** Other unsubmitted orders whose shop name matches what is being typed. */
export function findDraftsForShop(
  drafts: OrderDraft[],
  shopName: string,
  excludeOrderNumber: string
): OrderDraft[] {
  const query = shopName.trim().toLowerCase();
  if (!query) return [];
  return drafts.filter(
    (draft) =>
      draft.customer.orderNumber !== excludeOrderNumber &&
      draft.customer.shopName.toLowerCase().includes(query)
  );
}
