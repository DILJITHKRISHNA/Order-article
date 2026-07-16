import type {
  AdminOrderRow,
  CustomerDetails,
  OrderLineItem,
  SubmittedOrderRecord,
} from "@/types/order";
import {
  createSubmittedOrderRecord,
  dedupeOrderLineItems,
  filterOrderedItems,
} from "@/lib/orders-utils";
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
    id: row.id,
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
    sku: row.sku,
    submittedAt: row.submitted_at,
  };
}

function groupRowsIntoSubmittedOrders(
  rows: SubmittedOrderItemRow[]
): SubmittedOrderRecord[] {
  const grouped = new Map<string, SubmittedOrderRecord>();

  for (const row of rows) {
    if (row.qty <= 0) continue;

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
  const orderedItems = dedupeOrderLineItems(filterOrderedItems(items));

  const { data: existingOrder, error: existingError } = await supabase
    .from("submitted_order_items")
    .select("order_number")
    .eq("order_number", customer.orderNumber)
    .limit(1);

  if (existingError) {
    throw new Error(`Supabase duplicate check failed: ${existingError.message}`);
  }

  if ((existingOrder ?? []).length > 0) {
    throw new Error("This order has already been submitted");
  }

  const rows = orderedItems.map((item) => ({
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

  return createSubmittedOrderRecord(customer, orderedItems, submittedAt);
}

export async function clearSubmittedOrdersFromSupabase(): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("submitted_order_items")
    .delete()
    .not("order_number", "is", null);

  if (error) {
    throw new Error(`Supabase clear failed: ${error.message}`);
  }
}

export async function deleteSubmittedOrderLineFromSupabase(
  orderNumber: string,
  sku: string,
  submittedAt: string,
  id?: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  let query = supabase.from("submitted_order_items").delete();

  if (id) {
    query = query.eq("id", id);
  } else {
    query = query
      .eq("order_number", orderNumber)
      .eq("sku", sku)
      .eq("submitted_at", submittedAt);
  }

  const { data, error } = await query.select("id");

  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Order line not found");
  }
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

  const rows = ((data ?? []) as SubmittedOrderItemRow[]).filter(
    (row) => row.qty > 0
  );
  const seen = new Set<string>();

  return rows
    .filter((row) => {
      const key = `${row.order_number}-${row.sku}-${row.submitted_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(mapRowToAdminOrder);
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
