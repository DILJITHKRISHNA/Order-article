import type {
  AdminOrderRow,
  CustomerDetails,
  OrderLineItem,
  SubmittedOrderRecord,
} from "@/types/order";
import { createSubmittedOrderRecord } from "@/lib/orders-utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface SubmittedOrderItemRow {
  id: string;
  order_number: string;
  customer_name: string;
  shop_name: string | null;
  executive_name: string | null;
  location: string;
  phone_number: string;
  article: string;
  color: string;
  size: string;
  qty: number;
  sku: string;
  submitted_at: string;
}

function mapRowToAdminOrder(row: SubmittedOrderItemRow): AdminOrderRow {
  return {
    orderNumber: row.order_number,
    customerName: row.customer_name,
    shopName: row.shop_name ?? "",
    executiveName: row.executive_name ?? "",
    location: row.location,
    phoneNumber: row.phone_number,
    article: row.article,
    color: row.color,
    size: row.size,
    qty: row.qty,
    submittedAt: row.submitted_at,
  };
}

function groupRowsIntoSubmittedOrders(
  rows: SubmittedOrderItemRow[]
): SubmittedOrderRecord[] {
  const grouped = new Map<string, SubmittedOrderRecord>();

  for (const row of rows) {
    const key = `${row.order_number}-${row.submitted_at}`;
    const existing = grouped.get(key);

    const item: OrderLineItem = {
      article: row.article,
      color: row.color,
      size: row.size,
      qty: row.qty,
      sku: row.sku,
    };

    if (existing) {
      existing.items.push(item);
      continue;
    }

    grouped.set(
      key,
      createSubmittedOrderRecord(
        {
          orderNumber: row.order_number,
          customerName: row.customer_name,
          shopName: row.shop_name ?? "",
          executiveName: row.executive_name ?? "",
          location: row.location,
          phoneNumber: row.phone_number,
        },
        [item],
        row.submitted_at
      )
    );
  }

  return Array.from(grouped.values());
}

export async function appendSubmittedOrderToSupabase(
  customer: CustomerDetails,
  items: OrderLineItem[],
  submittedAt: string
): Promise<SubmittedOrderRecord> {
  const supabase = createSupabaseAdminClient();

  const rows = items.map((item) => ({
    order_number: customer.orderNumber,
    customer_name: customer.customerName,
    shop_name: customer.shopName,
    executive_name: customer.executiveName,
    location: customer.location,
    phone_number: customer.phoneNumber,
    article: item.article,
    color: item.color,
    size: item.size,
    qty: item.qty,
    sku: item.sku,
    submitted_at: submittedAt,
  }));

  const { error } = await supabase.from("submitted_order_items").insert(rows);

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return createSubmittedOrderRecord(customer, items, submittedAt);
}

export async function readSubmittedOrderRowsFromSupabase(): Promise<AdminOrderRow[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("submitted_order_items")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase read failed: ${error.message}`);
  }

  return ((data ?? []) as SubmittedOrderItemRow[]).map(mapRowToAdminOrder);
}

export async function readSubmittedOrdersFromSupabase(): Promise<SubmittedOrderRecord[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("submitted_order_items")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase read failed: ${error.message}`);
  }

  return groupRowsIntoSubmittedOrders((data ?? []) as SubmittedOrderItemRow[]);
}
