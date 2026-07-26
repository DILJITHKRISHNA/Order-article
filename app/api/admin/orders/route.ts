import { NextResponse } from "next/server";
import { z } from "zod";

import { syncAdminOrdersExcel } from "@/lib/admin-orders-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  deleteSubmittedOrderLine,
  readSubmittedOrderRowsPage,
} from "@/lib/orders-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteOrderLineSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().min(1),
  sku: z.string().min(1),
  submittedAt: z.string().min(1),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

function parsePagination(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(
    searchParams.get("pageSize") ?? String(DEFAULT_ADMIN_PAGE_SIZE)
  );

  return {
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : DEFAULT_ADMIN_PAGE_SIZE,
  };
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { page, pageSize } = parsePagination(
      new URL(request.url).searchParams
    );
    const result = await readSubmittedOrderRowsPage(page, pageSize);

    return NextResponse.json(result);
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

    const result = await readSubmittedOrderRowsPage(
      parsed.data.page ?? 1,
      parsed.data.pageSize ?? DEFAULT_ADMIN_PAGE_SIZE
    );

    return NextResponse.json({
      success: true,
      ...result,
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
