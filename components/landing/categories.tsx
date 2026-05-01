"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type HomeCollection = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  artworkCount: number;
};

const fallbackCollections: HomeCollection[] = [
  { id: 1, name: "Contemporary Masters", description: "Featuring works by renowned contemporary Filipino artists", artworkCount: 24, imageUrl: "/artworks/bencab-sabel.jpg" },
  { id: 2, name: "Classical Heritage", description: "Timeless pieces from the masters of Filipino classical art", artworkCount: 18, imageUrl: "/artworks/amorsolo-mayon.jpg" },
  { id: 3, name: "Modern Expressions", description: "Bold, contemporary works pushing artistic boundaries", artworkCount: 32, imageUrl: "/artworks/deejae-jeepney.jpg" },
  { id: 4, name: "Emerging Artists", description: "Discover new talents and fresh perspectives in Philippine art", artworkCount: 15, imageUrl: "/artworks/ventura-terraces.jpg" },
];

function cleanImage(value: unknown, fallback: string) {
  const image = String(value || "").trim();
  if (!image || image.includes("/images/products/") || image.includes("placeholder")) return fallback;
  return image;
}

export function Categories() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [collections, setCollections] = useState<HomeCollection[]>(fallbackCollections);

  useEffect(() => {
    let cancelled = false;

    async function loadCollections() {
      try {
        const response = await fetch(`/api/collections?t=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.collections)) return;

        const mapped = data.collections.slice(0, 4).map((collection: any, index: number) => {
          const fallback = fallbackCollections[index] || fallbackCollections[0];
          return {
            id: Number(collection.id || fallback.id),
            name: String(collection.name || fallback.name),
            description: String(collection.description || fallback.description),
            artworkCount: Number(collection.artworkCount || fallback.artworkCount),
            imageUrl: cleanImage(collection.imageUrl || collection.heroImageUrl, fallback.imageUrl),
          };
        });

        if (!cancelled && mapped.length) setCollections(mapped);
      } catch {
        // Keep safe default cards if MySQL is not running yet.
      }
    }

    loadCollections();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section ref={containerRef} className="py-20 md:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-sm text-accent font-medium tracking-wide uppercase">Browse By Category</p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground">Explore Our Collections</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((collection, i) => (
            <CategoryCard key={collection.id} collection={collection} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ collection, index, isInView }: { collection: HomeCollection; index: number; isInView: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const fallbackImage = fallbackCollections[index]?.imageUrl || "/placeholder.jpg";

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: index * 0.08 }}>
      <Link href={`/collections/${collection.id}`}>
        <motion.div className="relative overflow-hidden rounded aspect-[16/10]" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <motion.img
            src={collection.imageUrl || fallbackImage}
            alt={collection.name}
            className="absolute inset-0 h-full w-full object-cover"
            animate={{ scale: isHovered ? 1.03 : 1 }}
            transition={{ duration: 0.4 }}
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
            <span className="text-xs tracking-wide uppercase text-white/70">{collection.artworkCount} items</span>
            <h3 className="mt-1 font-serif text-xl md:text-2xl text-white">{collection.name}</h3>
            <p className="mt-1 text-sm text-white/70 max-w-xs">{collection.description}</p>
          </div>
          <motion.div className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm" animate={{ scale: isHovered ? 1 : 0.9, opacity: isHovered ? 1 : 0.6 }} transition={{ duration: 0.2 }}>
            <ArrowUpRight className="h-4 w-4 text-white" />
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
