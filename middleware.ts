import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "galeria_session";

type SessionPayload = {
  id: number;
  role: "customer" | "staff" | "admin";
  exp: number;
};

function getSecret() {
  return process.env.SESSION_SECRET || process.env.DB_ADMIN_TOKEN || "";
}

function base64urlToBytes(input: string) {
  const base64 = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const bytes = new Uint8Array(signature);
  let output = "";

  bytes.forEach((byte) => {
    output += String.fromCharCode(byte);
  });

  return btoa(output)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function verifySession(token: string | undefined) {
  if (!token) {
    return null;
  }

  const secret = getSecret();

  if (!secret) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await sign(payload, secret);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const decoded = new TextDecoder().decode(base64urlToBytes(payload));
    const session = JSON.parse(decoded) as SessionPayload;

    if (!session.id || !session.role || !session.exp) {
      return null;
    }

    if (session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isStaffRoute = pathname.startsWith("/staff");

  /*
    IMPORTANT:
    Do NOT protect /customer/dashboard here.
    Google login already redirects to /customer/dashboard.
    If middleware blocks it, Google login loops back to /login.
  */
  if (!isAdminRoute && !isStaffRoute) {
    return NextResponse.next();
  }

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  const isAuthorized = isAdminRoute
    ? session?.role === "admin"
    : session?.role === "admin" || session?.role === "staff";

  if (isAuthorized) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete("galeria_session_role");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};