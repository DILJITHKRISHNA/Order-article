import { promises as fs } from "node:fs";
import path from "node:path";

import type { CustomerDetails, OrderLineItem, SubmittedOrderRecord } from "@/types/order";
import {
  createSubmittedOrderRecord,
  flattenSubmittedOrders,
  type OrdersDatabase,
} from "@/lib/orders-utils";

export const ORDERS_JSON_FILENAME = "orders.json";

function getDataDirectory(): string {
  return path.join(process.cwd(), "data");
}

function getOrdersJsonPath(): string {
  return path.join(getDataDirectory(), ORDERS_JSON_FILENAME);
}

async function ensureDataDirectory(): Promise<void> {
  await fs.mkdir(getDataDirectory(), { recursive: true });
}

async function readDatabase(): Promise<OrdersDatabase> {
  await ensureDataDirectory();

  try {
    const raw = await fs.readFile(getOrdersJsonPath(), "utf8");
    const parsed = JSON.parse(raw) as OrdersDatabase;

    if (!Array.isArray(parsed.orders)) {
      return { orders: [] };
    }

    return parsed;
  } catch {
    return { orders: [] };
  }
}

async function writeDatabase(database: OrdersDatabase): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(getOrdersJsonPath(), JSON.stringify(database, null, 2), "utf8");
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
  await ensureDataDirectory();

  try {
    return await fs.readFile(getOrdersJsonPath());
  } catch {
    await writeDatabase({ orders: [] });
    return Buffer.from(JSON.stringify({ orders: [] }, null, 2), "utf8");
  }
}
