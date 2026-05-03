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

function hasCustomSession(request: NextRequest) {
  const possibleCookieNames = [
    "galeria_session",
    "session",
    "auth_session",
    "user_session",
  ];

  return possibleCookieNames.some((cookieName) => {
    return Boolean(request.cookies.get(cookieName)?.value);
  });
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

  const customSessionExists = hasCustomSession(request);

  const googleToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const googleRole = googleToken?.role;
  const googleProvider = googleToken?.provider;

  const isGoogleCustomer =
    typeof googleToken?.email === "string" &&
    (googleRole === "customer" || googleProvider === "google");

  if (pathname.startsWith("/customer")) {
    if (customSessionExists || isGoogleCustomer) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (customSessionExists) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/staff")) {
    if (customSessionExists) {
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