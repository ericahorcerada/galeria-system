"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type HomepageData = {
  smallLabel?: string;
  mainTitle?: string;
  highlightedTitle?: string;
  highlightedTitleLine?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundImageUrl?: string;
  backgroundImage?: string;
  featuredTitle?: string;
  featuredSubtitle?: string;
  featuredImageUrl?: string;
  featuredImage?: string;
};

const DEFAULT_HOMEPAGE: Required<HomepageData> = {
  smallLabel: "BUTUAN CITY ART GALLERY",
  mainTitle: "GALERIA",
  highlightedTitle: "Timeless pieces for every meaningful space.",
  highlightedTitleLine: "Timeless pieces for every meaningful space.",
  description:
    "Discover elegant artworks, framed prints, and curated collections made for homes, offices, and creative spaces.",
  primaryButtonText: "Shop Live Collection",
  primaryButtonLink: "/shop",
  secondaryButtonText: "Create Customer Account",
  secondaryButtonLink: "/login",
  backgroundImageUrl: "https://i.ibb.co/zR8CwwNZ/Enhancer-AI-UHD-da.jpg",
  backgroundImage: "https://i.ibb.co/zR8CwwNZ/Enhancer-AI-UHD-da.jpg",
  featuredTitle: "Golden Horizon",
  featuredSubtitle:
    "A peaceful landscape artwork with warm skies, calm waters, and timeless natural beauty.",
  featuredImageUrl: "https://i.ibb.co/mChT8Tyr/Enhancer-AI-UHD-wall.jpg",
  featuredImage: "https://i.ibb.co/mChT8Tyr/Enhancer-AI-UHD-wall.jpg",
};

