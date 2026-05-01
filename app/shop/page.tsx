"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Filter, Grid, Heart, List, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low", "Name: A-Z"];
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

type Artwork = {
  id: number;
  title: string;
  artist: string;
  description?: string;
  price: number;
  image: string;
  category: string;
  medium: string;
  dimensions: string;
  stock: number;
};

export default function ShopPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadArtworks = useCallback(async () => {
    try {
      const response = await fetch(`/api/artworks?ts=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.artworks)) throw new Error(result.error || "Unable to load artworks.");
      setArtworks(result.artworks);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load live artworks from MySQL.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArtworks();
    const onFocus = () => loadArtworks();
    window.addEventListener("focus", onFocus);
    const refreshTimer = window.setInterval(loadArtworks, 30000);
    return () => { window.removeEventListener("focus", onFocus); window.clearInterval(refreshTimer); };
  }, [loadArtworks]);

  const maxPrice = useMemo(() => Math.max(150000, ...artworks.map((artwork) => Number(artwork.price) || 0)), [artworks]);
  useEffect(() => { setPriceRange(([min, max]) => [min, Math.max(max, maxPrice)]); }, [maxPrice]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(artworks.map((artwork) => artwork.category).filter(Boolean))).sort()], [artworks]);

  const filteredArtworks = artworks.filter((artwork) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = artwork.title.toLowerCase().includes(query) || artwork.artist.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === "All" || artwork.category === selectedCategory;
    const matchesPrice = artwork.price >= priceRange[0] && artwork.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    switch (sortBy) {
      case "Price: Low to High": return a.price - b.price;
      case "Price: High to Low": return b.price - a.price;
      case "Name: A-Z": return a.title.localeCompare(b.title);
      case "Newest":
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main ref={containerRef} className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="mb-10">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-accent">Art Collection</p>
          <h1 className="mb-4 font-serif text-2xl text-foreground sm:text-3xl md:text-4xl">Shop Artworks</h1>
          <p className="max-w-2xl text-muted-foreground">Discover live artwork listings from your MySQL storefront inventory. Admin changes refresh here automatically on reload, focus, and periodic refresh.</p>
        </motion.div>

        {error && <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8 flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search artworks or artists..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-12 border-border/70 bg-background pl-10 text-foreground" /></div>
          <div className="flex flex-wrap gap-2">
            <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="h-12 w-48 border-border/70 bg-background text-foreground"><SelectValue /></SelectTrigger><SelectContent>{sortOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
            <div className="flex rounded-md border border-border/70"><Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-12 rounded-r-none" aria-label="Grid view"><Grid className="h-4 w-4" /></Button><Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-12 rounded-l-none" aria-label="List view"><List className="h-4 w-4" /></Button></div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-12 border-border/70 lg:hidden"><Filter className="mr-2 h-4 w-4" />Filters</Button>
          </div>
        </motion.div>

        <div className="flex gap-8">
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className={`${showFilters ? "block" : "hidden"} w-64 flex-shrink-0 lg:block`}>
            <div className="space-y-6 rounded-lg border border-border/70 bg-card p-6 text-card-foreground">
              <div><h3 className="mb-4 font-medium tracking-wide text-foreground">Categories</h3><div className="space-y-2">{categories.map((category) => <label key={category} className="flex cursor-pointer items-center gap-2 text-sm text-foreground"><input type="radio" name="category" value={category} checked={selectedCategory === category} onChange={(event) => setSelectedCategory(event.target.value)} className="accent-primary" /><span>{category}</span></label>)}</div></div>
              <div><h3 className="mb-4 font-medium tracking-wide text-foreground">Price Range</h3><div className="space-y-4"><Slider value={priceRange} onValueChange={(value) => setPriceRange(value as [number, number])} max={maxPrice} step={5000} className="w-full" /><div className="flex justify-between text-sm text-muted-foreground"><span>{peso.format(priceRange[0])}</span><span>{peso.format(priceRange[1])}</span></div></div></div>
            </div>
          </motion.aside>

          <div className="flex-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }} className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-muted-foreground">{isLoading ? "Loading live artworks..." : `Showing ${sortedArtworks.length} ${sortedArtworks.length === 1 ? "artwork" : "artworks"}`}</p><Button variant="ghost" size="sm" onClick={loadArtworks}>Refresh live data</Button></motion.div>
            {viewMode === "grid" ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{sortedArtworks.map((artwork, i) => <ArtworkCard key={artwork.id} artwork={artwork} index={i} isInView={isInView} />)}</div> : <div className="space-y-4">{sortedArtworks.map((artwork, i) => <ArtworkListItem key={artwork.id} artwork={artwork} index={i} isInView={isInView} />)}</div>}
            {!isLoading && sortedArtworks.length === 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center"><p className="mb-4 text-muted-foreground">No active artworks found matching your criteria.</p><Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setPriceRange([0, maxPrice]); }}>Clear Filters</Button></motion.div>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ArtworkCard({ artwork, index, isInView }: { artwork: Artwork; index: number; isInView: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  return (
    <motion.article initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: index * 0.08 }} className="group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Link href={`/artwork/${artwork.id}`}><div className="relative aspect-[3/4] overflow-hidden rounded bg-muted"><motion.img src={artwork.image} alt={artwork.title} className="h-full w-full object-cover" animate={{ scale: isHovered ? 1.03 : 1 }} transition={{ duration: 0.4 }} /><span className="absolute left-3 top-3 rounded border border-border/60 bg-background/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground backdrop-blur-sm">{artwork.category}</span><button onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIsLiked(!isLiked); }} className="absolute right-3 top-3" aria-label="Favorite"><motion.div whileTap={{ scale: 0.9 }} className={`rounded-full p-2 transition-colors ${isLiked ? "bg-accent text-accent-foreground" : "border border-border/60 bg-background/95 text-muted-foreground backdrop-blur-sm hover:text-foreground"}`}><Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} /></motion.div></button><motion.div className="absolute inset-x-3 bottom-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }} transition={{ duration: 0.2 }}><Button className="h-10 w-full border border-border/60 bg-background text-sm font-medium text-foreground backdrop-blur-sm hover:bg-muted">Quick View</Button></motion.div></div></Link>
      <div className="mt-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-serif text-lg text-foreground">{artwork.title}</h3><p className="text-sm text-muted-foreground">{artwork.artist}</p></div><p className="whitespace-nowrap text-sm font-medium text-foreground">{peso.format(artwork.price)}</p></div><p className="mt-1 text-xs text-muted-foreground">{artwork.stock > 0 ? `${artwork.stock} in stock` : "Sold out"}</p></div>
    </motion.article>
  );
}

function ArtworkListItem({ artwork, index, isInView }: { artwork: Artwork; index: number; isInView: boolean }) {
  const [isLiked, setIsLiked] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: index * 0.05 }} className="group overflow-hidden rounded-lg border border-border/70 bg-card text-card-foreground transition-shadow hover:shadow-lg">
      <Link href={`/artwork/${artwork.id}`}><div className="p-6"><div className="flex flex-col gap-4 sm:flex-row sm:gap-6"><div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-32"><img src={artwork.image} alt={artwork.title} className="h-full w-full object-cover" />{artwork.stock <= 0 && <Badge className="absolute left-1 top-1" variant="secondary">Sold out</Badge>}</div><div className="flex-1"><div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-serif text-xl text-foreground">{artwork.title}</h3><p className="text-sm text-muted-foreground">by {artwork.artist}</p></div><div className="text-right"><p className="font-medium text-foreground">{peso.format(artwork.price)}</p><p className="text-xs text-muted-foreground">{artwork.stock} in stock</p></div></div><div className="mb-4 flex gap-2"><Badge variant="secondary">{artwork.category}</Badge>{artwork.medium && <Badge variant="outline">{artwork.medium}</Badge>}</div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{artwork.dimensions}</p><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIsLiked(!isLiked); }}><Heart className={`h-4 w-4 ${isLiked ? "fill-current text-accent" : ""}`} /></Button><Button size="sm" disabled={artwork.stock <= 0}><ShoppingBag className="mr-2 h-4 w-4" />View Details<ArrowRight className="ml-2 h-4 w-4" /></Button></div></div></div></div></div></Link>
    </motion.div>
  );
}
