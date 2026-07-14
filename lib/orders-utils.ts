import type { CustomerDetails, OrderLineItem, SubmittedOrderRecord } from "@/types/order";

export interface OrdersDatabase {
  orders: SubmittedOrderRecord[];
}

export function filterOrderedItems(items: OrderLineItem[]): OrderLineItem[] {
  return items.filter((item) => item.qty > 0);
}

export function dedupeOrderLineItems(items: OrderLineItem[]): OrderLineItem[] {
  const seen = new Map<string, OrderLineItem>();

  for (const item of items) {
    const key = item.sku;
    const existing = seen.get(key);

    if (existing) {
      existing.qty += item.qty;
      continue;
    }

    seen.set(key, { ...item });
  }

  return Array.from(seen.values());
}

export function dedupeSubmittedOrders(
  orders: SubmittedOrderRecord[]
): SubmittedOrderRecord[] {
  const seenOrderNumbers = new Set<string>();
  const deduped: SubmittedOrderRecord[] = [];

  for (const order of orders) {
    if (seenOrderNumbers.has(order.customer.orderNumber)) continue;

    seenOrderNumbers.add(order.customer.orderNumber);
    deduped.push({
      ...order,
      items: dedupeOrderLineItems(filterOrderedItems(order.items)),
    });
  }

  return deduped;
}

export function flattenSubmittedOrders(
  orders: SubmittedOrderRecord[]
): Array<{
  orderNumber: string;
  customerName: string;
  shopName: string;
  executiveName: string;
  location: string;
  phoneNumber: string;
  article: string;
  color: string;
  size: string;
  qty: number;
  submittedAt: string;
}> {
  const rows = [];
  const seen = new Set<string>();

  for (const order of orders) {
    for (const item of order.items) {
      if (item.qty <= 0) continue;

      const key = `${order.customer.orderNumber}-${item.sku}-${order.submittedAt}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        orderNumber: order.customer.orderNumber,
        customerName: order.customer.customerName,
        shopName: order.customer.shopName,
        executiveName: order.customer.executiveName,
        location: order.customer.location,
        phoneNumber: order.customer.phoneNumber,
        article: item.article,
        color: item.color,
        size: item.size,
        qty: item.qty,
        submittedAt: order.submittedAt,
      });
    }
  }

  return rows;
}

export function createSubmittedOrderRecord(
  customer: CustomerDetails,
  items: OrderLineItem[],
  submittedAt: string
): SubmittedOrderRecord {
  return { customer, items, submittedAt };
}
