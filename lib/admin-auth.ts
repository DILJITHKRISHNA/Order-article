import { getSession, type Session } from "@/lib/auth/session";

/** Returns the admin session (including its zone) or null when not logged in. */
export async function getAdminSession(): Promise<Session | null> {
  return getSession("admin");
}
