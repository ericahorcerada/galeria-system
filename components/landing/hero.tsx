"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type HomepageSettings = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  primary_button_text: string;
  primary_button_href: string;
  secondary_button_text: string;
  secondary_button_href: string;
  background_image_url: string;
  featured_image_url: string;
  featured_title: string;
  featured_subtitle: string;
};

const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  eyebrow: "Live Filipino Art Store",
  title: "Curated art for",
  highlight: "modern Filipino spaces.",
  subtitle: "Browse photo-backed, MySQL-powered artwork listings. Update titles, prices, stock, and images in admin, then see the storefront change live.",
  primary_button_text: "Shop Live Collection",
  primary_button_href: "/shop",
  secondary_button_text: "Create Customer Account",
  secondary_button_href: "/login",
  background_image_url: "/artworks/aznar-manilabay.jpg",
  featured_image_url: "/artworks/bencab-sabel.jpg",
  featured_title: "Sabel in Motion",
  featured_subtitle: "Photo-backed seed artwork",
};

function normalizeSettings(value: Partial<HomepageSettings> | null | undefined): HomepageSettings {
  const incoming = value || {};
  return {
    eyebrow: String(incoming.eyebrow ?? DEFAULT_HOMEPAGE_SETTINGS.eyebrow),
    title: String(incoming.title ?? DEFAULT_HOMEPAGE_SETTINGS.title),
    highlight: String(incoming.highlight ?? DEFAULT_HOMEPAGE_SETTINGS.highlight),
    subtitle: String(incoming.subtitle ?? DEFAULT_HOMEPAGE_SETTINGS.subtitle),
    primary_button_text: String(incoming.primary_button_text ?? DEFAULT_HOMEPAGE_SETTINGS.primary_button_text),
    primary_button_href: String(incoming.primary_button_href ?? DEFAULT_HOMEPAGE_SETTINGS.primary_button_href),
    secondary_button_text: String(incoming.secondary_button_text ?? DEFAULT_HOMEPAGE_SETTINGS.secondary_button_text),
    secondary_button_href: String(incoming.secondary_button_href ?? DEFAULT_HOMEPAGE_SETTINGS.secondary_button_href),
    background_image_url: String(incoming.background_image_url ?? DEFAULT_HOMEPAGE_SETTINGS.background_image_url),
    featured_image_url: String(incoming.featured_image_url ?? DEFAULT_HOMEPAGE_SETTINGS.featured_image_url),
    featured_title: String(incoming.featured_title ?? DEFAULT_HOMEPAGE_SETTINGS.featured_title),
    featured_subtitle: String(incoming.featured_subtitle ?? DEFAULT_HOMEPAGE_SETTINGS.featured_subtitle),
  };
}

export function Hero() {
  const [settings, setSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);

  useEffect(() => {
    let alive = true;
    fetch(`/api/homepage?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (alive && data?.settings) setSettings(normalizeSettings(data.settings));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120f0d] text-white">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('${settings.background_image_url || DEFAULT_HOMEPAGE_SETTINGS.background_image_url}')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,166,107,0.34),transparent_32%),linear-gradient(90deg,rgba(18,15,13,0.96)_0%,rgba(18,15,13,0.74)_42%,rgba(18,15,13,0.40)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
      </div>

      <motion.div
        className="relative z-20 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-24 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-3xl text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white/80 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#d9b878]" />
              {settings.eyebrow}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="font-serif text-[42px] font-light leading-[1.05] tracking-[-0.03em] text-white sm:text-[56px] md:text-[68px] lg:text-[76px]"
            >
              {settings.title}
              <span className="block text-[#d9b878]">{settings.highlight}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-7 max-w-2xl text-base leading-8 text-white/80 sm:text-lg"
            >
              {settings.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Button asChild size="lg" className="h-12 bg-[#d9b878] px-8 text-sm font-semibold tracking-wide text-[#17130f] hover:bg-[#e5c888]">
                <Link href={settings.primary_button_href || "/shop"}>
                  {settings.primary_button_text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-white/30 bg-white/10 px-8 text-sm font-medium tracking-wide text-white hover:bg-white/20 hover:text-white">
                <Link href={settings.secondary_button_href || "/login"}>{settings.secondary_button_text}</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="hidden lg:block"
          >
            <div className="ml-auto max-w-md rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
              <div className="overflow-hidden rounded-[1.5rem] bg-black/20">
                <img src={settings.featured_image_url || DEFAULT_HOMEPAGE_SETTINGS.featured_image_url} alt="Featured Filipino artwork preview" className="aspect-[4/5] h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-4 px-2 pt-4 text-sm">
                <div>
                  <p className="font-serif text-2xl text-white">{settings.featured_title}</p>
                  <p className="text-white/60">{settings.featured_subtitle}</p>
                </div>
                <p className="rounded-full bg-white/10 px-3 py-1 text-white/80">MySQL Live</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
