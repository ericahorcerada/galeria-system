"use client";

import { useEffect, useState } from "react";
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
  highlightedTitle: "",
  highlightedTitleLine: "",
  description:
    "Discover elegant artworks, framed prints, and curated collections made for homes, offices, and creative spaces.",
  primaryButtonText: "Shop Live Collection",
  primaryButtonLink: "/shop",
  secondaryButtonText: "Create Customer Account",
  secondaryButtonLink: "/login",
  backgroundImageUrl: "",
  backgroundImage: "",
  featuredTitle: "Golden Horizon",
  featuredSubtitle:
    "A peaceful landscape artwork with warm skies, calm waters, and timeless natural beauty.",
  featuredImageUrl: "",
  featuredImage: "",
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
    ""
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
    ""
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
    highlightedTitle: "",
    highlightedTitleLine: "",
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

function isUsableImageUrl(url: string) {
  if (!url) return false;

  const lower = url.toLowerCase();

  if (lower.includes("imgbb.com")) return false;
  if (lower.includes("image not found")) return false;
  if (lower.includes("undefined")) return false;
  if (lower.includes("null")) return false;

  return true;
}

export function Hero() {
  const [homepage, setHomepage] = useState<Required<HomepageData>>(DEFAULT_HOMEPAGE);
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const [featuredFailed, setFeaturedFailed] = useState(false);

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
          setBackgroundFailed(false);
          setFeaturedFailed(false);
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

  const showBackgroundImage =
    isUsableImageUrl(homepage.backgroundImageUrl) && !backgroundFailed;

  const showFeaturedImage =
    isUsableImageUrl(homepage.featuredImageUrl) && !featuredFailed;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#160900] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(219,170,82,0.42),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(120,64,16,0.35),transparent_30%),linear-gradient(135deg,#0f0600_0%,#2b1404_42%,#704612_100%)]" />

      {showBackgroundImage && (
        <img
          src={homepage.backgroundImageUrl}
          alt="Galeria background artwork"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          onError={() => setBackgroundFailed(true)}
        />
      )}

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pb-16 pt-28 lg:px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75 }}
            className="max-w-2xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#e0bd76]" />
              {homepage.smallLabel}
            </div>

            <h1 className="font-serif text-[38px] font-light leading-tight tracking-[-0.02em] text-[#d8b26a] sm:text-[48px] md:text-[58px] lg:text-[68px]">
              {homepage.mainTitle}
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/85 md:text-base">
              {homepage.description}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
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
            <div className="w-full max-w-[380px] rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#8b551c] via-[#d0993b] to-[#241107]">
                {showFeaturedImage ? (
                  <img
                    src={homepage.featuredImageUrl}
                    alt={homepage.featuredTitle}
                    className="h-full w-full object-cover"
                    onError={() => setFeaturedFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-8 text-center">
                    <div>
                      <p className="font-serif text-2xl text-white">
                        {homepage.featuredTitle}
                      </p>
                      <p className="mt-3 text-sm text-white/75">
                        Featured artwork preview
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-white">
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