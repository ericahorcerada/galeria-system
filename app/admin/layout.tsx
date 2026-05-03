"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChevronDown,
  Home,
  Image,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Palette,
  ShoppingCart,
  Sun,
  Truck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useDarkMode } from "@/contexts/dark-mode-context";

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Artworks", href: "/admin/artworks", icon: Image },
  { name: "Artists", href: "/admin/artists", icon: Palette },
  { name: "Homepage", href: "/admin/homepage", icon: Home },
  { name: "Collections", href: "/admin/collections", icon: Images },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Staff", href: "/admin/staff", icon: UserCog },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Stocks", href: "/admin/stocks", icon: Boxes },
  { name: "Suppliers", href: "/admin/suppliers", icon: Truck },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useDarkMode();

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-md p-2 -ml-2 hover:bg-muted"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="font-serif text-lg tracking-wider">GALERIA</span>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </header>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-dvh w-[min(18rem,86vw)] transform border-r border-border bg-background shadow-xl transition-transform lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link
            href="/admin"
            className="flex items-center gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="font-serif text-lg tracking-wider">GALERIA</span>
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:flex"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-md p-1 hover:bg-muted lg:hidden"
              aria-label="Close admin menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="absolute inset-x-0 bottom-24 top-14 space-y-1 overflow-y-auto overscroll-contain p-3">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((previous) => !previous)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                A
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">Admin User</p>
                <p className="truncate text-xs text-muted-foreground">
                  admin@galeria.ph
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute bottom-full left-0 right-0 z-[60] mb-2 overflow-hidden rounded-md border border-border bg-background shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="min-w-0 pt-14 lg:pl-64 lg:pt-0">
        <div className="w-full max-w-[1600px] p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}