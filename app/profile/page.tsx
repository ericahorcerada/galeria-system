"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSession, signOut } from "next-auth/react";
import {
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Home,
  LogOut,
  MessageSquare,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Truck,
  User,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";

type ProfileUser = {
  name: string;
  email: string;
  provider: "google" | "local";
};

type OrderItem = {
  title: string;
  artist_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Order = {
  order_id: number;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
};

type ActivePanel =
  | "pay"
  | "process"
  | "receive"
  | "rate"
  | "history"
  | "notifications"
  | "account";

function formatPeso(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] || status;
}

function getPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending Payment",
    paid: "Paid",
    failed: "Payment Failed",
    refunded: "Refunded",
  };

  return labels[status] || status;
}

function getTrackingSteps(order: Order) {
  return [
    {
      label: "Order Placed",
      active: true,
      description: "Your order was submitted successfully.",
    },
    {
      label: "Processing",
      active: ["processing", "shipped", "completed"].includes(order.order_status),
      description: "Admin or staff is preparing your order.",
    },
    {
      label: "Shipped",
      active: ["shipped", "completed"].includes(order.order_status),
      description: "Your order is already on the way or ready for pickup.",
    },
    {
      label: "Completed",
      active: order.order_status === "completed",
      description: "Your transaction is completed.",
    },
  ];
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>("history");

  async function loadOrders() {
    setOrdersLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customer/orders", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to load orders.");
        setOrders([]);
        return;
      }

      setOrders(result.orders || []);
    } catch {
      setError("Unable to reach order server.");
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const googleSession = await getSession();

        if (googleSession?.user?.email) {
          setUser({
            name: googleSession.user.name || "Google Customer",
            email: googleSession.user.email,
            provider: "google",
          });

          setLoading(false);
          return;
        }

        const localResponse = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (localResponse.ok) {
          const result = await localResponse.json();

          if (result.user) {
            setUser({
              name: result.user.name || result.user.email || "Customer",
              email: result.user.email || result.user.identifier || "",
              provider: result.user.provider === "google" ? "google" : "local",
            });

            setLoading(false);
            return;
          }
        }

        window.location.href = "/login";
      } catch {
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    loadOrders();

    const interval = window.setInterval(() => {
      loadOrders();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // Continue logout even if old logout route fails.
    }

    localStorage.removeItem("galeria_user");

    await signOut({
      callbackUrl: "/login",
    });
  };

  const counts = useMemo(() => {
    return {
      pay: orders.filter((order) => order.payment_status === "pending").length,
      process: orders.filter((order) =>
        ["pending", "processing"].includes(order.order_status)
      ).length,
      receive: orders.filter((order) => order.order_status === "shipped").length,
      rate: orders.filter((order) => order.order_status === "completed").length,
      notifications: orders.filter((order) =>
        ["processing", "shipped", "completed", "cancelled"].includes(order.order_status)
      ).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activePanel === "pay") {
      return orders.filter((order) => order.payment_status === "pending");
    }

    if (activePanel === "process") {
      return orders.filter((order) =>
        ["pending", "processing"].includes(order.order_status)
      );
    }

    if (activePanel === "receive") {
      return orders.filter((order) => order.order_status === "shipped");
    }

    if (activePanel === "rate") {
      return orders.filter((order) => order.order_status === "completed");
    }

    return orders;
  }, [activePanel, orders]);

  const notifications = useMemo(() => {
    return orders
      .filter((order) =>
        ["processing", "shipped", "completed", "cancelled"].includes(order.order_status)
      )
      .map((order) => {
        if (order.order_status === "processing") {
          return `Order ${order.order_number} is now being processed by staff.`;
        }

        if (order.order_status === "shipped") {
          return `Order ${order.order_number} has been shipped or is ready to receive.`;
        }

        if (order.order_status === "completed") {
          return `Order ${order.order_number} is completed. You may now rate your purchase.`;
        }

        return `Order ${order.order_number} was cancelled.`;
      });
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex min-h-screen items-center justify-center pt-24">
          <p className="text-muted-foreground">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.name.split(" ")[0] || "Customer";

  return (
    <div className="min-h-screen bg-[#f8f3ea] text-[#2b1b10]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-[#dec9a7] bg-gradient-to-br from-[#6b3f1f] via-[#9a6430] to-[#d4a253] text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/25">
                <User className="h-10 w-10" />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/75">
                  Customer Profile
                </p>
                <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">
                  {user.name}
                </h1>
                <p className="mt-1 text-sm text-white/80">{user.email}</p>
                <p className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {user.provider === "google" ? "Google Account" : "Galeria Account"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/shop">
                <Button className="bg-white text-[#6b3f1f] hover:bg-white/90">
                  Shop Now
                </Button>
              </Link>

              <Button
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Welcome back, {firstName}</h2>
              <p className="text-sm text-muted-foreground">
                Track your orders, payments, shipping updates, and purchase history.
              </p>
            </div>

            <Button variant="outline" onClick={loadOrders}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Orders
            </Button>
          </div>
        </section>

        {error && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Purchases</h2>
            <button
              type="button"
              onClick={() => setActivePanel("history")}
              className="text-sm font-medium text-[#9a6430] hover:underline"
            >
              View Purchase History
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActivePanel("pay")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <CreditCard className="mx-auto mb-2 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Pay</p>
              <p className="mt-1 text-xs text-muted-foreground">{counts.pay} order(s)</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("process")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <Package className="mx-auto mb-2 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Process</p>
              <p className="mt-1 text-xs text-muted-foreground">{counts.process} order(s)</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("receive")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <Truck className="mx-auto mb-2 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Receive</p>
              <p className="mt-1 text-xs text-muted-foreground">{counts.receive} order(s)</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("rate")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <Star className="mx-auto mb-2 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Rate</p>
              <p className="mt-1 text-xs text-muted-foreground">{counts.rate} order(s)</p>
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">Notifications</h2>

            {notifications.length === 0 ? (
              <div className="rounded-2xl bg-[#f8f3ea] p-5 text-sm text-muted-foreground">
                No order notifications yet. When admin updates your order to processing,
                shipped, completed, or cancelled, it will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((note, index) => (
                  <div
                    key={`${note}-${index}`}
                    className="flex gap-3 rounded-2xl bg-[#f8f3ea] p-4"
                  >
                    <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[#9a6430]" />
                    <p className="text-sm">{note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">Account</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-[#f8f3ea] px-4 py-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-[#9a6430]" />
                  <span className="font-medium">Profile Name</span>
                </div>
                <span className="text-sm text-muted-foreground">{user.name}</span>
              </div>

              <button
                type="button"
                onClick={() => setActivePanel("notifications")}
                className="flex w-full items-center justify-between rounded-2xl bg-[#f8f3ea] px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-[#9a6430]" />
                  <span className="font-medium">Notifications</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {counts.notifications} update(s)
                </span>
              </button>

              <div className="flex items-center justify-between rounded-2xl bg-[#f8f3ea] px-4 py-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#9a6430]" />
                  <span className="font-medium">Login Type</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {user.provider === "google" ? "Google" : "Email"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 font-semibold text-red-700 transition hover:bg-red-100"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {activePanel === "pay" && "To Pay"}
                {activePanel === "process" && "To Process"}
                {activePanel === "receive" && "To Receive"}
                {activePanel === "rate" && "To Rate"}
                {activePanel === "history" && "Purchase History"}
                {activePanel === "notifications" && "Order Updates"}
                {activePanel === "account" && "Account Orders"}
              </h2>
              <p className="text-sm text-muted-foreground">
                This section updates automatically every 10 seconds.
              </p>
            </div>

            <Link href="/shop">
              <Button>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Shop More
              </Button>
            </Link>
          </div>

          {ordersLoading ? (
            <div className="rounded-2xl bg-[#f8f3ea] p-6 text-sm text-muted-foreground">
              Loading transactions...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl bg-[#f8f3ea] p-6 text-sm text-muted-foreground">
              No transactions found in this section yet.
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const steps = getTrackingSteps(order);

                return (
                  <div
                    key={order.order_number}
                    className="rounded-2xl border border-[#eadcc5] bg-[#fffaf2] p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Order Number
                        </p>
                        <h3 className="text-lg font-semibold">{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          Ordered on {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#f1e4cf] px-3 py-1 text-xs font-semibold text-[#6b3f1f]">
                          {getPaymentStatusLabel(order.payment_status)}
                        </span>
                        <span className="rounded-full bg-[#ead7b6] px-3 py-1 text-xs font-semibold text-[#6b3f1f]">
                          {getOrderStatusLabel(order.order_status)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-5 grid gap-3 sm:grid-cols-4">
                      {steps.map((step) => (
                        <div
                          key={step.label}
                          className={`rounded-2xl border p-4 ${
                            step.active
                              ? "border-[#b47a35] bg-[#f8f3ea]"
                              : "border-[#eadcc5] bg-white"
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            {step.active ? (
                              <CheckCircle2 className="h-5 w-5 text-[#9a6430]" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <p className="font-semibold">{step.label}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-[#eadcc5] bg-white">
                      {order.items.map((item) => (
                        <div
                          key={`${order.order_number}-${item.title}`}
                          className="flex items-center justify-between border-b border-[#eadcc5] p-4 last:border-b-0"
                        >
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.artist_name} • Qty {item.quantity} •{" "}
                              {formatPeso(Number(item.unit_price))}
                            </p>
                          </div>
                          <p className="font-semibold">{formatPeso(Number(item.line_total))}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-xl bg-[#f8f3ea] p-3">
                        <p className="text-xs text-muted-foreground">Subtotal</p>
                        <p className="font-semibold">{formatPeso(Number(order.subtotal))}</p>
                      </div>
                      <div className="rounded-xl bg-[#f8f3ea] p-3">
                        <p className="text-xs text-muted-foreground">Shipping + Tax</p>
                        <p className="font-semibold">
                          {formatPeso(Number(order.shipping_fee) + Number(order.tax_amount))}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#f8f3ea] p-3">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold">{formatPeso(Number(order.total_amount))}</p>
                      </div>
                    </div>

                    {order.order_status === "completed" && (
                      <div className="mt-4">
                        <Link href="/feedback">
                          <Button variant="outline">
                            <Star className="mr-2 h-4 w-4" />
                            Rate / Send Feedback
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold">Quick Links</h2>

          <div className="grid gap-4 sm:grid-cols-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl border border-[#eadcc5] p-4 transition hover:bg-[#f8f3ea]"
            >
              <Home className="h-5 w-5 text-[#9a6430]" />
              <span className="font-medium">Homepage</span>
            </Link>

            <Link
              href="/cart"
              className="flex items-center gap-3 rounded-2xl border border-[#eadcc5] p-4 transition hover:bg-[#f8f3ea]"
            >
              <ShoppingCart className="h-5 w-5 text-[#9a6430]" />
              <span className="font-medium">Cart</span>
            </Link>

            <Link
              href="/sale"
              className="flex items-center gap-3 rounded-2xl border border-[#eadcc5] p-4 transition hover:bg-[#f8f3ea]"
            >
              <Gift className="h-5 w-5 text-[#9a6430]" />
              <span className="font-medium">Sale Offers</span>
            </Link>

            <Link
              href="/feedback"
              className="flex items-center gap-3 rounded-2xl border border-[#eadcc5] p-4 transition hover:bg-[#f8f3ea]"
            >
              <MessageSquare className="h-5 w-5 text-[#9a6430]" />
              <span className="font-medium">Feedback</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}