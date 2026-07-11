import type { SubmittedOrderRecord } from "@/types/order";
import { flattenSubmittedOrders } from "@/lib/orders-utils";
import { getSubmittedOrdersFromStorage } from "@/lib/storage";

export function getLocalSubmittedOrderRows() {
  const orders = getSubmittedOrdersFromStorage();
  return flattenSubmittedOrders(orders);
}

export function mergeSubmittedOrders(
  serverOrders: ReturnType<typeof flattenSubmittedOrders>,
  localOrders: ReturnType<typeof flattenSubmittedOrders>
) {
  const merged = new Map<string, (typeof serverOrders)[number]>();

  for (const order of [...serverOrders, ...localOrders]) {
    const key = `${order.orderNumber}-${order.article}-${order.color}-${order.size}-${order.submittedAt}`;
    merged.set(key, order);
  }

  return Array.from(merged.values());
}

export function createLocalSubmittedRecord(
  customer: SubmittedOrderRecord["customer"],
  items: SubmittedOrderRecord["items"],
  submittedAt: string
): SubmittedOrderRecord {
  return { customer, items, submittedAt };
}
