import { NextResponse } from "next/server";
import { z } from "zod";

import { syncAdminOrdersExcel, readAdminOrders } from "@/lib/admin-orders-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteSubmittedOrderLine } from "@/lib/orders-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteOrderLineSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().min(1),
  sku: z.string().min(1),
  submittedAt: z.string().min(1),
});

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

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deleteOrderLineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid delete request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await deleteSubmittedOrderLine(
      parsed.data.orderNumber,
      parsed.data.sku,
      parsed.data.submittedAt,
      parsed.data.id
    );

    await syncAdminOrdersExcel();

    const orders = await readAdminOrders();
    const uniqueOrderNumbers = new Set(orders.map((order) => order.orderNumber));

    return NextResponse.json({
      success: true,
      orders,
      totalLineItems: orders.length,
      totalOrders: uniqueOrderNumbers.size,
    });
  } catch (error) {
    console.error("Failed to delete admin order line:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete order line",
      },
      { status: 500 }
    );
  }
}
