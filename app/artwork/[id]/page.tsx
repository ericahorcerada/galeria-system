"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Minus, Plus, Share2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";

type Artwork = { id: number; title: string; artist: string; description: string; category: string; medium: string; dimensions: string; image: string; price: number; stock: number };
function formatPeso(amount: number) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(amount); }

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const artworkId = Number(params.id);
  const { addItem } = useCart();
  const [product, setProduct] = useState<Artwork | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadArtwork = useCallback(async () => {
    if (!Number.isInteger(artworkId) || artworkId <= 0) { setError("Invalid artwork ID."); setIsLoading(false); return; }
    try {
      const response = await fetch(`/api/artworks/${artworkId}?ts=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Artwork not found.");
      setProduct(result.artwork);
      setQuantity((current) => Math.min(current, Math.max(1, Number(result.artwork.stock) || 1)));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load artwork from MySQL.");
      setProduct(null);
    } finally { setIsLoading(false); }
  }, [artworkId]);

  useEffect(() => {
    loadArtwork();
    const onFocus = () => loadArtwork();
    window.addEventListener("focus", onFocus);
    const refreshTimer = window.setInterval(loadArtwork, 30000);
    return () => { window.removeEventListener("focus", onFocus); window.clearInterval(refreshTimer); };
  }, [loadArtwork]);

  if (isLoading) return <div className="min-h-screen bg-background text-foreground"><Header /><main className="mx-auto max-w-7xl px-6 py-20 text-center"><p className="text-muted-foreground">Loading live artwork...</p></main><Footer /></div>;
  if (!product) return <div className="min-h-screen bg-background text-foreground"><Header /><main className="mx-auto max-w-7xl px-6 py-20 text-center"><h1 className="mb-4 text-2xl font-semibold text-foreground">Artwork Not Found</h1>{error && <p className="mb-6 text-sm text-muted-foreground">{error}</p>}<Button asChild><Link href="/shop">Back to Shop</Link></Button></main><Footer /></div>;

  const maxQuantity = Math.max(1, Math.min(99, product.stock || 1));
  const handleAddToCart = () => { addItem({ id: String(product.id), title: product.title, artist: product.artist, price: product.price, image: product.image, category: product.category, medium: product.medium, dimensions: product.dimensions, quantity }); setCartMessage(`${product.title} added to your cart.`); };
  const handleShare = async () => { try { const data = { title: product.title, text: `Check out this artwork: ${product.title} by ${product.artist}`, url: window.location.href }; if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); setShareMessage("Artwork link copied to clipboard."); } } catch { setShareMessage("Unable to share this artwork from your browser."); } };

  return <div className="min-h-screen bg-background text-foreground"><Header /><main className="mx-auto max-w-7xl px-6 py-8"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}><div className="grid items-start gap-12 lg:grid-cols-2"><div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted"><img src={product.image} alt={product.title} className="h-full w-full object-cover" /></div><div className="space-y-6"><nav className="mb-4 flex items-center text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><Link href="/shop" className="hover:text-foreground">Shop</Link><span className="mx-2">/</span><span className="text-foreground">{product.title}</span></nav><div className="space-y-2"><h1 className="font-serif text-2xl text-foreground sm:text-3xl">{product.title}</h1><div className="flex items-center gap-3"><p className="text-lg text-muted-foreground">by {product.artist}</p><button onClick={() => setIsLiked((value) => !value)} className={`rounded-full p-2 transition-colors ${isLiked ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`} aria-label="Favorite"><Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} /></button><button onClick={handleShare} className="rounded-full bg-muted p-2 text-foreground" aria-label="Share"><Share2 className="h-5 w-5" /></button></div>{shareMessage && <p className="text-sm text-muted-foreground">{shareMessage}</p>}{cartMessage && <p className="text-sm text-green-700 dark:text-green-400">{cartMessage}</p>}</div><div className="space-y-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between"><div><span className="text-3xl font-bold text-foreground">{formatPeso(product.price)}</span><p className="text-sm text-muted-foreground">Stock available: {product.stock}</p></div><Button onClick={handleAddToCart} size="lg" disabled={product.stock <= 0}><ShoppingCart className="mr-2 h-4 w-4" />{product.stock <= 0 ? "Sold Out" : "Add to Cart"}</Button></div><div className="space-y-2"><label className="text-sm font-medium text-foreground">Quantity</label><div className="flex items-center gap-4"><Button variant="outline" size="icon" onClick={() => setQuantity((count) => Math.max(1, count - 1))} disabled={quantity <= 1}><Minus className="h-4 w-4" /></Button><span className="w-12 text-center font-medium text-foreground">{quantity}</span><Button variant="outline" size="icon" onClick={() => setQuantity((count) => Math.min(maxQuantity, count + 1))} disabled={quantity >= maxQuantity}><Plus className="h-4 w-4" /></Button></div></div></div><div className="grid gap-4 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground sm:grid-cols-2"><div><p className="font-medium text-foreground">Category</p><p className="text-muted-foreground">{product.category}</p></div><div><p className="font-medium text-foreground">Medium</p><p className="text-muted-foreground">{product.medium || "-"}</p></div><div><p className="font-medium text-foreground">Dimensions</p><p className="text-muted-foreground">{product.dimensions || "-"}</p></div><div><p className="font-medium text-foreground">Fulfillment</p><p className="text-muted-foreground">Inventory is reserved when checkout succeeds.</p></div></div><section className="space-y-3"><h2 className="font-serif text-2xl text-foreground">Artwork Details</h2><p className="leading-relaxed text-muted-foreground">{product.description}</p></section></div></div></motion.div></main><Footer /></div>;
}
