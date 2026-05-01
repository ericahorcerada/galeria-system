"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Artist = {
  artist_id: number;
  name: string;
  alias: string;
  bio: string;
  image_url: string;
  artworks: number;
  featured_work: string;
};

const fallbackArtists: Artist[] = [
  { artist_id: 1, name: "Benedicto Cabrera", alias: "BenCab", bio: "National Artist of the Philippines, known for his iconic Sabel series and depictions of Filipino life and culture.", image_url: "/images/artists/artist-1.svg", artworks: 45, featured_work: "Sabel in the Wind" },
  { artist_id: 2, name: "Fernando Amorsolo", alias: "Grand Old Man of Philippine Art", bio: "First National Artist, celebrated for his mastery of light and romanticized depictions of Philippine rural life.", image_url: "/images/artists/artist-2.svg", artworks: 38, featured_work: "Rice Planting" },
  { artist_id: 3, name: "Ronald Ventura", alias: "Master of Hyperrealism", bio: "Contemporary artist known for layered imagery combining hyperrealism with pop culture and religious iconography.", image_url: "/images/artists/artist-3.svg", artworks: 32, featured_work: "Grayground" },
  { artist_id: 4, name: "Ang Kiukok", alias: "Master of Philippine Expressionism", bio: "Known for his powerful visual imagery, angular forms, and emotionally charged paintings.", image_url: "/images/artists/artist-4.svg", artworks: 28, featured_work: "Fishermen of Batangas" },
  { artist_id: 5, name: "Juan Luna", alias: "Filipino Master", bio: "One of the first Filipino artists to gain international recognition, known for historical and allegorical works.", image_url: "/images/artists/artist-5.svg", artworks: 15, featured_work: "Portrait of a Filipina" },
  { artist_id: 6, name: "Vicente Manansala", alias: "Transparent Cubism Pioneer", bio: "National Artist known for developing transparent cubism and interpreting Filipino life through layered forms.", image_url: "/images/artists/artist-6.svg", artworks: 22, featured_work: "Chocolate Hills of Bohol" },
  { artist_id: 7, name: "Arturo Luz", alias: "Modernist Master", bio: "National Artist recognized for elegant minimalist compositions, linear forms, and geometric abstraction.", image_url: "/images/artists/artist-7.svg", artworks: 18, featured_work: "Archipelago Dreams" },
  { artist_id: 8, name: "Juvenal Sanso", alias: "Poet of Forms", bio: "Known for dreamlike landscapes and expressive compositions inspired by nature and memory.", image_url: "/images/artists/artist-8.svg", artworks: 20, featured_work: "Palawan Underground River" },
];

export function ArtistSpotlight() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [artists, setArtists] = useState<Artist[]>(fallbackArtists);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const response = await fetch("/api/artists", { cache: "no-store" });
        const data = await response.json();
        if (data.success && Array.isArray(data.artists) && data.artists.length > 0) {
          setArtists(data.artists);
          setActiveIndex(0);
        }
      } catch {
        setArtists(fallbackArtists);
      }
    };
    loadArtists();
  }, []);

  const nextArtist = () => setActiveIndex((prev) => (prev + 1) % artists.length);
  const prevArtist = () => setActiveIndex((prev) => (prev - 1 + artists.length) % artists.length);

  const activeArtist = artists[activeIndex] || fallbackArtists[0];

  return (
    <section ref={containerRef} className="py-20 md:py-28 bg-[#1a1a1a] text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-sm text-[#c9a66b] font-medium tracking-wide uppercase">Meet The Masters</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-white">Artist Spotlight</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevArtist} className="p-2.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors" aria-label="Previous artist">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={nextArtist} className="p-2.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors" aria-label="Next artist">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative aspect-[4/5] overflow-hidden rounded bg-white/5"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={`${activeArtist.artist_id}-${activeArtist.image_url}`}
                src={activeArtist.image_url || "/placeholder-user.jpg"}
                alt={activeArtist.name}
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border/50 text-foreground px-3 py-1.5 rounded text-sm">
              <span className="font-serif text-lg">{activeArtist.artworks || 0}</span>
              <span className="text-muted-foreground ml-1">works</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeArtist.artist_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <p className="text-sm tracking-wide text-white/50">{activeArtist.alias}</p>
                <h3 className="mt-2 font-serif text-2xl md:text-3xl text-white">{activeArtist.name}</h3>
                <p className="mt-4 text-white/70 leading-relaxed">{activeArtist.bio}</p>
                <div className="mt-6 p-4 bg-white/5 rounded border border-white/10">
                  <p className="text-xs tracking-wide uppercase text-white/50">Featured Work</p>
                  <p className="mt-1 font-serif text-lg text-white">{activeArtist.featured_work || "Featured Collection"}</p>
                </div>
                <div className="mt-6">
                  <Link href="/artists">
                    <Button size="lg" className="h-11 px-6 bg-white text-[#1a1a1a] hover:bg-white/90">
                      View Artists
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center gap-2">
              {artists.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
                  aria-label={`Go to artist ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