function getValue(source: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function normalizeHomepageData(rawData: unknown): Required<HomepageData> {
  const data =
    rawData && typeof rawData === "object"
      ? (rawData as Record<string, unknown>)
      : {};

  const nested =
    (data.homepage && typeof data.homepage === "object"
      ? (data.homepage as Record<string, unknown>)
      : null) ||
    (data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : null) ||
    (data.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : null) ||
    data;

  const source = nested as Record<string, unknown>;

  const backgroundImageUrl = getValue(
    source,
    [
      "backgroundImageUrl",
      "background_image_url",
      "backgroundImage",
      "background_image",
      "imageUrl",
      "image_url",
    ],
    DEFAULT_HOMEPAGE.backgroundImageUrl
  );

  const featuredImageUrl = getValue(
    source,
    [
      "featuredImageUrl",
      "featured_image_url",
      "featuredImage",
      "featured_image",
      "cardImageUrl",
      "card_image_url",
    ],
    DEFAULT_HOMEPAGE.featuredImageUrl
  );

  return {
    smallLabel: getValue(
      source,
      ["smallLabel", "small_label", "label", "heroLabel", "hero_label"],
      DEFAULT_HOMEPAGE.smallLabel
    ),
    mainTitle: getValue(
      source,
      ["mainTitle", "main_title", "title", "heroTitle", "hero_title"],
      DEFAULT_HOMEPAGE.mainTitle
    ),
    highlightedTitle: getValue(
      source,
      [
        "highlightedTitle",
        "highlighted_title",
        "highlightedTitleLine",
        "highlighted_title_line",
        "subtitle",
      ],
      DEFAULT_HOMEPAGE.highlightedTitle
    ),
    highlightedTitleLine: getValue(
      source,
      [
        "highlightedTitleLine",
        "highlighted_title_line",
        "highlightedTitle",
        "highlighted_title",
        "subtitle",
      ],
      DEFAULT_HOMEPAGE.highlightedTitleLine
    ),
    description: getValue(
      source,
      ["description", "heroDescription", "hero_description"],
      DEFAULT_HOMEPAGE.description
    ),
    primaryButtonText: getValue(
      source,
      ["primaryButtonText", "primary_button_text", "primaryText", "primary_text"],
      DEFAULT_HOMEPAGE.primaryButtonText
    ),
    primaryButtonLink: getValue(
      source,
      ["primaryButtonLink", "primary_button_link", "primaryLink", "primary_link"],
      DEFAULT_HOMEPAGE.primaryButtonLink
    ),
    secondaryButtonText: getValue(
      source,
      ["secondaryButtonText", "secondary_button_text", "secondaryText", "secondary_text"],
      DEFAULT_HOMEPAGE.secondaryButtonText
    ),
    secondaryButtonLink: getValue(
      source,
      ["secondaryButtonLink", "secondary_button_link", "secondaryLink", "secondary_link"],
      DEFAULT_HOMEPAGE.secondaryButtonLink
    ),
    backgroundImageUrl,
    backgroundImage: backgroundImageUrl,
    featuredTitle: getValue(
      source,
      ["featuredTitle", "featured_title", "cardTitle", "card_title"],
      DEFAULT_HOMEPAGE.featuredTitle
    ),
    featuredSubtitle: getValue(
      source,
      ["featuredSubtitle", "featured_subtitle", "cardSubtitle", "card_subtitle"],
      DEFAULT_HOMEPAGE.featuredSubtitle
    ),
    featuredImageUrl,
    featuredImage: featuredImageUrl,
  };
}

export function Hero() {
  const [homepage, setHomepage] = useState<Required<HomepageData>>(DEFAULT_HOMEPAGE);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadHomepage() {
      try {
        const response = await fetch(`/api/homepage?ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) return;

        const result = await response.json();
        const normalized = normalizeHomepageData(result);

        if (mounted) {
          setHomepage(normalized);
        }
      } catch {
        if (mounted) {
          setHomepage(DEFAULT_HOMEPAGE);
        }
      }
    }

    loadHomepage();

    return () => {
      mounted = false;
    };
  }, []);

  const highlightedWords = useMemo(() => {
    return (
      homepage.highlightedTitleLine ||
      homepage.highlightedTitle ||
      DEFAULT_HOMEPAGE.highlightedTitle
    );
  }, [homepage.highlightedTitle, homepage.highlightedTitleLine]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120800] text-white">
      <div className="absolute inset-0">
        <img
          src={homepage.backgroundImageUrl}
          alt="Galeria background artwork"
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            backgroundLoaded ? "opacity-100" : "opacity-100"
          }`}
          onLoad={() => setBackgroundLoaded(true)}
          onError={(event) => {
            event.currentTarget.src = DEFAULT_HOMEPAGE.backgroundImageUrl;
          }}
        />

        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pb-16 pt-28 lg:px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75 }}
            className="max-w-3xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#e0bd76]" />
              {homepage.smallLabel}
            </div>

            <h1 className="font-serif text-[46px] font-light leading-[0.98] tracking-[-0.03em] text-white sm:text-[58px] md:text-[72px] lg:text-[82px]">
              {homepage.mainTitle}
              <br />
              <span className="text-[#d8b26a]">{highlightedWords}</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              {homepage.description}
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-md bg-[#e5c990] px-6 text-sm font-semibold text-black hover:bg-[#f0d9a8]"
              >
                <Link href={homepage.primaryButtonLink}>
                  {homepage.primaryButtonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-md border-white/20 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                <Link href={homepage.secondaryButtonLink}>
                  {homepage.secondaryButtonText}
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="hidden justify-center lg:flex"
          >
            <div className="w-full max-w-[420px] rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-black/20">
                <img
                  src={homepage.featuredImageUrl}
                  alt={homepage.featuredTitle}
                  className={`h-full w-full object-cover transition-opacity duration-700 ${
                    featuredLoaded ? "opacity-100" : "opacity-100"
                  }`}
                  onLoad={() => setFeaturedLoaded(true)}
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_HOMEPAGE.featuredImageUrl;
                  }}
                />
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-white">
                    {homepage.featuredTitle}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/70">
                    {homepage.featuredSubtitle}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white/80">
                  MySQL Live
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}