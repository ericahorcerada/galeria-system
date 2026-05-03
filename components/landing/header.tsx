"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  User,
  X,
} from "lucide-react";

type LoggedUser = {
  role?: "customer" | "staff" | "admin";
  provider?: string;
  name?: string;
  email?: string;
  identifier?: string;
};

const navItems = [
  { label: "Shop", href: "/shop" },
  { label: "Sale", href: "/sale" },
  { label: "Artists", href: "/artists" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
  { label: "Feedback", href: "/feedback" },
];

function isValidUser(value: unknown): value is LoggedUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as LoggedUser;

  return (
    user.role === "customer" ||
    user.role === "staff" ||
    user.role === "admin"
  );
}

export function Header() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      /*
        IMPORTANT:
        Do NOT trust localStorage alone.
        If the user clicked logout, old localStorage can still make the header
        think the user is logged in. So we check the real server session first.
      */

      try {
        const sessionResponse = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        const session = await sessionResponse.json();

        if (!cancelled && session?.user?.email) {
          const googleUser: LoggedUser = {
            role: "customer",
            provider: "google",
            name: session.user.name || session.user.email,
            email: session.user.email,
            identifier: session.user.email,
          };

          setUser(googleUser);
          localStorage.setItem("galeria_user", JSON.stringify(googleUser));
          return;
        }
      } catch {
        // Continue to custom auth check.
      }

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!cancelled && response.ok && result.success && isValidUser(result.user)) {
          setUser(result.user);
          localStorage.setItem("galeria_user", JSON.stringify(result.user));
          return;
        }
      } catch {
        // Continue to logged-out state.
      }

      /*
        If no Google session and no custom app session:
        user is logged out. Remove stale old admin/customer data.
      */
      if (!cancelled) {
        setUser(null);
        localStorage.removeItem("galeria_user");
      }
    }

    function loadCartCount() {
      try {
        const cart = localStorage.getItem("galeria_cart");

        if (!cart) {
          setCartCount(0);
          return;
        }

        const parsed = JSON.parse(cart);

        if (Array.isArray(parsed)) {
          setCartCount(parsed.length);
          return;
        }

        if (Array.isArray(parsed.items)) {
          setCartCount(parsed.items.length);
          return;
        }

        setCartCount(0);
      } catch {
        setCartCount(0);
      }
    }

    loadUser();
    loadCartCount();

    window.addEventListener("storage", loadCartCount);
    window.addEventListener("focus", loadUser);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", loadCartCount);
      window.removeEventListener("focus", loadUser);
    };
  }, [pathname]);

  const toggleTheme = () => {
    const nextDark = !isDark;

    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "staff"
        ? "/staff"
        : "/customer/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-10">
        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-bold transition hover:text-primary ${
                  isActive ? "text-primary" : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="text-center">
          <div className="font-serif text-2xl font-bold uppercase tracking-[0.25em] text-foreground">
            Galeria
          </div>
          <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-muted-foreground">
            Butuan City
          </div>
        </Link>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/shop"
            className="hidden text-foreground transition hover:text-primary sm:inline-flex"
            aria-label="Search artworks"
          >
            <Search className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="text-foreground transition hover:text-primary"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <Link
              href={dashboardHref}
              className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-primary hover:text-primary sm:inline-flex"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-foreground transition hover:text-primary"
              aria-label="Login"
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link
            href="/cart"
            className="relative text-foreground transition hover:text-primary"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="flex h-20 items-center justify-between border-b border-border px-6">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <div className="font-serif text-xl font-bold uppercase tracking-[0.25em]">
                Galeria
              </div>
              <div className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Butuan City
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-2 px-6 py-8">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-lg font-bold transition ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {user ? (
              <Link
                href={dashboardHref}
                onClick={() => setIsOpen(false)}
                className="block rounded-xl bg-muted px-4 py-3 text-lg font-bold"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block rounded-xl bg-muted px-4 py-3 text-lg font-bold"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;