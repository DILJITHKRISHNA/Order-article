import type { SubmittedOrderRecord } from "@/types/order";

/** Legacy single-slot draft key; only read once to migrate (see lib/drafts.ts). */
export const ORDER_STORAGE_KEY = "order-management:saved-order";
export const SUBMITTED_ORDERS_STORAGE_KEY = "order-management:submitted-orders";

export function saveSubmittedOrderToStorage(order: SubmittedOrderRecord): void {
  if (typeof window === "undefined") return;

  const existing = getSubmittedOrdersFromStorage();
  localStorage.setItem(
    SUBMITTED_ORDERS_STORAGE_KEY,
    JSON.stringify([...existing, order])
  );
}

export function getSubmittedOrdersFromStorage(): SubmittedOrderRecord[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(SUBMITTED_ORDERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SubmittedOrderRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
