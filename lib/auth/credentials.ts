import { timingSafeEqual } from "node:crypto";

import type { Zone } from "@/lib/zones";

export type Role = "user" | "admin";

/**
 * Credentials are fixed per role + zone and live in env vars:
 *   USER_KERALA_EMAIL / USER_KERALA_PASSWORD
 *   ADMIN_TAMIL_NADU_EMAIL / ADMIN_TAMIL_NADU_PASSWORD  (zone id upper-cased, "-" -> "_")
 */
function envKey(role: Role, zone: Zone, field: "EMAIL" | "PASSWORD") {
  return `${role.toUpperCase()}_${zone.toUpperCase().replace(/-/g, "_")}_${field}`;
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    // Still run a comparison so timing does not reveal length mismatches.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

export function verifyCredentials(
  role: Role,
  zone: Zone,
  email: string,
  password: string
): boolean {
  const expectedEmail = process.env[envKey(role, zone, "EMAIL")]?.trim();
  const expectedPassword = process.env[envKey(role, zone, "PASSWORD")];

  // Missing config must never allow a login.
  if (!expectedEmail || !expectedPassword) return false;

  const emailOk = safeEqual(
    email.trim().toLowerCase(),
    expectedEmail.toLowerCase()
  );
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}
