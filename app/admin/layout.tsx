"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  Users,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Palette,
  Home,
  Images,
  MessageSquare,
} from "lucide-react";

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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/40 bg-white/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-4">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-orange-100"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="font-serif text-lg tracking-wider art-gradient-text">
          GALERIA
        </span>

        <div className="w-9" />
      </header>

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-dvh w-[min(18rem,86vw)] border-r border-white/20 bg-[linear-gradient(180deg,#2d1238_0%,#6d1d56_42%,#f97316_100%)] text-white shadow-xl transform transition-transform lg:h-screen lg:w-64 lg:shadow-none lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/15">
          <Link
            href="/admin"
            className="flex items-center gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-300 via-pink-400 to-violet-500 shadow-lg" />
            <div>
              <span className="block font-serif text-lg leading-none tracking-wider">
                GALERIA
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-yellow-100">
                Admin Studio
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-white/10"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="absolute inset-x-0 top-16 bottom-28 overflow-y-auto overscroll-contain p-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-white text-[#481047] shadow-lg shadow-black/20"
                    : "text-white/75 hover:text-white hover:bg-white/12"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 ${
                    isActive ? "text-pink-600" : "text-yellow-100"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/15">
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-300 via-pink-400 to-violet-500 flex items-center justify-center text-sm font-black text-white shadow-md">
                A
              </div>

              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate text-white">
                  Admin User
                </p>
                <p className="text-xs text-white/65 truncate">
                  admin@galeria.ph
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-white/70 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 right-0 bottom-full mb-2 z-[60] rounded-xl border border-white/30 bg-white text-foreground shadow-xl overflow-hidden"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.14),transparent_28%),linear-gradient(135deg,rgba(255,247,237,0.95),rgba(253,244,255,0.95))]">
          <div className="w-full max-w-[1600px] p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}