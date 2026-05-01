"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

type HomepageForm = {
  smallLabel: string;
  mainTitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  backgroundImageUrl: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredImageUrl: string;
};

const DEFAULT_FORM: HomepageForm = {
  smallLabel: "Butuan City Art Gallery",
  mainTitle: "GALERIA",
  description:
    "Discover elegant artworks, framed prints, and curated collections made for homes, offices, and creative spaces.",
  primaryButtonText: "Shop Live Collection",
  primaryButtonLink: "/shop",
  secondaryButtonText: "Create Customer Account",
  secondaryButtonLink: "/login",
  backgroundImageUrl: "",
  featuredTitle: "Golden Horizon",
  featuredSubtitle:
    "A peaceful landscape artwork with warm skies, calm waters, and timeless natural beauty.",
  featuredImageUrl: "",
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

function normalizeHomepage(rawData: unknown): HomepageForm {
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

  return {
    smallLabel: getValue(
      source,
      ["smallLabel", "small_label", "label", "heroLabel", "hero_label"],
      DEFAULT_FORM.smallLabel
    ),
    mainTitle: getValue(
      source,
      ["mainTitle", "main_title", "title", "heroTitle", "hero_title"],
      DEFAULT_FORM.mainTitle
    ),
    description: getValue(
      source,
      ["description", "heroDescription", "hero_description"],
      DEFAULT_FORM.description
    ),
    primaryButtonText: getValue(
      source,
      ["primaryButtonText", "primary_button_text", "primaryText", "primary_text"],
      DEFAULT_FORM.primaryButtonText
    ),
    primaryButtonLink: getValue(
      source,
      ["primaryButtonLink", "primary_button_link", "primaryLink", "primary_link"],
      DEFAULT_FORM.primaryButtonLink
    ),
    secondaryButtonText: getValue(
      source,
      ["secondaryButtonText", "secondary_button_text", "secondaryText", "secondary_text"],
      DEFAULT_FORM.secondaryButtonText
    ),
    secondaryButtonLink: getValue(
      source,
      ["secondaryButtonLink", "secondary_button_link", "secondaryLink", "secondary_link"],
      DEFAULT_FORM.secondaryButtonLink
    ),
    backgroundImageUrl: getValue(
      source,
      [
        "backgroundImageUrl",
        "background_image_url",
        "backgroundImage",
        "background_image",
        "imageUrl",
        "image_url",
      ],
      DEFAULT_FORM.backgroundImageUrl
    ),
    featuredTitle: getValue(
      source,
      ["featuredTitle", "featured_title", "cardTitle", "card_title"],
      DEFAULT_FORM.featuredTitle
    ),
    featuredSubtitle: getValue(
      source,
      ["featuredSubtitle", "featured_subtitle", "cardSubtitle", "card_subtitle"],
      DEFAULT_FORM.featuredSubtitle
    ),
    featuredImageUrl: getValue(
      source,
      [
        "featuredImageUrl",
        "featured_image_url",
        "featuredImage",
        "featured_image",
        "cardImageUrl",
        "card_image_url",
      ],
      DEFAULT_FORM.featuredImageUrl
    ),
  };
}

export default function AdminHomepagePage() {
  const [form, setForm] = useState<HomepageForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const featuredInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadHomepage() {
      try {
        setLoading(true);

        const response = await fetch(`/api/admin/homepage?ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          const publicResponse = await fetch(`/api/homepage?ts=${Date.now()}`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          if (!publicResponse.ok) return;

          const publicResult = await publicResponse.json();
          setForm(normalizeHomepage(publicResult));
          return;
        }

        const result = await response.json();
        setForm(normalizeHomepage(result));
      } catch {
        setError("Unable to load homepage settings.");
      } finally {
        setLoading(false);
      }
    }

    loadHomepage();
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function uploadImage(file: File, target: "backgroundImageUrl" | "featuredImageUrl") {
    try {
      setError("");
      setMessage("Uploading image...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      const uploadedUrl =
        result.url ||
        result.path ||
        result.fileUrl ||
        result.secure_url ||
        result.imageUrl ||
        "";

      if (!uploadedUrl) {
        throw new Error("Upload succeeded, but no image URL was returned.");
      }

      setForm((current) => ({
        ...current,
        [target]: uploadedUrl,
      }));

      setMessage("Image uploaded.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unable to upload image."
      );
      setMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        ...form,

        highlightedTitle: "",
        highlightedTitleLine: "",
        highlighted_title: "",
        highlighted_title_line: "",

        backgroundImage: form.backgroundImageUrl,
        background_image_url: form.backgroundImageUrl,

        featuredImage: form.featuredImageUrl,
        featured_image_url: form.featuredImageUrl,
      };

      let response = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        response = await fetch("/api/admin/homepage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to save homepage.");
      }

      setMessage("Homepage saved. Public homepage will show the new version after refresh.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save homepage.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6 text-white">
        <h1 className="font-serif text-4xl">Homepage</h1>
        <p className="mt-2 text-white/70">Loading homepage settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120800] p-6 text-white">
      <div className="mb-8">
        <h1 className="font-serif text-4xl">Homepage</h1>
        <p className="mt-2 text-lg text-white/70">
          Edit the customer homepage hero section and background image.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-6 font-serif text-2xl">Hero Text</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Small Label</label>
                <input
                  name="smallLabel"
                  value={form.smallLabel}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Main Title <span className="text-[#d8b26a]">(yellow on homepage)</span>
                </label>
                <input
                  name="mainTitle"
                  value={form.mainTitle}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-[#d8b26a] outline-none focus:border-[#d8b26a]"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#d8b26a]"
              />
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-6 font-serif text-2xl">Buttons</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Primary Button Text
                </label>
                <input
                  name="primaryButtonText"
                  value={form.primaryButtonText}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Primary Button Link
                </label>
                <input
                  name="primaryButtonLink"
                  value={form.primaryButtonLink}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Secondary Button Text
                </label>
                <input
                  name="secondaryButtonText"
                  value={form.secondaryButtonText}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Secondary Button Link
                </label>
                <input
                  name="secondaryButtonLink"
                  value={form.secondaryButtonLink}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-6 font-serif text-2xl">Homepage Background</h2>

            <div className="grid gap-5 md:grid-cols-[140px_1fr]">
              <div className="h-40 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                {form.backgroundImageUrl ? (
                  <img
                    src={form.backgroundImageUrl}
                    alt="Homepage background preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/50">
                    No image
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Background Image URL or Uploaded Path
                </label>
                <input
                  name="backgroundImageUrl"
                  value={form.backgroundImageUrl}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => backgroundInputRef.current?.click()}
                    className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                  >
                    Upload Image
                  </button>

                  <span className="text-xs text-white/50">
                    You can upload from your computer or paste an internet image link.
                  </span>

                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadImage(file, "backgroundImageUrl");
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-6 font-serif text-2xl">Featured Card</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Featured Title</label>
                <input
                  name="featuredTitle"
                  value={form.featuredTitle}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Featured Subtitle
                </label>
                <input
                  name="featuredSubtitle"
                  value={form.featuredSubtitle}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[140px_1fr]">
              <div className="h-40 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                {form.featuredImageUrl ? (
                  <img
                    src={form.featuredImageUrl}
                    alt="Featured preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/50">
                    No image
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Featured Image URL or Uploaded Path
                </label>
                <input
                  name="featuredImageUrl"
                  value={form.featuredImageUrl}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#d8b26a]"
                />

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => featuredInputRef.current?.click()}
                    className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                  >
                    Upload Image
                  </button>

                  <span className="text-xs text-white/50">
                    You can upload from your computer or paste an internet image link.
                  </span>

                  <input
                    ref={featuredInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadImage(file, "featuredImageUrl");
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#e5c990] px-5 py-3 font-semibold text-black hover:bg-[#f0d9a8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Homepage"}
          </button>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 font-serif text-xl">Live Preview</h2>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#160900] to-[#6c4312]">
              <div className="relative h-[420px]">
                {form.backgroundImageUrl && (
                  <img
                    src={form.backgroundImageUrl}
                    alt="Preview background"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                  />
                )}

                <div className="absolute inset-0 bg-black/45" />

                <div className="relative z-10 flex h-full flex-col justify-center p-6">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                    {form.smallLabel}
                  </p>

                  <h3 className="font-serif text-4xl text-[#d8b26a]">
                    {form.mainTitle}
                  </h3>

                  <p className="mt-4 line-clamp-4 text-sm leading-6 text-white/80">
                    {form.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded bg-[#e5c990] px-3 py-2 text-xs font-semibold text-black">
                      {form.primaryButtonText}
                    </span>
                    <span className="rounded border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white">
                      {form.secondaryButtonText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}