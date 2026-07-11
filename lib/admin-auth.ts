import { cookies } from "next/headers";

export const ADMIN_AUTH_COOKIE = "admin_auth";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "admin123";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_AUTH_COOKIE)?.value === "authenticated";
}

export function isValidAdminPassword(password: string): boolean {
  return password === getAdminPassword();
}
