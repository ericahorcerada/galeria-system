"use client";

import { useEffect, useRef, useState } from "react";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-3 sm:px-4">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-muted"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="font-serif text-lg tracking-wider">GALERIA</span>

        <div className="w-9" />
      </header>

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-dvh w-[min(18rem,86vw)] bg-background border-r border-border shadow-xl transform transition-transform lg:h-screen lg:w-64 lg:shadow-none lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <Link
            href="/admin"
            className="flex items-center gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="font-serif text-lg tracking-wider">GALERIA</span>
            <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
              Admin
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-muted"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="absolute inset-x-0 top-14 bottom-24 overflow-y-auto overscroll-contain p-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                A
              </div>

              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">
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
                className="absolute left-0 right-0 bottom-full mb-2 z-[60] rounded-md border border-border bg-background shadow-lg overflow-hidden"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
      <main className="min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <div className="w-full max-w-[1600px] p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}