"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";

type Artist = {
  artist_id?: number;
  id?: number;
  name?: string;
  artist_name?: string;
  alias?: string;
  bio?: string;
  image_url?: string;
  status?: string;
  featured_work?: string;
};

type ArtistsPageSettings = {
  hero_title: string;
  main_title: string;
  hero_subtitle: string;
  heritage_title: string;
  hero_background_url: string;
  section_title: string;
  section_subtitle: string;
};

const defaultSettings: ArtistsPageSettings = {
  hero_title: "FEATURED ARTISTS",
  main_title: "ARTISTS",
  hero_subtitle:
    "Meet the visionaries behind our curated collection of contemporary Filipino art",
  heritage_title: "CONTEMPORARY FILIPINO ART",
  hero_background_url: "",
  section_title: "Featured Artists",
  section_subtitle:
    "Our gallery represents a diverse group of established and emerging artists.",
};

function getArtistName(artist: Artist) {
  return artist.artist_name || artist.name || artist.alias || "Galeria Artist";
}

function getArtistImage(artist: Artist) {
  return artist.image_url || "";
}

export default function ArtistsPage() {
  const [settings, setSettings] =
    useState<ArtistsPageSettings>(defaultSettings);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    async function loadPage() {
      try {
        const settingsResponse = await fetch(
          `/api/artists-page?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        const artistsResponse = await fetch(`/api/artists?t=${Date.now()}`, {
          cache: "no-store",
        });

        const settingsJson = await settingsResponse.json();
        const artistsJson = await artistsResponse.json();

        if (settingsJson.success && settingsJson.settings) {
          setSettings({
            ...defaultSettings,
            ...settingsJson.settings,
          });
        }

        const artistList =
          artistsJson.artists || artistsJson.data || artistsJson.results || [];

        if (Array.isArray(artistList)) {
          setArtists(artistList);
        }
      } catch {
        setSettings(defaultSettings);
      }
    }

    loadPage();
  }, []);

  const heroStyle = settings.hero_background_url
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url("${settings.hero_background_url}")`,
      }
    : {
        background:
          "linear-gradient(135deg, #3b1d12 0%, #4c1d95 50%, #be185d 100%)",
      };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        <section
          className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-cover bg-center px-6 pb-24 pt-40 text-center text-white"
          style={heroStyle}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_85%,rgba(255,255,255,0.10),transparent_25%)]" />

          <h1 className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap font-serif text-6xl font-black uppercase tracking-wide text-white/25 sm:text-7xl md:text-8xl lg:text-9xl">
            {settings.hero_title}
          </h1>

          <div className="relative z-10 mx-auto max-w-5xl">
            <h2 className="font-serif text-5xl uppercase tracking-[0.22em] drop-shadow-lg sm:text-6xl">
              {settings.main_title}
            </h2>

            <p className="mx-auto mt-8 max-w-3xl text-lg font-semibold leading-8 drop-shadow">
              {settings.hero_subtitle}
            </p>

            <p className="mt-4 text-2xl font-bold uppercase tracking-[0.2em] text-white/60 drop-shadow sm:text-3xl">
              {settings.heritage_title}
            </p>
          </div>
        </section>

        <section className="bg-[#14091f] px-6 py-20 text-white sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-4xl text-center">
              <h2 className="font-serif text-4xl tracking-[0.18em] sm:text-5xl">
                {settings.section_title}
              </h2>

              <p className="mt-6 text-lg leading-8 text-white/75">
                {settings.section_subtitle}
              </p>
            </div>

            {artists.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                No artists available yet.
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {artists.map((artist) => {
                  const artistName = getArtistName(artist);
                  const artistImage = getArtistImage(artist);

                  return (
                    <article
                      key={artist.artist_id || artist.id || artistName}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20"
                    >
                      <div
                        className="aspect-[4/3] bg-cover bg-center"
                        style={
                          artistImage
                            ? {
                                backgroundImage: `url("${artistImage}")`,
                              }
                            : {
                                background:
                                  "linear-gradient(135deg, #3b1d12, #4c1d95, #be185d)",
                              }
                        }
                      />

                      <div className="p-6">
                        <h3 className="font-serif text-3xl text-white">
                          {artistName}
                        </h3>

                        {artist.alias && artist.alias !== artistName && (
                          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-orange-200">
                            {artist.alias}
                          </p>
                        )}

                        {artist.bio && (
                          <p className="mt-4 line-clamp-4 leading-7 text-white/75">
                            {artist.bio}
                          </p>
                        )}

                        {artist.featured_work && (
                          <p className="mt-4 text-sm text-white/60">
                            Featured work: {artist.featured_work}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}