"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ShoppingBag } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

type CartItem = {
  artwork_id?: number;
  artworkId?: number;
  id?: number;
  title?: string;
  artwork_title?: string;
  name?: string;
  artist_name?: string;
  artist?: string;
  image_url?: string;
  artwork_image?: string;
  image?: string;
  price?: number | string;
  quantity?: number;
  qty?: number;
};

type StoredUser = {
  name?: string;
  full_name?: string;
  email?: string;
  identifier?: string;
};

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: string;
  notes: string;
};

const paymentOptions = [
  {
    label: "Cash on Delivery",
    value: "cash_on_delivery",
  },
  {
    label: "GCash",
    value: "gcash",
  },
  {
    label: "Bank Transfer",
    value: "bank_transfer",
  },
  {
    label: "Pay at Gallery",
    value: "pay_at_gallery",
  },
];

function getItemId(item: CartItem) {
  return Number(item.artwork_id || item.artworkId || item.id || 0);
}

function getItemTitle(item: CartItem) {
  return item.title || item.artwork_title || item.name || "Untitled Artwork";
}

function getItemPrice(item: CartItem) {
  return Number(item.price || 0);
}

function getItemQuantity(item: CartItem) {
  const quantity = Number(item.quantity || item.qty || 1);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value || 0);
}

function normalizeCartItems(items: CartItem[]) {
  return items
    .map((item) => ({
      artwork_id: getItemId(item),
      artworkId: getItemId(item),
      id: getItemId(item),
      title: getItemTitle(item),
      artwork_title: getItemTitle(item),
      artist_name: item.artist_name || item.artist || "Galeria Artist",
      image_url:
        item.image_url ||
        item.artwork_image ||
        item.image ||
        "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop",
      price: getItemPrice(item),
      quantity: getItemQuantity(item),
      qty: getItemQuantity(item),
    }))
    .filter((item) => item.artwork_id > 0);
}

function readCartFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  const possibleKeys = [
    "galeria_cart",
    "cart",
    "galeriaCart",
    "artspace_cart",
    "shopping_cart",
  ];

  for (const key of possibleKeys) {
    try {
      const stored = localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        const normalized = normalizeCartItems(parsed);

        if (normalized.length > 0) {
          return normalized;
        }
      }

      if (Array.isArray(parsed.items)) {
        const normalized = normalizeCartItems(parsed.items);

        if (normalized.length > 0) {
          return normalized;
        }
      }
    } catch {
      // Try next cart key.
    }
  }

  return [];
}

function readStoredUser(): StoredUser {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem("galeria_user");

    if (!stored) {
      return {};
    }

    return JSON.parse(stored) as StoredUser;
  } catch {
    return {};
  }
}

function getUserName(user: StoredUser) {
  return user.name || user.full_name || user.email || user.identifier || "";
}

function getUserEmail(user: StoredUser) {
  return user.email || user.identifier || "";
}

