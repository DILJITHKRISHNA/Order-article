import type { OrdersDatabase } from "@/lib/orders-utils";

export interface OrdersStorageProvider {
  readonly name: string;
  isConfigured(): boolean;
  read(): Promise<OrdersDatabase>;
  write(database: OrdersDatabase): Promise<void>;
}

export function emptyOrdersDatabase(): OrdersDatabase {
  return { orders: [] };
}

export function parseOrdersDatabase(raw: string): OrdersDatabase {
  try {
    const parsed = JSON.parse(raw) as OrdersDatabase;
    if (!Array.isArray(parsed.orders)) {
      return emptyOrdersDatabase();
    }
    return parsed;
  } catch {
    return emptyOrdersDatabase();
  }
}
