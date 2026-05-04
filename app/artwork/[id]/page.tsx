"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Heart,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArtworkFeedback } from "@/components/artwork/artwork-feedback";

type Artwork = {
  id?: number;
  artwork_id?: number;
  title?: string;
  artwork_title?: string;
  name?: string;
  artist_name?: string;
  artist?: string;
  description?: string;
  artwork_description?: string;
  image_url?: string;
  image?: string;
  artwork_image?: string;
  price?: number | string;
  sale_price?: number | string;
  stock_quantity?: number;
  stock?: number;
  category?: string;
  medium?: string;
  dimensions?: string;
  status?: string;
};

function getArtworkId(artwork: Artwork | null) {
  return Number(artwork?.artwork_id || artwork?.id || 0);
}

function getArtworkTitle(artwork: Artwork | null) {
  return (
    artwork?.title ||
    artwork?.artwork_title ||
    artwork?.name ||
    "Untitled Artwork"
  );
}

function getArtworkArtist(artwork: Artwork | null) {
  return artwork?.artist_name || artwork?.artist || "Galeria Artist";
}

function getArtworkDescription(artwork: Artwork | null) {
  return (
    artwork?.description ||
    artwork?.artwork_description ||
    "A curated artwork from Galeria Butuan City."
  );
}

function getArtworkImage(artwork: Artwork | null) {
  return (
    artwork?.image_url ||
    artwork?.artwork_image ||
    artwork?.image ||
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=1200&auto=format&fit=crop"
  );
}

function getArtworkPrice(artwork: Artwork | null) {
  const salePrice = Number(artwork?.sale_price || 0);
  const regularPrice = Number(artwork?.price || 0);

  if (salePrice > 0) {
    return salePrice;
  }

  return regularPrice;
}

function getArtworkStock(artwork: Artwork | null) {
  return Number(artwork?.stock_quantity ?? artwork?.stock ?? 0);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));
}

function readCartItems() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem("galeria_cart");

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed.items)) {
      return parsed.items;
    }

    return [];
  } catch {
    return [];
  }
}

export default function ArtworkDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const artworkId = params?.id;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadArtwork() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/artworks/${artworkId}`, {
          cache: "no-store",
        });

        const result = await response.json();

        const artworkData =
          result.artwork || result.data || result.item || result.result || result;

        if (!response.ok || !artworkData) {
          setError("Artwork not found.");
          setArtwork(null);
          return;
        }

        setArtwork(artworkData);
      } catch {
        setError("Unable to load artwork.");
        setArtwork(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (artworkId) {
      loadArtwork();
    }
  }, [artworkId]);

  const title = getArtworkTitle(artwork);
  const artist = getArtworkArtist(artwork);
  const description = getArtworkDescription(artwork);
  const imageUrl = getArtworkImage(artwork);
  const price = getArtworkPrice(artwork);
  const stock = getArtworkStock(artwork);
  const numericArtworkId = getArtworkId(artwork);

  const isAvailable = useMemo(() => {
    if (!artwork) {
      return false;
    }

    if (artwork.status && String(artwork.status).toLowerCase() === "sold") {
      return false;
    }

    return stock > 0;
  }, [artwork, stock]);

  const addToCart = () => {
    if (!artwork || !numericArtworkId) {
      setError("Artwork is missing.");
      return;
    }

    if (!isAvailable) {
      setError("This artwork is not available.");
      return;
    }

    const cartItems = readCartItems();

    const existingIndex = cartItems.findIndex((item: any) => {
      return Number(item.artwork_id || item.id) === numericArtworkId;
    });

    if (existingIndex >= 0) {
      cartItems[existingIndex] = {
        ...cartItems[existingIndex],
        quantity: Number(cartItems[existingIndex].quantity || 1) + quantity,
      };
    } else {
      cartItems.push({
        artwork_id: numericArtworkId,
        id: numericArtworkId,
        title,
        artwork_title: title,
        artist_name: artist,
        image_url: imageUrl,
        price,
        quantity,
      });
    }

    localStorage.setItem("galeria_cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("galeria-cart-change"));

    setNotice("Artwork added to cart.");
    setError("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <main className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="rounded-[2rem] border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Loading artwork...</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (error && !artwork) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <main className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="rounded-[2rem] border border-border bg-card p-10 text-center">
            <p className="text-lg font-black">{error}</p>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Go Back
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
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
          Back to Shop
        </Link>

        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
            <img
              src={imageUrl}
              alt={title}
              className="h-[420px] w-full object-cover md:h-[620px]"
            />
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <Star className="h-4 w-4" />
              Featured Artwork
            </div>

            <h1 className="font-serif text-4xl uppercase tracking-wide md:text-5xl">
              {title}
            </h1>

            <p className="mt-3 text-lg font-bold text-muted-foreground">
              {artist}
            </p>

            <p className="mt-6 leading-8 text-muted-foreground">
              {description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Price
                </p>
                <p className="mt-2 text-2xl font-black">
                  {formatMoney(price)}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Stock
                </p>
                <p className="mt-2 text-2xl font-black">
                  {stock > 0 ? `${stock} available` : "Sold out"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Category
                </p>
                <p className="mt-2 font-bold">
                  {artwork?.category || "Gallery Collection"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Medium
                </p>
                <p className="mt-2 font-bold">
                  {artwork?.medium || artwork?.dimensions || "Fine Art Print"}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <p className="font-black">Order This Artwork</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="flex h-12 w-12 items-center justify-center hover:bg-muted"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="flex h-12 min-w-14 items-center justify-center border-x border-border px-4 font-black">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) =>
                        stock > 0 ? Math.min(stock, value + 1) : value + 1
                      )
                    }
                    className="flex h-12 w-12 items-center justify-center hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!isAvailable}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>

                <Link
                  href="/cart"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-6 text-sm font-black transition hover:bg-muted"
                >
                  View Cart
                </Link>
              </div>

              {notice && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  {notice}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
            >
              <Heart className="h-4 w-4" />
              Save to wishlist
            </button>
          </div>
        </section>

        {numericArtworkId > 0 && (
          <ArtworkFeedback artworkId={numericArtworkId} artworkTitle={title} />
        )}
      </main>

      <Footer />
    </div>
  );
}