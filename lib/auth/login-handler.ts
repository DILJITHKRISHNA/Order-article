import { NextResponse } from "next/server";
import { z } from "zod";

import { LOGIN_MODES } from "@/lib/auth/config";
import {
  verifyCredentials,
  verifyZonePassword,
  type Role,
} from "@/lib/auth/credentials";
import { startSession } from "@/lib/auth/session";
import { ZONES } from "@/lib/zones";

const loginSchema = z.object({
  zone: z.enum(ZONES.map((zone) => zone.id) as [string, ...string[]]),
  email: z.string().optional().default(""),
  password: z.string().optional().default(""),
});

/** Shared login route logic for both user and admin roles. */
export async function handleLogin(request: Request, role: Role) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Zone is required" },
        { status: 400 }
      );
    }

    const { zone, email, password } = parsed.data;
    const typedZone = zone as (typeof ZONES)[number]["id"];

    const mode = LOGIN_MODES[role];

    if (mode === "zone-password" && !verifyZonePassword(role, typedZone, password)) {
      return NextResponse.json(
        { error: "Incorrect password for this zone" },
        { status: 401 }
      );
    }

    if (
      mode === "email-password" &&
      (!email || !password || !verifyCredentials(role, typedZone, email, password))
    ) {
      return NextResponse.json(
        { error: "Invalid email or password for this zone" },
        { status: 401 }
      );
    }

    await startSession(request, { role, zone: typedZone });
    return NextResponse.json({ success: true, zone: typedZone });
  } catch (error) {
    console.error(`${role} login failed:`, error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
