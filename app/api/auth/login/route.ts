import { handleLogin } from "@/lib/auth/login-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleLogin(request, "user");
}
