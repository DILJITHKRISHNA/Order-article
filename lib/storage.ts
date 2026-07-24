import { savedOrderSchema } from "@/schemas/saved-order-schema";
import type {
  CustomerDetails,
  OrderRow,
  SavedOrder,
  SubmittedOrderRecord,
} from "@/types/order";

export const ORDER_STORAGE_KEY = "order-management:saved-order";
export const SUBMITTED_ORDERS_STORAGE_KEY = "order-management:submitted-orders";

export function hasCustomerDraft(customer: CustomerDetails): boolean {
  return Boolean(
    customer.customerName.trim() ||
      customer.shopName.trim() ||
      customer.executiveName.trim() ||
      customer.location.trim() ||
      customer.phoneNumber.trim()
  );
}

export function saveOrderDraft(customer: CustomerDetails, rows: OrderRow[]): void {
  saveOrderToStorage({
    customer,
    rows,
    savedAt: new Date().toISOString(),
  });
}

export function saveOrderToStorage(order: SavedOrder): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function hasSavedOrderInStorage(): boolean {
  return loadOrderFromStorage() !== null;
}

export function loadOrderFromStorage(): SavedOrder | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const result = savedOrderSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function clearOrderFromStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORDER_STORAGE_KEY);
}

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
