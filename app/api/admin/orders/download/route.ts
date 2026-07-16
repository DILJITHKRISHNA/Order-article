import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  ADMIN_ORDERS_FILENAME,
  getAdminOrdersFileBuffer,
} from "@/lib/admin-orders-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const buffer = await getAdminOrdersFileBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${ADMIN_ORDERS_FILENAME}"`,
      },
    });
  } catch (error) {
    console.error("Failed to download admin orders:", error);
    return NextResponse.json(
      { error: "Failed to download orders file" },
      { status: 500 }
    );
  }
}