function getPaymentLabel(value: string) {
  return (
    paymentOptions.find((option) => option.value === value)?.label || value
  );
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "Butuan City",
    paymentMethod: "cash_on_delivery",
    notes: "",
  });

  useEffect(() => {
    const cartItems = readCartFromStorage();
    const user = readStoredUser();

    setItems(cartItems);

    setForm((current) => ({
      ...current,
      fullName: getUserName(user),
      email: getUserEmail(user),
    }));

    setIsLoaded(true);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + getItemPrice(item) * getItemQuantity(item);
    }, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((total, item) => {
      return total + getItemQuantity(item);
    }, 0);
  }, [items]);

  function updateForm(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const city = form.city.trim();
    const notes = form.notes.trim();
    const paymentLabel = getPaymentLabel(form.paymentMethod);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!fullName || !email || !phone || !address || !city) {
      setError("Complete contact and shipping details are required.");
      return;
    }

    if (!form.paymentMethod) {
      setError("Payment method is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedOrderNumber = `GM-${Date.now()}`;

      const mappedItems = items.map((item) => {
        const artworkId = getItemId(item);
        const title = getItemTitle(item);
        const price = getItemPrice(item);
        const quantity = getItemQuantity(item);
        const lineSubtotal = price * quantity;

        return {
          artwork_id: artworkId,
          artworkId,
          id: artworkId,
          product_id: artworkId,
          productId: artworkId,

          title,
          name: title,
          artwork_title: title,

          price,
          unit_price: price,
          unitPrice: price,

          quantity,
          qty: quantity,

          subtotal: lineSubtotal,
          line_total: lineSubtotal,
          lineTotal: lineSubtotal,
        };
      });

      const payload = {
        order_number: generatedOrderNumber,
        orderNumber: generatedOrderNumber,

        customer_name: fullName,
        customerName: fullName,
        full_name: fullName,
        fullName,
        name: fullName,

        customer_email: email,
        customerEmail: email,
        email,

        customer_phone: phone,
        customerPhone: phone,
        phone,
        phone_number: phone,
        phoneNumber: phone,
        contact_number: phone,
        contactNumber: phone,

        delivery_address: address,
        deliveryAddress: address,
        shipping_address: address,
        shippingAddress: address,
        address,

        city,
        shipping_city: city,
        shippingCity: city,

        payment_method: form.paymentMethod,
        paymentMethod: form.paymentMethod,
        payment_label: paymentLabel,
        paymentLabel,

        notes,
        order_notes: notes,
        orderNotes: notes,

        total_amount: subtotal,
        totalAmount: subtotal,
        total: subtotal,
        subtotal,

        status: "pending",
        order_status: "pending",
        orderStatus: "pending",

        payment_status: "unpaid",
        paymentStatus: "unpaid",

        items: mappedItems,
        order_items: mappedItems,
        orderItems: mappedItems,

        customer: {
          name: fullName,
          fullName,
          full_name: fullName,
          email,
          phone,
          phoneNumber: phone,
          phone_number: phone,
        },

        shipping: {
          address,
          deliveryAddress: address,
          delivery_address: address,
          shippingAddress: address,
          shipping_address: address,
          city,
        },

        contact: {
          name: fullName,
          email,
          phone,
        },
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result: any = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Unable to place order.");
      }

      const finalOrderNumber =
        result.order_number ||
        result.orderNumber ||
        result.order?.order_number ||
        result.order?.orderNumber ||
        generatedOrderNumber;

      localStorage.removeItem("galeria_cart");
      localStorage.removeItem("cart");
      localStorage.removeItem("galeriaCart");
      localStorage.removeItem("artspace_cart");
      localStorage.removeItem("shopping_cart");

      window.dispatchEvent(new Event("galeria-cart-change"));

      setItems([]);
      setOrderNumber(finalOrderNumber);
      setSuccessMessage("Your order was placed successfully.");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to place order.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <section className="mb-8 rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">
            Galeria Checkout
          </p>

          <h1 className="mt-2 font-serif text-4xl uppercase tracking-wide">
            Checkout
          </h1>

          <p className="mt-2 text-muted-foreground">
            Confirm your delivery details and place your order.
          </p>
        </section>

        {successMessage ? (
          <section className="rounded-[2rem] border border-green-500/30 bg-green-500/10 p-10 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-600" />

            <h2 className="text-3xl font-black">Order Submitted</h2>

            <p className="mt-3 text-muted-foreground">{successMessage}</p>

            {orderNumber && (
              <p className="mt-4 text-lg font-black">Order: {orderNumber}</p>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/customer/dashboard"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90"
              >
                Go to Dashboard
              </Link>

              <Link
                href="/shop"
                className="rounded-xl border border-border px-6 py-3 text-sm font-black transition hover:bg-muted"
              >
                Continue Shopping
              </Link>
            </div>
          </section>
        ) : !isLoaded ? (
          <section className="rounded-[2rem] border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Loading checkout...</p>
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-[2rem] border border-border bg-card p-10 text-center">
            <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-primary" />

            <h2 className="text-2xl font-black">Your cart is empty.</h2>

            <p className="mt-2 text-muted-foreground">
              Add artworks to your cart before checking out.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90"
            >
              Browse Artworks
            </Link>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-8 lg:grid-cols-[1fr_380px]"
          >
            <section className="space-y-6">
              <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-black">Customer Information</h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Full Name
                    </label>

                    <input
                      value={form.fullName}
                      onChange={(event) =>
                        updateForm("fullName", event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Email
                    </label>

                    <input
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                      type="email"
                      className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Phone Number
                    </label>

                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateForm("phone", event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                      placeholder="+63 900 000 0000"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      City
                    </label>

                    <input
                      value={form.city}
                      onChange={(event) =>
                        updateForm("city", event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                      placeholder="Butuan City"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-black">Delivery Details</h2>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Delivery Address
                    </label>

                    <textarea
                      value={form.address}
                      onChange={(event) =>
                        updateForm("address", event.target.value)
                      }
                      className="min-h-28 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                      placeholder="House number, street, barangay, city"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Notes
                    </label>

                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        updateForm("notes", event.target.value)
                      }
                      className="min-h-24 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                      placeholder="Optional notes for the gallery"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-black">Payment Method</h2>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {paymentOptions.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => updateForm("paymentMethod", method.value)}
                      className={`rounded-xl border px-4 py-4 text-left text-sm font-black transition ${
                        form.paymentMethod === method.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-600">
                  {error}
                </div>
              )}
            </section>

            <aside className="h-fit rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-black">Order Summary</h2>

              <div className="mt-6 space-y-4">
                {items.map((item) => {
                  const artworkId = getItemId(item);
                  const title = getItemTitle(item);
                  const quantity = getItemQuantity(item);
                  const price = getItemPrice(item);

                  return (
                    <div
                      key={artworkId}
                      className="flex items-start justify-between gap-4 border-b border-border pb-4"
                    >
                      <div>
                        <p className="font-bold">{title}</p>

                        <p className="text-sm text-muted-foreground">
                          Qty: {quantity}
                        </p>
                      </div>

                      <p className="font-black">
                        {formatMoney(price * quantity)}
                      </p>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-bold">{itemCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{formatMoney(subtotal)}</span>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black">Total</span>
                    <span className="text-2xl font-black">
                      {formatMoney(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting Order..." : "Place Order"}
              </button>

              <Link
                href="/cart"
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-black transition hover:bg-muted"
              >
                Back to Cart
              </Link>
            </aside>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}