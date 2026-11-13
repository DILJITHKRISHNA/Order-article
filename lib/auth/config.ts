import type { Role } from "@/lib/auth/credentials";

/**
 * How each side signs in. Used by both the server and the UI.
 *  - "zone":           choose a zone only
 *  - "zone-password":  zone + the zone's single shared password
 *                      (env var <ROLE>_<ZONE>_PASSWORD, e.g. ADMIN_RETAIL_PASSWORD)
 *  - "email-password": zone + email + password (see lib/auth/credentials.ts)
 */
export type LoginMode = "zone" | "zone-password" | "email-password";

export const LOGIN_MODES: Record<Role, LoginMode> = {
  user: "zone",
  admin: "zone-password",
};
