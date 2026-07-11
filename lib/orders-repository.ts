import { promises as fs } from "node:fs";

import type { CustomerDetails, OrderLineItem, SubmittedOrderRecord } from "@/types/order";
import { getWritableDataFilePath } from "@/lib/server-data-path";
import {
  createSubmittedOrderRecord,
  flattenSubmittedOrders,
  type OrdersDatabase,
} from "@/lib/orders-utils";

export const ORDERS_JSON_FILENAME = "orders.json";

const memoryDatabase: OrdersDatabase = { orders: [] };

async function readDatabase(): Promise<OrdersDatabase> {
  const filePath = await getWritableDataFilePath(ORDERS_JSON_FILENAME);

  if (!filePath) {
    return { orders: [...memoryDatabase.orders] };
  }

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as OrdersDatabase;

    if (!Array.isArray(parsed.orders)) {
      return { orders: [...memoryDatabase.orders] };
    }

    memoryDatabase.orders = parsed.orders;
    return parsed;
  } catch {
    return { orders: [...memoryDatabase.orders] };
  }
}

async function writeDatabase(database: OrdersDatabase): Promise<void> {
  memoryDatabase.orders = database.orders;

  const filePath = await getWritableDataFilePath(ORDERS_JSON_FILENAME);
  if (!filePath) return;

  try {
    await fs.writeFile(filePath, JSON.stringify(database, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to persist orders to disk:", error);
  }
}

export async function appendSubmittedOrder(
  customer: CustomerDetails,
  items: OrderLineItem[],
  submittedAt: string
): Promise<SubmittedOrderRecord> {
  const database = await readDatabase();
  const record = createSubmittedOrderRecord(customer, items, submittedAt);

  database.orders.push(record);
  await writeDatabase(database);

  return record;
}

export async function readSubmittedOrders(): Promise<SubmittedOrderRecord[]> {
  const database = await readDatabase();
  return database.orders;
}

export async function readSubmittedOrderRows() {
  const orders = await readSubmittedOrders();
  return flattenSubmittedOrders(orders);
}

export async function readOrdersJsonBuffer(): Promise<Buffer> {
  const database = await readDatabase();
  const filePath = await getWritableDataFilePath(ORDERS_JSON_FILENAME);

  if (filePath) {
    try {
      return await fs.readFile(filePath);
    } catch {
      // fall through to in-memory buffer
    }
  }

  return Buffer.from(JSON.stringify(database, null, 2), "utf8");
}
