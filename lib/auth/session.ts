import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import type { Role } from "@/lib/auth/credentials";
import { isZone, type Zone } from "@/lib/zones";

export interface Session {
  role: Role;
  zone: Zone;
}

interface TokenPayload extends Session {
  exp: number;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const COOKIE_NAMES: Record<Role, string> = {
  user: "user_session",
  admin: "admin_session",
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters) in the environment");
  }
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function createToken(session: Session): string {
  const payload: TokenPayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verifyToken(token: string, role: Role): Session | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as Partial<TokenPayload>;

    if (
      payload.role !== role ||
      !isZone(payload.zone) ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { role: payload.role, zone: payload.zone };
  } catch {
    return null;
  }
}

function isSecureRequest(request: Request): boolean {
  return (
    request.headers.get("x-forwarded-proto") === "https" ||
    new URL(request.url).protocol === "https:"
  );
}

export async function getSession(role: Role): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES[role])?.value;
  if (!token) return null;
  return verifyToken(token, role);
}

export async function startSession(
  request: Request,
  session: Session
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES[session.role], createToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession(role: Role): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES[role]);
}
