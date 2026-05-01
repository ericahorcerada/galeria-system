"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";

type Collection = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  artworkCount: number;
  exploreButtonText: string;
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCollections() {
      try {
        setLoading(true);
        const response = await fetch(`/api/collections?t=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load collections.");
        if (active) setCollections(data.collections || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load collections.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCollections();
    return () => {
      active = false;
    };
  }, []);

  const filteredCollections = useMemo(() => {
    return collections
      .filter((collection) => collection.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "artworks") return b.artworkCount - a.artworkCount;
        return 0;
      });
  }, [collections, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="featured">Featured</option>
                <option value="name">Name (A-Z)</option>
                <option value="artworks">Most Artworks</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-12 text-center">
            <h1 className="mb-4 font-serif text-4xl text-foreground">
              {searchTerm ? `Search Results for "${searchTerm}"` : "Art Collections"}
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              {searchTerm
                ? `Found ${filteredCollections.length} collection${filteredCollections.length !== 1 ? "s" : ""} matching your search.`
                : `Explore our ${collections.length} curated collections featuring works from established masters and emerging talents in the Philippine art scene.`}
            </p>
          </div>

          {loading ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">Loading collections...</div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center text-destructive">{error}</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <Link href={`/collections/${collection.id}`}>
                    <div className="flex h-[500px] cursor-pointer flex-col overflow-hidden rounded-lg bg-card transition-all duration-300 hover:shadow-lg">
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-90" />
                        <img
                          src={collection.imageUrl || "/placeholder.jpg"}
                          alt={collection.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(event) => {
                            const target = event.target as HTMLImageElement;
                            target.src = "/placeholder.jpg";
                          }}
                        />
                        <div className="absolute left-4 top-4 z-20">
                          <Badge variant="secondary" className="bg-background/95 text-xs backdrop-blur-sm">
                            {collection.artworkCount} Artworks
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="mb-2 line-clamp-2 text-xl font-bold text-foreground">{collection.name}</h3>
                        <p className="mb-4 line-clamp-3 flex-grow leading-relaxed text-muted-foreground">{collection.description}</p>
                        <div className="mt-auto">
                          <Button variant="outline" size="sm" className="w-full bg-background/95 backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                            {collection.exploreButtonText || "Explore Collection"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
