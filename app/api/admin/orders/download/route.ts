import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  ADMIN_ORDERS_FILENAME,
  getAdminOrdersFileBuffer,
} from "@/lib/admin-orders-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const buffer = await getAdminOrdersFileBuffer(session.zone);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${session.zone}-${ADMIN_ORDERS_FILENAME}"`,
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
