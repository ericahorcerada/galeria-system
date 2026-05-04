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

function readStoredUser(): LoggedUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem("galeria_user");

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as LoggedUser;

    if (
      parsed.role === "customer" ||
      parsed.role === "staff" ||
      parsed.role === "admin"
    ) {
      return parsed;
    }

    localStorage.removeItem("galeria_user");
    return null;
  } catch {
    localStorage.removeItem("galeria_user");
    return null;
  }
}

function countCartItemsFromValue(value: string | null) {
  if (!value) {
    return 0;
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.reduce((total, item) => {
        const quantity = Number(item?.quantity || item?.qty || 1);
        return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
      }, 0);
    }

    if (Array.isArray(parsed.items)) {
      return parsed.items.reduce((total: number, item: any) => {
        const quantity = Number(item?.quantity || item?.qty || 1);
        return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
      }, 0);
    }

    if (typeof parsed.count === "number") {
      return parsed.count;
    }

    if (typeof parsed.totalItems === "number") {
      return parsed.totalItems;
    }

    return 0;
  } catch {
    return 0;
  }
}

function readCartCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const possibleCartKeys = [
    "galeria_cart",
    "cart",
    "galeriaCart",
    "artspace_cart",
    "shopping_cart",
  ];

  for (const key of possibleCartKeys) {
    const count = countCartItemsFromValue(localStorage.getItem(key));

    if (count > 0) {
      return count;
    }
  }

  return 0;
}

export function Header() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const isLoginPage = pathname === "/login";
  const visibleUser = isLoginPage ? null : user;

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    function refreshHeaderState() {
      setUser(readStoredUser());
      setCartCount(readCartCount());
    }

    refreshHeaderState();

    const interval = window.setInterval(refreshHeaderState, 1000);

    window.addEventListener("storage", refreshHeaderState);
    window.addEventListener("focus", refreshHeaderState);
    window.addEventListener("click", refreshHeaderState);
    window.addEventListener("galeria-auth-change", refreshHeaderState);
    window.addEventListener("galeria-cart-change", refreshHeaderState);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", refreshHeaderState);
      window.removeEventListener("focus", refreshHeaderState);
      window.removeEventListener("click", refreshHeaderState);
      window.removeEventListener("galeria-auth-change", refreshHeaderState);
      window.removeEventListener("galeria-cart-change", refreshHeaderState);
    };
  }, [pathname]);

  const toggleTheme = () => {
    const nextDark = !isDark;

    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  const dashboardHref =
    visibleUser?.role === "admin"
      ? "/admin"
      : visibleUser?.role === "staff"
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

          {visibleUser ? (
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
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted hover:text-primary"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-black leading-none text-white shadow-lg ring-2 ring-background">
                {cartCount > 99 ? "99+" : cartCount}
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

            {visibleUser ? (
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