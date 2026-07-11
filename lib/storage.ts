import type { SavedOrder } from "@/types/order";

export const ORDER_STORAGE_KEY = "order-management:saved-order";

export function saveOrderToStorage(order: SavedOrder): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function loadOrderFromStorage(): SavedOrder | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SavedOrder;
  } catch {
    return null;
  }
}

export function clearOrderFromStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORDER_STORAGE_KEY);
}
