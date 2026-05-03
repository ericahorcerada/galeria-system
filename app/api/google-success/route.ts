import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (typeof token?.email !== "string" || !token.email) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "google_session_missing");
    return NextResponse.redirect(loginUrl);
  }

  const email = token.email;
  const name =
    typeof token.name === "string" && token.name.trim()
      ? token.name.trim()
      : email.split("@")[0];

  const sessionPayload = {
    role: "customer",
    provider: "google",
    identifier: email,
    email,
    name,
  };

  const response = NextResponse.redirect(
    new URL("/customer/dashboard", request.url)
  );

  response.cookies.set("galeria_session", JSON.stringify(sessionPayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set("galeria_user", JSON.stringify(sessionPayload), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}