import { timingSafeEqual } from "node:crypto";

import type { Zone } from "@/lib/zones";

export type Role = "user" | "admin";

/**
 * Credentials live in env vars, per role + zone (zone id upper-cased, "-" -> "_").
 *
 * One account per zone (current setup):
 *   USER_RETAIL_EMAIL / USER_RETAIL_PASSWORD
 *   ADMIN_CHENNAI_EMAIL / ADMIN_CHENNAI_PASSWORD
 *
 * Several accounts per zone (future: many executives, one admin) - set
 * <ROLE>_<ZONE>_ACCOUNTS to a JSON array. It is used in addition to the pair above:
 *   USER_RETAIL_ACCOUNTS=[{"email":"a@x.com","password":"..."},{"email":"b@x.com","password":"..."}]
 */
interface Account {
  email: string;
  password: string;
}

function envKey(role: Role, zone: Zone, field: "EMAIL" | "PASSWORD" | "ACCOUNTS") {
  return `${role.toUpperCase()}_${zone.toUpperCase().replace(/-/g, "_")}_${field}`;
}

function getAccounts(role: Role, zone: Zone): Account[] {
  const accounts: Account[] = [];

  const email = process.env[envKey(role, zone, "EMAIL")]?.trim();
  const password = process.env[envKey(role, zone, "PASSWORD")];
  if (email && password) accounts.push({ email, password });

  const list = process.env[envKey(role, zone, "ACCOUNTS")];
  if (list) {
    try {
      const parsed: unknown = JSON.parse(list);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            item &&
            typeof item.email === "string" &&
            typeof item.password === "string" &&
            item.email.trim() &&
            item.password
          ) {
            accounts.push({ email: item.email.trim(), password: item.password });
          }
        }
      }
    } catch {
      console.error(`${envKey(role, zone, "ACCOUNTS")} is not valid JSON`);
    }
  }

  return accounts;
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

/** One shared password per zone, from <ROLE>_<ZONE>_PASSWORD (e.g. ADMIN_RETAIL_PASSWORD). */
export function verifyZonePassword(
  role: Role,
  zone: Zone,
  password: string
): boolean {
  const expected = process.env[envKey(role, zone, "PASSWORD")];

  // Missing config must never allow a login.
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}

export function verifyCredentials(
  role: Role,
  zone: Zone,
  email: string,
  password: string
): boolean {
  const givenEmail = email.trim().toLowerCase();
  let matched = false;

  // Check every account (no early exit) so timing doesn't reveal which matched.
  // No configured accounts means no login.
  for (const account of getAccounts(role, zone)) {
    const emailOk = safeEqual(givenEmail, account.email.toLowerCase());
    const passwordOk = safeEqual(password, account.password);
    if (emailOk && passwordOk) matched = true;
  }

  return matched;
}
