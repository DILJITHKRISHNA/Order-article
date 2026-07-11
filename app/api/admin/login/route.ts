import { NextResponse } from "next/server";

import {
  ADMIN_AUTH_COOKIE,
  getAdminCookieOptions,
  isValidAdminPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };

    if (!body.password || !isValidAdminPassword(body.password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      ADMIN_AUTH_COOKIE,
      "authenticated",
      getAdminCookieOptions(request)
    );

    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
