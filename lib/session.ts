import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export type SessionRole = "customer" | "staff" | "admin";
export type SessionUser = { id: number; role: SessionRole; name: string; identifier: string; exp: number };
export const SESSION_COOKIE = "galeria_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.DB_ADMIN_TOKEN;
  if (!secret) throw new Error("SESSION_SECRET or DB_ADMIN_TOKEN must be set for authentication.");
  return secret;
}
function base64url(input: string | Buffer) { return Buffer.from(input).toString("base64url"); }
function signPayload(payload: string) { return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url"); }

export function createSessionToken(user: Omit<SessionUser, "exp">) {
  const payload = base64url(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expectedSignature = signPayload(payload);
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
    if (!session?.id || !session?.role || !session?.exp) return null;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    if (!["customer", "staff", "admin"].includes(session.role)) return null;
    return session;
  } catch { return null; }
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS });
}
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("galeria_session_role");
}
