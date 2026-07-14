import type { CustomerDetails, OrderLineItem, SubmittedOrderRecord } from "@/types/order";
import {
  createSubmittedOrderRecord,
  filterOrderedItems,
  flattenSubmittedOrders,
  type OrdersDatabase,
} from "@/lib/orders-utils";
import {
  appendSubmittedOrderToSupabase,
  readSubmittedOrderRowsFromSupabase,
  readSubmittedOrdersFromSupabase,
} from "@/lib/supabase/orders-db";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getLocalOrdersJsonBuffer,
  ORDERS_JSON_FILENAME,
  localOrdersStorageProvider,
} from "@/lib/storage/providers/local-storage";

export { ORDERS_JSON_FILENAME };

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
  submittedAt: string
): Promise<SubmittedOrderRecord> {
  const orderedItems = filterOrderedItems(items);

  if (orderedItems.length === 0) {
    throw new Error("Order must include at least one item with quantity greater than zero");
  }

  if (isSupabaseConfigured()) {
    return appendSubmittedOrderToSupabase(customer, orderedItems, submittedAt);
  }

  const database = await readLocalDatabase();
  const record = createSubmittedOrderRecord(customer, orderedItems, submittedAt);

  database.orders.push(record);
  await writeLocalDatabase(database);

  return record;
}

export async function readSubmittedOrders(): Promise<SubmittedOrderRecord[]> {
  if (isSupabaseConfigured()) {
    return readSubmittedOrdersFromSupabase();
  }

  const database = await readLocalDatabase();
  return database.orders;
}

export async function readSubmittedOrderRows() {
  if (isSupabaseConfigured()) {
    return readSubmittedOrderRowsFromSupabase();
  }

  const orders = await readSubmittedOrders();
  return flattenSubmittedOrders(orders);
}

export async function readOrdersJsonBuffer(): Promise<Buffer> {
  const database = isSupabaseConfigured()
    ? { orders: await readSubmittedOrdersFromSupabase() }
    : await readLocalDatabase();

  return getLocalOrdersJsonBuffer(database);
}
