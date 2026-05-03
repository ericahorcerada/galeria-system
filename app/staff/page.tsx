"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  LogOut,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

type StaffSummary = {
  user: {
    name: string;
    role: string;
    identifier?: string;
  };
  stats: {
    orders: number;
    pendingOrders: number;
    lowStock: number;
  };
  lowStock: Array<{
    title: string;
    artist_name: string;
    stock_quantity: number;
  }>;
};

type OrderItem = {
  title: string;
  artist_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type StaffOrder = {
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
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  items: OrderItem[];
};

const paymentStatuses: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

const orderStatuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

function formatPeso(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function pretty(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => {
    return letter.toUpperCase();
  });
}

function statusBadgeClass(status: string) {
  if (["paid", "completed", "shipped"].includes(status)) {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }

  if (["failed", "cancelled", "refunded"].includes(status)) {
    return "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300";
  }

  if (["processing"].includes(status)) {
    return "border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300";
  }

  return "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300";
}

export default function StaffDashboard() {
  const [summary, setSummary] = useState<StaffSummary | null>(null);
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "unpaid" | "ready"
  >("all");

  async function loadData() {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const [summaryResponse, ordersResponse] = await Promise.all([
        fetch("/api/admin/summary", { cache: "no-store" }),
        fetch("/api/admin/orders", { cache: "no-store" }),
      ]);

      const summaryJson = await summaryResponse.json();
      const ordersJson = await ordersResponse.json();

      if (!summaryResponse.ok || !summaryJson.success) {
        setError(summaryJson.error || "Unable to load staff dashboard.");
        return;
      }

      if (!ordersResponse.ok || !ordersJson.success) {
        setError(ordersJson.error || "Unable to load order queue.");
        return;
      }

      setSummary(summaryJson);
      setOrders(ordersJson.orders || []);
    } catch {
      setError("Unable to reach the dashboard server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateOrder(
    orderNumber: string,
    changes: {
      paymentStatus?: PaymentStatus;
      orderStatus?: OrderStatus;
    },
    successText: string
  ) {
    setUpdatingOrder(orderNumber);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          ...changes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to update order.");
        return;
      }

      setMessage(successText);
      await loadData();
    } catch {
      setError("Unable to update order. Please try again.");
    } finally {
      setUpdatingOrder("");
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("galeria_user");
    }

    window.location.href = "/login";
  }

  useEffect(() => {
    loadData();
  }, []);

  const visibleOrders = useMemo(() => {
    if (filter === "pending") {
      return orders.filter(
        (order) =>
          order.order_status === "pending" ||
          order.order_status === "processing"
      );
    }

    if (filter === "unpaid") {
      return orders.filter(
        (order) =>
          order.payment_status === "pending" ||
          order.payment_status === "failed"
      );
    }

    if (filter === "ready") {
      return orders.filter(
        (order) =>
          order.payment_status === "paid" &&
          !["completed", "cancelled"].includes(order.order_status)
      );
    }

    return orders;
  }, [orders, filter]);

  const unpaidCount = orders.filter(
    (order) =>
      order.payment_status === "pending" || order.payment_status === "failed"
  ).length;

  const readyCount = orders.filter(
    (order) =>
      order.payment_status === "paid" &&
      !["completed", "cancelled"].includes(order.order_status)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-6 pb-14 pt-32 sm:pt-36 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
              Staff Dashboard
            </h1>

            <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
              Process payments, update order status, and monitor artwork
              inventory.
            </p>

            {summary?.user && (
              <p className="mt-2 text-sm text-muted-foreground">
                Signed in as {summary.user.name}.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="bg-background/60"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-background/60"
            >
              <Link href="/admin/orders">Admin Orders</Link>
            </Button>

            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="bg-background/60"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {isLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            Loading live staff data...
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-300">
            {message}
          </p>
        )}

        {summary && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Total Orders",
                  value: summary.stats.orders,
                  icon: ShoppingCart,
                },
                {
                  label: "Pending Orders",
                  value: summary.stats.pendingOrders,
                  icon: Clock,
                },
                {
                  label: "Payment Review",
                  value: unpaidCount,
                  icon: CreditCard,
                },
                {
                  label: "Ready to Fulfill",
                  value: readyCount,
                  icon: Truck,
                },
                {
                  label: "Low Stock",
                  value: summary.stats.lowStock,
                  icon: Package,
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="border-border/70 bg-card/80 shadow-sm backdrop-blur"
                >
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>

                      <p className="text-2xl font-semibold">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>

                    <stat.icon className="h-8 w-8 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur xl:col-span-2">
                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Staff Order Queue
                  </CardTitle>

                  <Select
                    value={filter}
                    onValueChange={(value) =>
                      setFilter(value as typeof filter)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter orders" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">All orders</SelectItem>
                      <SelectItem value="pending">
                        Pending/processing
                      </SelectItem>
                      <SelectItem value="unpaid">Payment review</SelectItem>
                      <SelectItem value="ready">Ready to fulfill</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>

                <CardContent>
                  {visibleOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No matching orders yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {visibleOrders.map((order) => {
                        const isUpdating =
                          updatingOrder === order.order_number;
                        const isExpanded =
                          expandedOrder === order.order_number;

                        return (
                          <div
                            key={order.order_number}
                            className="rounded-xl border bg-background/60 p-4"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-1">
                                <p className="font-semibold">
                                  {order.order_number}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                  {order.customer_name} • {order.email}
                                </p>

                                <p className="text-sm">
                                  {formatPeso(order.total_amount)} •{" "}
                                  {pretty(order.payment_method)}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={statusBadgeClass(
                                    order.payment_status
                                  )}
                                >
                                  {pretty(order.payment_status)}
                                </Badge>

                                <Badge
                                  variant="outline"
                                  className={statusBadgeClass(
                                    order.order_status
                                  )}
                                >
                                  {pretty(order.order_status)}
                                </Badge>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedOrder(
                                      isExpanded ? null : order.order_number
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Details
                                </Button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 rounded-lg border bg-card/60 p-4 text-sm">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <p className="font-medium">Customer</p>

                                    <p className="text-muted-foreground">
                                      {order.customer_name}
                                    </p>

                                    <p className="text-muted-foreground">
                                      {order.phone}
                                    </p>

                                    <p className="text-muted-foreground">
                                      {order.shipping_address},{" "}
                                      {order.shipping_city}{" "}
                                      {order.shipping_postal_code}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="font-medium">Items</p>

                                    <div className="mt-1 space-y-1 text-muted-foreground">
                                      {order.items.map((item) => (
                                        <p
                                          key={`${order.order_number}-${item.title}`}
                                        >
                                          {item.quantity}x {item.title} by{" "}
                                          {item.artist_name} -{" "}
                                          {formatPeso(item.line_total)}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Payment Status
                                </p>

                                <Select
                                  value={order.payment_status}
                                  onValueChange={(value) =>
                                    updateOrder(
                                      order.order_number,
                                      {
                                        paymentStatus: value as PaymentStatus,
                                      },
                                      `Payment updated for ${order.order_number}.`
                                    )
                                  }
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {paymentStatuses.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {pretty(status)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Order Status
                                </p>

                                <Select
                                  value={order.order_status}
                                  onValueChange={(value) =>
                                    updateOrder(
                                      order.order_number,
                                      {
                                        orderStatus: value as OrderStatus,
                                      },
                                      `Order status updated for ${order.order_number}.`
                                    )
                                  }
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {orderStatuses.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {pretty(status)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    isUpdating ||
                                    order.payment_status === "paid"
                                  }
                                  onClick={() =>
                                    updateOrder(
                                      order.order_number,
                                      {
                                        paymentStatus: "paid",
                                      },
                                      `Payment marked paid for ${order.order_number}.`
                                    )
                                  }
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Mark Paid
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isUpdating ||
                                    order.order_status === "processing"
                                  }
                                  onClick={() =>
                                    updateOrder(
                                      order.order_number,
                                      {
                                        orderStatus: "processing",
                                      },
                                      `${order.order_number} is now processing.`
                                    )
                                  }
                                >
                                  Process
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isUpdating ||
                                    order.order_status === "completed"
                                  }
                                  onClick={() =>
                                    updateOrder(
                                      order.order_number,
                                      {
                                        orderStatus: "completed",
                                        paymentStatus:
                                          order.payment_status === "pending" &&
                                          order.payment_method === "cod"
                                            ? "paid"
                                            : order.payment_status,
                                      },
                                      `${order.order_number} completed.`
                                    )
                                  }
                                >
                                  Complete
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  disabled={
                                    isUpdating ||
                                    order.order_status === "cancelled"
                                  }
                                  onClick={() =>
                                    updateOrder(
                                      order.order_number,
                                      {
                                        orderStatus: "cancelled",
                                      },
                                      `${order.order_number} cancelled.`
                                    )
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle>Inventory Watch</CardTitle>
                </CardHeader>

                <CardContent>
                  {summary.lowStock.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Inventory is healthy.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {summary.lowStock.map((item) => (
                        <div
                          key={`${item.title}-${item.artist_name}`}
                          className="rounded-lg border p-3"
                        >
                          <p className="font-medium">{item.title}</p>

                          <p className="text-xs text-muted-foreground">
                            {item.artist_name}
                          </p>

                          <p className="mt-2 text-sm">
                            Only {item.stock_quantity} left
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}