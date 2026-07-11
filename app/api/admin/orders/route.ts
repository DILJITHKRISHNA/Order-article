import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readAdminOrders } from "@/lib/admin-orders-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await readAdminOrders();
    const uniqueOrderNumbers = new Set(orders.map((order) => order.orderNumber));

    return NextResponse.json({
      orders,
      totalLineItems: orders.length,
      totalOrders: uniqueOrderNumbers.size,
    });
  } catch (error) {
    console.error("Failed to read admin orders:", error);
    return NextResponse.json(
      { error: "Failed to read orders" },
      { status: 500 }
    );
  }
}
