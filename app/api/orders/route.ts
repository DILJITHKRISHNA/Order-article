import { NextResponse } from "next/server";

import { syncAdminOrdersExcel } from "@/lib/admin-orders-store";
import { appendSubmittedOrder } from "@/lib/orders-repository";
import { submitOrderSchema } from "@/schemas/submit-order-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();

    await appendSubmittedOrder(
      parsed.data.customer,
      parsed.data.items,
      submittedAt
    );

    try {
      await syncAdminOrdersExcel();
    } catch (excelError) {
      console.error("Failed to sync admin Excel file:", excelError);
    }

    return NextResponse.json({
      success: true,
      orderNumber: parsed.data.customer.orderNumber,
      submittedAt,
    });
  } catch (error) {
    console.error("Failed to submit order:", error);
    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 }
    );
  }
}
