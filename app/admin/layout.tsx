"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";

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

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-3 sm:px-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-muted" aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-serif text-lg tracking-wider">GALERIA</span>
        <div className="w-9" />
      </header>

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
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
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif text-lg tracking-wider">GALERIA</span>
            <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">Admin</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-muted" aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="absolute inset-x-0 top-14 bottom-24 overflow-y-auto overscroll-contain p-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || 
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
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@galeria.ph</p>
            </div>
            <button className="p-1.5 text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 mt-1 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
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
