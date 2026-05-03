import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = [
  "/",
  "/about",
  "/artists",
  "/artwork",
  "/cart",
  "/collections",
  "/feedback",
  "/inventory",
  "/login",
  "/profile",
  "/sale",
  "/shop",
];

const publicApiRoutes = [
  "/api/about",
  "/api/artists",
  "/api/artists-page",
  "/api/artworks",
  "/api/auth",
  "/api/collections",
  "/api/feedback",
  "/api/google-success",
  "/api/homepage",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function isPublicApiRoute(pathname: string) {
  return publicApiRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function getGaleriaSessionRole(request: NextRequest) {
  const cookieNames = [
    "galeria_session",
    "galeria_user",
    "session",
    "auth_session",
    "user_session",
  ];

  for (const cookieName of cookieNames) {
    const cookieValue = request.cookies.get(cookieName)?.value;

    if (!cookieValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(cookieValue) as { role?: string };

      if (
        parsed.role === "admin" ||
        parsed.role === "staff" ||
        parsed.role === "customer"
      ) {
        return parsed.role;
      }

      return "unknown";
    } catch {
      return "unknown";
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const galeriaRole = getGaleriaSessionRole(request);

  const googleToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const hasGoogleLogin = typeof googleToken?.email === "string";

  if (pathname.startsWith("/customer")) {
    if (
      galeriaRole === "customer" ||
      galeriaRole === "admin" ||
      galeriaRole === "unknown" ||
      hasGoogleLogin
    ) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (galeriaRole === "admin" || galeriaRole === "unknown") {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/staff")) {
    if (
      galeriaRole === "staff" ||
      galeriaRole === "admin" ||
      galeriaRole === "unknown"
    ) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};