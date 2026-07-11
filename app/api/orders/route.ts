import { NextResponse } from "next/server";

import { appendOrderToAdminExcel } from "@/lib/admin-orders-store";
import { submitOrderSchema } from "@/schemas/submit-order-schema";

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

    await appendOrderToAdminExcel(
      parsed.data.customer,
      parsed.data.items,
      submittedAt
    );

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
