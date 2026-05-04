import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3001";
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    path: "/",
    maxAge: 0,
  });
}

function clearAuthCookies(response: NextResponse) {
  clearCookie(response, "galeria_session");
  clearCookie(response, "galeria_session_role");
  clearCookie(response, "galeria_user");

  clearCookie(response, "next-auth.session-token");
  clearCookie(response, "__Secure-next-auth.session-token");
  clearCookie(response, "next-auth.callback-url");
  clearCookie(response, "__Secure-next-auth.callback-url");
  clearCookie(response, "next-auth.csrf-token");
  clearCookie(response, "__Host-next-auth.csrf-token");
}

export async function GET() {
  const response = NextResponse.redirect(new URL("/login", getBaseUrl()));

  clearAuthCookies(response);

  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });

  clearAuthCookies(response);

  return response;
}