import type { CustomerDetails, OrderLineItem, SubmittedOrderRecord } from "@/types/order";

export interface OrdersDatabase {
  orders: SubmittedOrderRecord[];
}

export function filterOrderedItems(items: OrderLineItem[]): OrderLineItem[] {
  return items.filter((item) => item.qty > 0);
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

  for (const order of orders) {
    for (const item of order.items) {
      if (item.qty <= 0) continue;

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
