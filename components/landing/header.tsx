"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/contexts/dark-mode-context";
import { useCart } from "@/contexts/cart-context";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Shop", href: "/shop" },
  { name: "Sale", href: "/sale" },
  { name: "Artists", href: "/artists" },
  { name: "Collections", href: "/collections" },
  { name: "About", href: "/about" },
  { name: "Feedback", href: "/feedback" },
];

type AuthUser = {
  id: number | string;
  role: "customer" | "staff" | "admin";
  name: string;
  identifier: string;
  provider?: "local" | "google";
};

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const { scrollY } = useScroll();
  const { theme, toggleTheme } = useDarkMode();
  const { getTotalItems } = useCart();
  const pathname = usePathname();

  const isHome = pathname === "/";
  const useLightHeader = !isHome || isScrolled;

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (response.ok) {
          const result = await response.json();

          if (result.user && isMounted) {
            setUser({
              ...result.user,
              provider: "local",
            });
            return;
          }
        }

        const googleSession = await getSession();

        if (googleSession?.user?.email && isMounted) {
          setUser({
            id: googleSession.user.email,
            role: "customer",
            name: googleSession.user.name || googleSession.user.email,
            identifier: googleSession.user.email,
            provider: "google",
          });
          return;
        }

        if (isMounted) {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      }
    }

    loadUser();
    window.addEventListener("focus", loadUser);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", loadUser);
    };
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // Ignore old logout errors so Google logout can still continue.
    }

    localStorage.removeItem("galeria_user");
    setUser(null);

    await signOut({
      callbackUrl: "/login",
    });
  };

  const iconTextClass = useLightHeader
    ? "text-foreground/80 hover:text-foreground hover:bg-muted"
    : "text-white/90 hover:text-white hover:bg-white/10";

  const navTextClass = useLightHeader
    ? "text-foreground/80 hover:text-foreground"
    : "text-white/90 hover:text-white";

  const profileHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "staff"
        ? "/staff"
        : "/customer/dashboard";

  return (
    <>
      <motion.header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          useLightHeader
            ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-sm"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4 lg:gap-6">
            <div className="flex min-w-0 items-center justify-start">
              <button
                className="relative z-20 -ml-2 p-2 lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className={`h-5 w-5 ${useLightHeader ? "text-foreground" : "text-white"}`} />
              </button>

              <nav className="relative z-50 ml-4 hidden min-w-0 items-center justify-start gap-5 xl:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative z-20 whitespace-nowrap text-sm font-medium tracking-wide transition-colors ${navTextClass}`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex min-w-[130px] justify-center px-2 sm:min-w-[150px]">
              <Link href="/" className="relative z-30 whitespace-nowrap">
                <div className="text-center">
                  <h1
                    className={`font-serif text-base font-semibold tracking-[0.12em] sm:text-xl lg:text-2xl ${
                      useLightHeader ? "text-foreground" : "text-white"
                    }`}
                  >
                    GALERIA
                  </h1>
                  <span
                    className={`block text-[9px] font-medium tracking-[0.28em] ${
                      useLightHeader ? "text-muted-foreground" : "text-white/80"
                    }`}
                  >
                    BUTUAN CITY
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex min-w-0 items-center justify-end">
              <div className="ml-1 flex shrink-0 items-center gap-1 sm:ml-2">
                <Link
                  href="/shop"
                  className={`relative z-20 hidden h-10 w-10 items-center justify-center rounded-full transition-colors sm:flex ${iconTextClass}`}
                  aria-label="Search artworks"
                >
                  <Search className="h-5 w-5" />
                </Link>

                <button
                  onClick={toggleTheme}
                  className={`relative z-20 hidden h-10 w-10 items-center justify-center rounded-full transition-colors sm:flex ${iconTextClass}`}
                  aria-label="Toggle dark mode"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {user ? (
                  <div className="relative z-20 hidden items-center gap-1 sm:flex">
                    <Link href={profileHref}>
                      <button
                        className={`flex h-10 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors ${iconTextClass}`}
                        aria-label="Account dashboard"
                      >
                        {user.role === "admin" ? (
                          <LayoutDashboard className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="hidden max-w-28 truncate 2xl:inline">{user.name}</span>
                      </button>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className={`flex h-10 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors ${iconTextClass}`}
                      aria-label="Sign out"
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      <span className="hidden lg:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="relative z-20">
                    <button
                      className={`hidden h-10 w-10 items-center justify-center rounded-full transition-colors sm:flex ${iconTextClass}`}
                      aria-label="Account"
                    >
                      <User className="h-5 w-5" />
                    </button>
                  </Link>
                )}

                <Link href="/cart" className="relative z-20">
                  <button
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconTextClass}`}
                    aria-label="Cart"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {getTotalItems() > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                        {getTotalItems()}
                      </span>
                    )}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div
        className={`fixed inset-0 z-50 bg-background text-foreground lg:hidden ${
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        initial={false}
        animate={isMobileMenuOpen ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
          <span className="font-serif text-2xl font-light tracking-[0.2em] text-foreground">
            GALERIA
          </span>
          <button
            className="-mr-2 p-2"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <nav className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-8">
          {navLinks.map((link, i) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isMobileMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={link.href}
                className="font-serif text-2xl tracking-wide text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={isMobileMenuOpen ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex flex-col items-center gap-4"
          >
            <button
              onClick={toggleTheme}
              className="flex h-12 w-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                <Link href={profileHref} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="h-12 px-8 text-sm tracking-wide">{user.name}</Button>
                </Link>

                <Button
                  variant="outline"
                  className="h-12 px-8 text-sm tracking-wide"
                  onClick={handleSignOut}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="h-12 px-8 text-sm tracking-wide">Sign In</Button>
              </Link>
            )}
          </motion.div>
        </nav>
      </motion.div>
    </>
  );
}