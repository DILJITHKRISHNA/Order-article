import type { AdminOrderRow, CustomerDetails, OrderLineItem, SubmittedOrderRecord } from "@/types/order";
import {
  createSubmittedOrderRecord,
  dedupeOrderLineItems,
  dedupeSubmittedOrders,
  filterOrderedItems,
  flattenSubmittedOrders,
  type OrdersDatabase,
} from "@/lib/orders-utils";
import {
  appendSubmittedOrderToSupabase,
  clearSubmittedOrdersFromSupabase,
  countSubmittedOrderItemsInSupabase,
  countUniqueOrdersInSupabase,
  deleteSubmittedOrderLineFromSupabase,
  readSubmittedOrderRowsFromSupabase,
  readSubmittedOrderRowsPageFromSupabase,
  readSubmittedOrdersFromSupabase,
} from "@/lib/supabase/orders-db";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { DEFAULT_ZONE, type Zone } from "@/lib/zones";
import {
  getLocalOrdersJsonBuffer,
  ORDERS_JSON_FILENAME,
  localOrdersStorageProvider,
} from "@/lib/storage/providers/local-storage";

export { ORDERS_JSON_FILENAME };

export const DEFAULT_ADMIN_PAGE_SIZE = 50;

export interface AdminOrdersPageResult {
  orders: AdminOrderRow[];
  totalLineItems: number;
  totalOrders: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Legacy local records have no zone; they belong to the default zone. */
function belongsToZone(order: SubmittedOrderRecord, zone: Zone): boolean {
  return (order.zone ?? DEFAULT_ZONE) === zone;
}

function paginateRows(
  rows: AdminOrderRow[],
  page: number,
  pageSize: number
): AdminOrdersPageResult {
  const totalLineItems = rows.length;
  const totalOrders = new Set(rows.map((row) => row.orderNumber)).size;
  const totalPages = Math.max(1, Math.ceil(totalLineItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    orders: rows.slice(start, start + pageSize),
    totalLineItems,
    totalOrders,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function getActiveStorageName(): "supabase" | "local" {
  return isSupabaseConfigured() ? "supabase" : "local";
}

export function isCloudStorageEnabled(): boolean {
  return isSupabaseConfigured();
}

async function readLocalDatabase(): Promise<OrdersDatabase> {
  return localOrdersStorageProvider.read();
}

async function writeLocalDatabase(database: OrdersDatabase): Promise<void> {
  await localOrdersStorageProvider.write(database);
}

export async function appendSubmittedOrder(
  customer: CustomerDetails,
  items: OrderLineItem[],
  submittedAt: string,
  zone: Zone
): Promise<SubmittedOrderRecord> {
  const orderedItems = dedupeOrderLineItems(filterOrderedItems(items));

  if (orderedItems.length === 0) {
    throw new Error("Order must include at least one item with quantity greater than zero");
  }

  if (isSupabaseConfigured()) {
    return appendSubmittedOrderToSupabase(
      customer,
      orderedItems,
      submittedAt,
      zone
    );
  }

  const database = await readLocalDatabase();

  if (
    database.orders.some(
      (order) => order.customer.orderNumber === customer.orderNumber
    )
  ) {
    throw new Error("This order has already been submitted");
  }

  const record = createSubmittedOrderRecord(
    customer,
    orderedItems,
    submittedAt,
    zone
  );

  database.orders.push(record);
  await writeLocalDatabase(database);

  return record;
}

export async function deleteSubmittedOrderLine(
  orderNumber: string,
  sku: string,
  submittedAt: string,
  zone: Zone,
  id?: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteSubmittedOrderLineFromSupabase(
      orderNumber,
      sku,
      submittedAt,
      zone,
      id
    );
    return;
  }

  const database = await readLocalDatabase();
  let found = false;

  const nextOrders = database.orders
    .map((order) => {
      if (
        !belongsToZone(order, zone) ||
        order.customer.orderNumber !== orderNumber ||
        order.submittedAt !== submittedAt
      ) {
        return order;
      }

      const items = order.items.filter((item) => item.sku !== sku);
      if (items.length < order.items.length) {
        found = true;
      }

      if (items.length === 0) {
        return null;
      }

      return { ...order, items };
    })
    .filter((order): order is SubmittedOrderRecord => order !== null);

  if (!found) {
    throw new Error("Order line not found");
  }

  await writeLocalDatabase({ orders: nextOrders });
}

export async function clearSubmittedOrders(zone: Zone): Promise<void> {
  if (isSupabaseConfigured()) {
    await clearSubmittedOrdersFromSupabase(zone);
    return;
  }

  const database = await readLocalDatabase();
  await writeLocalDatabase({
    orders: database.orders.filter((order) => !belongsToZone(order, zone)),
  });
}

export async function readSubmittedOrders(
  zone: Zone
): Promise<SubmittedOrderRecord[]> {
  if (isSupabaseConfigured()) {
    return dedupeSubmittedOrders(await readSubmittedOrdersFromSupabase(zone));
  }

  const database = await readLocalDatabase();
  return dedupeSubmittedOrders(
    database.orders.filter((order) => belongsToZone(order, zone))
  );
}

export async function readSubmittedOrderRows(zone: Zone) {
  if (isSupabaseConfigured()) {
    return readSubmittedOrderRowsFromSupabase(zone);
  }

  const orders = await readSubmittedOrders(zone);
  return flattenSubmittedOrders(orders);
}

export async function readSubmittedOrderRowsPage(
  zone: Zone,
  page: number,
  pageSize: number = DEFAULT_ADMIN_PAGE_SIZE
): Promise<AdminOrdersPageResult> {
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  if (isSupabaseConfigured()) {
    const totalLineItems = await countSubmittedOrderItemsInSupabase(zone);
    const totalOrders = await countUniqueOrdersInSupabase(zone);
    const totalPages = Math.max(1, Math.ceil(totalLineItems / safePageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const orders = await readSubmittedOrderRowsPageFromSupabase(
      safePage,
      safePageSize,
      zone
    );

    return {
      orders,
      totalLineItems,
      totalOrders,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    };
  }

  const allRows = flattenSubmittedOrders(await readSubmittedOrders(zone));
  return paginateRows(allRows, page, safePageSize);
}

export async function readOrdersJsonBuffer(zone: Zone): Promise<Buffer> {
  const database = isSupabaseConfigured()
    ? { orders: await readSubmittedOrdersFromSupabase(zone) }
    : await readLocalDatabase();

  return getLocalOrdersJsonBuffer(database);
}
