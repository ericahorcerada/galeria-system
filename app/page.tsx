"use client";

import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { FeaturedArtworks } from "@/components/landing/featured-artworks";
import { Categories } from "@/components/landing/categories";
import { ArtistSpotlight } from "@/components/landing/artist-spotlight";
import { Testimonials } from "@/components/landing/testimonials";
import { Newsletter } from "@/components/landing/newsletter";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <FeaturedArtworks />
        <Categories />
        <ArtistSpotlight />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
