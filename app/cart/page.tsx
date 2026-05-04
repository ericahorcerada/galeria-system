"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

type CartItem = {
  artwork_id?: number;
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

function getItemId(item: CartItem) {
  return Number(item.artwork_id || item.id || 0);
}

function getItemTitle(item: CartItem) {
  return item.title || item.artwork_title || item.name || "Untitled Artwork";
}

function getItemArtist(item: CartItem) {
  return item.artist_name || item.artist || "Galeria Artist";
}

function getItemImage(item: CartItem) {
  return (
    item.image_url ||
    item.artwork_image ||
    item.image ||
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop"
  );
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
      id: getItemId(item),
      title: getItemTitle(item),
      artwork_title: getItemTitle(item),
      artist_name: getItemArtist(item),
      image_url: getItemImage(item),
      price: getItemPrice(item),
      quantity: getItemQuantity(item),
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
      // Try next key.
    }
  }

  return [];
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeCartItems(items);

  localStorage.setItem("galeria_cart", JSON.stringify(normalized));
  window.dispatchEvent(new Event("galeria-cart-change"));
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const cartItems = readCartFromStorage();

    setItems(cartItems);
    saveCart(cartItems);
    setIsLoaded(true);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + getItemPrice(item) * getItemQuantity(item);
    }, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((total, item) => total + getItemQuantity(item), 0);
  }, [items]);

  function updateQuantity(artworkId: number, nextQuantity: number) {
    const updatedItems = items.map((item) => {
      if (getItemId(item) !== artworkId) {
        return item;
      }

      return {
        ...item,
        quantity: Math.max(1, nextQuantity),
      };
    });

    setItems(updatedItems);
    saveCart(updatedItems);
  }

  function removeItem(artworkId: number) {
    const updatedItems = items.filter((item) => getItemId(item) !== artworkId);

    setItems(updatedItems);
    saveCart(updatedItems);
  }

  function clearCart() {
    setItems([]);
    saveCart([]);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <section className="mb-8 rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                Galeria Cart
              </p>

              <h1 className="mt-2 font-serif text-4xl uppercase tracking-wide">
                Your Cart
              </h1>

              <p className="mt-2 text-muted-foreground">
                {itemCount > 0
                  ? `${itemCount} item${itemCount === 1 ? "" : "s"} ready for checkout.`
                  : "Your cart is empty."}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-xl border border-border px-5 py-3 text-sm font-bold transition hover:bg-muted"
              >
                Clear Cart
              </button>
            )}
          </div>
        </section>

        {!isLoaded ? (
          <section className="rounded-[2rem] border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Loading cart...</p>
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-sm">
            <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-primary" />

            <h2 className="text-2xl font-black">No items in cart.</h2>

            <p className="mt-2 text-muted-foreground">
              Browse artworks and add your favorite pieces to your cart.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90"
            >
              Browse Artworks
            </Link>
          </section>
        ) : (
          <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => {
                const artworkId = getItemId(item);
                const title = getItemTitle(item);
                const artist = getItemArtist(item);
                const image = getItemImage(item);
                const price = getItemPrice(item);
                const quantity = getItemQuantity(item);

                return (
                  <article
                    key={artworkId}
                    className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                      <Link
                        href={`/artwork/${artworkId}`}
                        className="overflow-hidden rounded-2xl bg-muted"
                      >
                        <img
                          src={image}
                          alt={title}
                          className="h-36 w-full object-cover transition hover:scale-105"
                        />
                      </Link>

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <Link
                            href={`/artwork/${artworkId}`}
                            className="text-xl font-black transition hover:text-primary"
                          >
                            {title}
                          </Link>

                          <p className="mt-1 text-sm font-semibold text-muted-foreground">
                            {artist}
                          </p>

                          <p className="mt-4 text-lg font-black">
                            {formatMoney(price)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center rounded-xl border border-border">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(artworkId, quantity - 1)
                              }
                              className="flex h-11 w-11 items-center justify-center hover:bg-muted"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <span className="flex h-11 min-w-12 items-center justify-center border-x border-border px-4 font-black">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(artworkId, quantity + 1)
                              }
                              className="flex h-11 w-11 items-center justify-center hover:bg-muted"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <p className="min-w-28 text-right font-black">
                            {formatMoney(price * quantity)}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeItem(artworkId)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="h-fit rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-black">Order Summary</h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-bold">{itemCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{formatMoney(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-bold">Calculated at checkout</span>
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

              <Link
                href="/checkout"
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/shop"
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-black transition hover:bg-muted"
              >
                Continue Shopping
              </Link>
            </aside>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}