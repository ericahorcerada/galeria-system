"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";

type AboutData = {
  hero_title: string;
  hero_subtitle: string;
  heritage_title: string;
  story_title: string;
  story_paragraph_1: string;
  story_paragraph_2: string;
  story_paragraph_3: string;
  image_url: string;
  image_title: string;
  image_subtitle: string;
};

const defaultAbout: AboutData = {
  hero_title: "ABOUT GALERIA",
  hero_subtitle:
    "Celebrating Filipino artistic excellence in the heart of Butuan City",
  heritage_title: "BUTUAN CITY ART HERITAGE",
  story_title: "Our Story",
  story_paragraph_1:
    "Founded in 2010, Galeria Butuan City emerged from a passionate vision to create a platform where Filipino contemporary art could thrive and be celebrated both locally and internationally.",
  story_paragraph_2:
    "What began as a small gallery space has grown into a vibrant cultural hub, representing over 50 artists and hosting numerous exhibitions that have shaped the Philippine art landscape.",
  story_paragraph_3:
    "Our commitment remains steadfast: to discover, nurture, and showcase exceptional Filipino artistic talent while making art accessible to everyone who appreciates beauty and creativity.",
  image_url: "",
  image_title: "GALLERY INTERIOR",
  image_subtitle: "VISIT US IN BUTUAN CITY",
};

export default function AboutPage() {
  const [about, setAbout] = useState<AboutData>(defaultAbout);

  useEffect(() => {
    async function loadAbout() {
      try {
        const response = await fetch("/api/about", {
          cache: "no-store",
        });

        const result = await response.json();

        if (result.success && result.about) {
          setAbout({
            ...defaultAbout,
            ...result.about,
          });
        }
      } catch {
        setAbout(defaultAbout);
      }
    }

    loadAbout();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[#222] px-6 pb-24 pt-36 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(255,255,255,0.08),transparent_25%)]" />

          <h1 className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap font-serif text-7xl font-black uppercase tracking-wide text-white/20 sm:text-8xl md:text-9xl">
            {about.hero_title}
          </h1>

          <div className="relative z-10 mx-auto max-w-5xl">
            <h2 className="font-serif text-5xl uppercase tracking-[0.18em] sm:text-6xl">
              {about.hero_title.replace("GALERIA", "").trim() || "ABOUT"}
            </h2>

            <p className="mt-8 text-lg font-semibold">
              {about.hero_subtitle}
            </p>

            <p className="mt-4 text-3xl font-bold uppercase tracking-[0.18em] text-white/30">
              {about.heritage_title}
            </p>
          </div>
        </section>

        <section className="bg-[#14091f] px-6 py-20 text-white sm:px-10 lg:px-16">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-serif text-4xl tracking-[0.18em]">
                {about.story_title}
              </h2>

              <div className="mt-8 space-y-6 text-base leading-8 text-white/85">
                {about.story_paragraph_1 && <p>{about.story_paragraph_1}</p>}
                {about.story_paragraph_2 && <p>{about.story_paragraph_2}</p>}
                {about.story_paragraph_3 && <p>{about.story_paragraph_3}</p>}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-stone-700 via-amber-800 to-yellow-700 p-4 shadow-2xl shadow-black/30">
              <div
                className="flex aspect-[4/3] items-center justify-center rounded-xl border border-white/20 bg-cover bg-center p-8"
                style={
                  about.image_url
                    ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.30), rgba(0,0,0,0.30)), url(${about.image_url})`,
                      }
                    : undefined
                }
              >
                <div className="w-full rounded-xl border border-white/25 bg-black/10 p-8 text-center backdrop-blur-sm">
                  <h3 className="font-serif text-4xl font-bold uppercase tracking-[0.08em]">
                    {about.image_title}
                  </h3>

                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.28em] text-white/75">
                    {about.image_subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}