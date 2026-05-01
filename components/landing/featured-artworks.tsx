"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Heart, X, Eye, Plus, Minus, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart-context";
import Link from "next/link";

const artworks = [
  {
    id: 1,
    title: "Butuan City Bay Golden Hour",
    artist: "Isabel Reyes",
    price: 4200,
    image: "/artworks/aznar-manilabay.jpg",
    category: "Photography",
    medium: "Archival pigment print",
    dimensions: "18 x 24 inches",
    stock: 12,
  },
  {
    id: 2,
    title: "Bahay Kubo Afternoon",
    artist: "Miguel Abrigo",
    price: 3800,
    image: "/artworks/abrigo-bahay.jpg",
    category: "Traditional Filipino",
    medium: "Fine art print",
    dimensions: "18 x 24 inches",
    stock: 10,
  },
  {
    id: 3,
    title: "Mayon Afterglow",
    artist: "Clara Santos",
    price: 5600,
    image: "/artworks/amorsolo-mayon.jpg",
    category: "Nature & Landscape",
    medium: "Archival pigment print",
    dimensions: "20 x 30 inches",
    stock: 8,
  },
  {
    id: 4,
    title: "Harvest Light",
    artist: "Rafael Cruz",
    price: 6500,
    image: "/artworks/amorsolo-rice.jpg",
    category: "Traditional Filipino",
    medium: "Canvas print",
    dimensions: "24 x 36 inches",
    stock: 6,
  },
  {
    id: 5,
    title: "Sabel in Motion",
    artist: "Nina Caballero",
    price: 7800,
    image: "/artworks/bencab-sabel.jpg",
    category: "Contemporary Art",
    medium: "Giclee print on cotton rag",
    dimensions: "18 x 24 inches",
    stock: 5,
  },
  {
    id: 6,
    title: "Spoliarium Memory Study",
    artist: "Andres Luna Studio",
    price: 9200,
    image: "/artworks/bencab-spoliarium.jpg",
    category: "Classical",
    medium: "Fine art reproduction print",
    dimensions: "24 x 36 inches",
    stock: 4,
  },
];

export function FeaturedArtworks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [liveArtworks, setLiveArtworks] = useState(artworks);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveArtworks() {
      try {
        const response = await fetch(`/api/artworks?ts=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
        const result = await response.json();
        if (!isMounted || !response.ok || !result.success || !Array.isArray(result.artworks)) return;
        setLiveArtworks(result.artworks.slice(0, 6));
      } catch {}
    }
    loadLiveArtworks();
    window.addEventListener("focus", loadLiveArtworks);
    const refreshTimer = window.setInterval(loadLiveArtworks, 30000);
    return () => { isMounted = false; window.removeEventListener("focus", loadLiveArtworks); window.clearInterval(refreshTimer); };
  }, []);

  return (
    <section ref={containerRef} className="py-20 md:py-28 bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-sm text-accent font-medium tracking-wide uppercase">
              Curated Selection
            </p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground">
              Featured Artworks
            </h2>
          </div>
          <Link href="/shop">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground p-0 h-auto">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveArtworks.map((artwork, i) => (
            <ArtworkCard key={artwork.id} artwork={artwork} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArtworkCard({
  artwork,
  index,
  isInView,
}: {
  artwork: (typeof artworks)[0];
  index: number;
  isInView: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const { addItem } = useCart();

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/artwork/${artwork.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden rounded bg-muted">
          <motion.img
            src={artwork.image}
            alt={artwork.title}
            className="h-full w-full object-cover"
            animate={{ scale: isHovered ? 1.03 : 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Category badge */}
          <span className="absolute top-3 left-3 text-[10px] tracking-wide uppercase bg-background/95 backdrop-blur-sm border border-border/50 px-2.5 py-1 rounded text-foreground font-medium">
            {artwork.category}
          </span>

          {/* Like button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="absolute top-3 right-3"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-full transition-colors ${
                isLiked 
                  ? "bg-accent text-accent-foreground" 
                  : "bg-background/95 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            </motion.div>
          </button>

          {/* Quick view */}
          <motion.div
            className="absolute inset-x-3 bottom-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              onClick={() => setShowQuickView(true)}
              className="w-full bg-background text-foreground hover:bg-background/95 border border-border/50 h-10 text-sm font-medium backdrop-blur-sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </motion.div>

          {/* Quick View Modal */}
          <AnimatePresence>
            {showQuickView && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => setShowQuickView(false)}
              >
                <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{artwork.title}</h3>
                    <button
                      onClick={() => setShowQuickView(false)}
                      className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <img
                        src={artwork.image}
                        alt={artwork.title}
                        className="w-full h-48 object-cover rounded"
                      />
                      <div className="mt-4">
                        <h4 className="font-medium text-foreground">{artwork.title}</h4>
                        <p className="text-sm text-muted-foreground">{artwork.artist}</p>
                        <p className="text-xs text-muted-foreground">
                          {artwork.category} • {artwork.medium}
                          {artwork.dimensions && ` • ${artwork.dimensions}`}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold text-foreground">₱{artwork.price.toLocaleString()}</span>
                        <Badge variant="secondary" className="text-xs">
                          {artwork.category}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsLiked(!isLiked)}
                        >
                          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          onClick={() => {
                            const cartItem = {
                              id: artwork.id.toString(),
                              title: artwork.title,
                              artist: artwork.artist,
                              price: artwork.price,
                              image: artwork.image,
                              category: artwork.category,
                              medium: artwork.medium,
                              dimensions: artwork.dimensions,
                              quantity: 1
                            };
                            addItem(cartItem);
                            setShowQuickView(false);
                          }}
                          size="sm"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-lg text-foreground truncate">
              {artwork.title}
            </h3>
            <p className="text-sm text-muted-foreground">{artwork.artist}</p>
          </div>
          <p className="text-sm font-medium text-foreground whitespace-nowrap">
            {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(artwork.price)}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
