import { promises as fs } from "node:fs";

import { getWritableDataFilePath } from "@/lib/server-data-path";
import {
  emptyOrdersDatabase,
  parseOrdersDatabase,
  type OrdersStorageProvider,
} from "@/lib/storage/providers/types";
import type { OrdersDatabase } from "@/lib/orders-utils";

export const ORDERS_JSON_FILENAME = "orders.json";

const memoryDatabase: OrdersDatabase = { orders: [] };

export const localOrdersStorageProvider: OrdersStorageProvider = {
  name: "local",

  isConfigured() {
    return true;
  },

  async read() {
    const filePath = await getWritableDataFilePath(ORDERS_JSON_FILENAME);

    if (!filePath) {
      return { orders: [...memoryDatabase.orders] };
    }

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = parseOrdersDatabase(raw);
      memoryDatabase.orders = parsed.orders;
      return parsed;
    } catch {
      return { orders: [...memoryDatabase.orders] };
    }
  },

  async write(database: OrdersDatabase) {
    memoryDatabase.orders = database.orders;

    const filePath = await getWritableDataFilePath(ORDERS_JSON_FILENAME);
    if (!filePath) return;

    try {
      await fs.writeFile(filePath, JSON.stringify(database, null, 2), "utf8");
    } catch (error) {
      console.error("Failed to persist orders to local disk:", error);
      throw error;
    }
  },
};

export function getLocalOrdersJsonBuffer(database: OrdersDatabase): Buffer {
  return Buffer.from(JSON.stringify(database ?? emptyOrdersDatabase(), null, 2), "utf8");
}
