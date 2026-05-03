"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Gift,
  LogOut,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Truck,
  User,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

type CustomerUser = {
  id?: number;
  customer_id?: number;
  name?: string;
  full_name?: string;
  email?: string;
  identifier?: string;
  role?: string;
  provider?: string;
};

type CustomerOrder = {
  order_id?: number;
  id?: number;
  order_number?: string;
  reference?: string;
  status?: string;
  payment_status?: string;
  total_amount?: number;
  total?: number;
  created_at?: string;
};

type NextAuthSession = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires?: string;
};

function getDisplayName(user: CustomerUser | null) {
  return (
    user?.name ||
    user?.full_name ||
    user?.identifier?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "Customer"
  );
}

function getDisplayEmail(user: CustomerUser | null) {
  return user?.email || user?.identifier || "Google Account";
}

function formatMoney(value?: number) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export default function CustomerDashboardPage() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadUser() {
      setIsLoadingUser(true);

      try {
        const googleResponse = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        const googleSession = (await googleResponse.json()) as NextAuthSession;

        if (googleSession?.user?.email) {
          const googleUser: CustomerUser = {
            role: "customer",
            provider: "google",
            name: googleSession.user.name || googleSession.user.email,
            full_name: googleSession.user.name || googleSession.user.email,
            email: googleSession.user.email,
            identifier: googleSession.user.email,
          };

          setUser(googleUser);

          if (typeof window !== "undefined") {
            localStorage.setItem("galeria_user", JSON.stringify(googleUser));
          }

          return;
        }
      } catch {
        // Continue to normal auth check below.
      }

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok && result.success && result.user) {
          const authUser = result.user as CustomerUser;

          if (authUser.role === "customer") {
            setUser(authUser);

            if (typeof window !== "undefined") {
              localStorage.setItem("galeria_user", JSON.stringify(authUser));
            }

            return;
          }
        }
      } catch {
        // Continue to fallback below.
      }

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("galeria_user");

        if (stored) {
          try {
            const storedUser = JSON.parse(stored) as CustomerUser;

            if (storedUser.role === "customer") {
              setUser(storedUser);
              return;
            }

            localStorage.removeItem("galeria_user");
          } catch {
            localStorage.removeItem("galeria_user");
          }
        }
      }

      setUser({
        role: "customer",
        provider: "google",
        name: "Customer",
        email: "Google Account",
        identifier: "Google Account",
      });

      setIsLoadingUser(false);
    }

    async function loadOrders() {
      setIsLoadingOrders(true);

      try {
        const response = await fetch("/api/customer/orders", {
          cache: "no-store",
        });

        const result = await response.json();

        const orderList =
          result.orders || result.data || result.results || result.items || [];

        if (Array.isArray(orderList)) {
          setOrders(orderList);
        }
      } catch {
        setOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    loadUser().finally(() => setIsLoadingUser(false));
    loadOrders();
  }, []);

  const displayName = getDisplayName(user);
  const displayEmail = getDisplayEmail(user);

  const firstName = useMemo(() => {
    return displayName.split(" ")[0] || "Customer";
  }, [displayName]);

  const pendingOrders = orders.filter((order) => {
    const status = String(order.status || "").toLowerCase();

    return (
      status.includes("pending") ||
      status.includes("process") ||
      status.includes("review")
    );
  });

  const receivingOrders = orders.filter((order) => {
    const status = String(order.status || "").toLowerCase();

    return (
      status.includes("ship") ||
      status.includes("delivery") ||
      status.includes("receive")
    );
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      });
    } catch {
      // Continue logout cleanup.
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Continue logout cleanup.
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("galeria_user");
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 lg:px-10">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-orange-700 via-amber-600 to-yellow-500 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/20">
                <User className="h-12 w-12" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/80">
                  Customer Account
                </p>

                <h1 className="mt-2 font-serif text-3xl uppercase tracking-wide sm:text-4xl">
                  {isLoadingUser ? "Loading..." : displayName}
                </h1>

                <p className="mt-1 text-sm font-semibold text-white/90">
                  {isLoadingUser ? "Checking account..." : displayEmail}
                </p>

                <span className="mt-3 inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-bold">
                  {user?.provider === "google" ? "Google Account" : "Customer"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-amber-900 shadow transition hover:bg-white/90"
              >
                Shop Now
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-black/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-black/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Welcome back, {firstName}</h2>

              <p className="mt-1 text-muted-foreground">
                Browse artworks, place orders, check your cart, and manage your
                gallery account in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Browse and Order Artworks
              </Link>

              <Link
                href="/cart"
                className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-bold transition hover:bg-muted"
              >
                View Cart
              </Link>

              <Link
                href="/feedback"
                className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-bold transition hover:bg-muted"
              >
                Share Feedback
              </Link>
            </div>
          </div>
        </section>

        <section
          id="purchase-history"
          className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">My Purchases</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track orders after you shop and checkout.
              </p>
            </div>

            <Link
              href="/shop"
              className="text-sm font-bold text-primary hover:underline"
            >
              Start New Order
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Link
              href="/cart"
              className="rounded-2xl border border-border bg-background p-6 text-center transition hover:-translate-y-1 hover:bg-muted"
            >
              <ReceiptText className="mx-auto mb-4 h-8 w-8 text-primary" />
              <p className="font-bold">To Pay</p>
            </Link>

            <div className="rounded-2xl border border-border bg-background p-6 text-center">
              <Package className="mx-auto mb-4 h-8 w-8 text-primary" />
              <p className="font-bold">To Process</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingOrders.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6 text-center">
              <Truck className="mx-auto mb-4 h-8 w-8 text-primary" />
              <p className="font-bold">To Receive</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {receivingOrders.length}
              </p>
            </div>

            <Link
              href="/feedback"
              className="rounded-2xl border border-border bg-background p-6 text-center transition hover:-translate-y-1 hover:bg-muted"
            >
              <Star className="mx-auto mb-4 h-8 w-8 text-primary" />
              <p className="font-bold">To Rate</p>
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background p-5">
            <h3 className="mb-4 font-black">Recent Orders</h3>

            {isLoadingOrders ? (
              <p className="text-sm text-muted-foreground">
                Loading your orders...
              </p>
            ) : orders.length === 0 ? (
              <div className="rounded-xl bg-muted p-5 text-center">
                <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-primary" />

                <p className="font-bold">No orders yet.</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Start browsing artworks and place your first order.
                </p>

                <Link
                  href="/shop"
                  className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Browse and Order Now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => {
                  const orderId = order.order_id || order.id;
                  const orderLabel =
                    order.order_number || order.reference || `Order #${orderId}`;

                  return (
                    <div
                      key={orderId || orderLabel}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-bold">{orderLabel}</p>

                        <p className="text-sm text-muted-foreground">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : "Order date unavailable"}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="font-bold">
                          {formatMoney(order.total_amount || order.total)}
                        </p>

                        <p className="text-sm capitalize text-muted-foreground">
                          {order.status || "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black">My Gallery Tools</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/cart"
                className="rounded-2xl bg-muted p-6 text-center transition hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground"
              >
                <ShoppingCart className="mx-auto mb-4 h-8 w-8" />
                <p className="font-bold">Cart</p>
              </Link>

              <Link
                href="/shop"
                className="rounded-2xl bg-muted p-6 text-center transition hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground"
              >
                <Store className="mx-auto mb-4 h-8 w-8" />
                <p className="font-bold">Shop</p>
              </Link>

              <Link
                href="/sale"
                className="rounded-2xl bg-muted p-6 text-center transition hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground"
              >
                <Gift className="mx-auto mb-4 h-8 w-8" />
                <p className="font-bold">Sale Offers</p>
              </Link>

              <Link
                href="/feedback"
                className="rounded-2xl bg-muted p-6 text-center transition hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground"
              >
                <Bell className="mx-auto mb-4 h-8 w-8" />
                <p className="font-bold">Feedback</p>
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black">Account</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <p className="font-bold">Profile Name</p>
                </div>

                <p className="text-right text-sm text-muted-foreground">
                  {displayName}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <p className="font-bold">Notifications</p>
                </div>

                <p className="text-right text-sm text-muted-foreground">
                  Order updates
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <p className="font-bold">Login Type</p>
                </div>

                <p className="text-right text-sm text-muted-foreground">
                  {user?.provider === "google" ? "Google" : "Customer"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="font-bold">Ready to order?</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Click the button below to browse the gallery and add artworks to
                your cart.
              </p>

              <Link
                href="/shop"
                className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Browse and Order Artworks
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}