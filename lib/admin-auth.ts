import { cookies } from "next/headers";

export const ADMIN_AUTH_COOKIE = "admin_auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_AUTH_COOKIE)?.value === "authenticated";
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "admin123";
}

export function isValidAdminPassword(password: string): boolean {
  return password.trim() === getAdminPassword();
}

export function getAdminCookieOptions(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isSecure =
    forwardedProto === "https" ||
    new URL(request.url).protocol === "https:";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export async function setAdminAuthCookie(request: Request): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_AUTH_COOKIE,
    "authenticated",
    getAdminCookieOptions(request)
  );
}

export async function clearAdminAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE);
}
