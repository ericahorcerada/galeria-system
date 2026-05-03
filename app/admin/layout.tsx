"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Brush,
  ChevronDown,
  Home,
  Image,
  Images,
  Info,
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
  { name: "About", href: "/admin/about", icon: Info },
  { name: "Artworks", href: "/admin/artworks", icon: Image },
  { name: "Artists", href: "/admin/artists", icon: Palette },
  { name: "Artists Hero", href: "/admin/artists-page", icon: Brush },
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
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 px-3 shadow-sm backdrop-blur-xl sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="-ml-2 rounded-xl p-2 text-foreground hover:bg-muted"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/admin" className="text-center">
          <span className="block font-serif text-lg tracking-[0.18em] art-gradient-text">
            GALERIA
          </span>
          <span className="block text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Admin Studio
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-muted"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[min(18rem,86vw)] transform flex-col overflow-hidden border-r border-white/15 bg-[linear-gradient(180deg,#2c123e_0%,#4b1660_35%,#8b1e71_65%,#f97316_100%)] text-white shadow-2xl transition-transform lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,197,80,0.20),transparent_38%)]" />

        {/* Logo */}
        <div className="relative flex h-20 shrink-0 items-center justify-between border-b border-white/15 px-4">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-3"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 shadow-lg shadow-pink-950/30">
              <Palette className="h-6 w-6 text-white" />
            </div>

            <div className="min-w-0">
              <span className="block truncate font-serif text-xl leading-none tracking-[0.16em] text-white">
                GALERIA
              </span>
              <span className="block truncate text-[10px] uppercase tracking-[0.24em] text-orange-100/80">
                Admin Studio
              </span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white lg:flex"
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
              className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close admin menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable menu */}
        <nav className="relative min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-white text-[#3b104e] shadow-xl shadow-black/20"
                    : "text-white/85 hover:bg-white/12 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 text-white shadow-md"
                      : "bg-white/10 text-orange-100 group-hover:bg-white/18"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </span>

                <span
                  className={`truncate ${
                    isActive ? "text-[#3b104e]" : "text-current"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Always visible logout/user section */}
        <div className="relative shrink-0 border-t border-white/15 bg-black/10 p-3 backdrop-blur">
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((previous) => !previous)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 text-left backdrop-blur transition-colors hover:bg-white/15"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 text-sm font-black text-white shadow-md">
                A
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  Admin User
                </p>
                <p className="truncate text-xs text-white/70">
                  admin@galeria.ph
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-white/80 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute bottom-full left-0 right-0 z-[60] mb-2 overflow-hidden rounded-2xl border border-white/20 bg-white text-foreground shadow-2xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 pt-14 lg:pl-64 lg:pt-0">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.09),transparent_30%)]">
          <div className="w-full max-w-[1600px] p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}