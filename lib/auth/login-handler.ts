import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyCredentials, type Role } from "@/lib/auth/credentials";
import { startSession } from "@/lib/auth/session";
import { ZONES } from "@/lib/zones";

const loginSchema = z.object({
  zone: z.enum(ZONES.map((zone) => zone.id) as [string, ...string[]]),
  email: z.string().min(1),
  password: z.string().min(1),
});

/** Shared login route logic for both user and admin roles. */
export async function handleLogin(request: Request, role: Role) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Zone, email and password are required" },
        { status: 400 }
      );
    }

    const { zone, email, password } = parsed.data;
    const typedZone = zone as (typeof ZONES)[number]["id"];

    if (!verifyCredentials(role, typedZone, email, password)) {
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
