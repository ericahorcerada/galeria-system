"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ArtistsPageForm = {
  hero_title: string;
  main_title: string;
  hero_subtitle: string;
  heritage_title: string;
  hero_background_url: string;
  section_title: string;
  section_subtitle: string;
};

const defaultForm: ArtistsPageForm = {
  hero_title: "FEATURED ARTISTS",
  main_title: "ARTISTS",
  hero_subtitle:
    "Meet the visionaries behind our curated collection of contemporary Filipino art",
  heritage_title: "CONTEMPORARY FILIPINO ART",
  hero_background_url: "",
  section_title: "Featured Artists",
  section_subtitle:
    "Our gallery represents a diverse group of established and emerging artists. Edits saved in the admin Artists page are shown here automatically.",
};

export default function AdminArtistsPageSettings() {
  const [form, setForm] = useState<ArtistsPageForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/artists-page", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to load Artists page settings.");
        return;
      }

      setForm({
        ...defaultForm,
        ...result.settings,
      });
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/artists-page", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to save Artists page.");
        return;
      }

      setMessage("Artists page updated successfully.");
    } catch {
      setError("Unable to save Artists page.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(file: File) {
    setIsUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "Upload failed. If upload is not configured, paste an image URL instead."
        );
        return;
      }

      const uploadedUrl =
        result.url ||
        result.imageUrl ||
        result.image_url ||
        result.path ||
        result.fileUrl ||
        "";

      if (!uploadedUrl) {
        setError("Upload worked, but no image URL was returned.");
        return;
      }

      setForm((current) => ({
        ...current,
        hero_background_url: uploadedUrl,
      }));

      setMessage("Hero image uploaded. Click Save Changes to publish it.");
    } catch {
      setError("Upload failed. You can paste an image URL instead.");
    } finally {
      setIsUploading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const updateField = (field: keyof ArtistsPageForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-950 via-purple-900 to-orange-700 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-200">
              Admin Editor
            </p>

            <h1 className="font-serif text-4xl sm:text-5xl">
              Artists Page Settings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Edit the Artists top banner, text, and hero background image.
            </p>
          </div>

          <Button
            type="button"
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-white text-purple-950 hover:bg-white/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Loading Artists page settings...
        </p>
      )}

      {message && (
        <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-300">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6 rounded-[2rem] border border-border bg-card/90 p-6 shadow-xl backdrop-blur">
          <div>
            <h2 className="text-xl font-black">Artists Hero Banner</h2>
            <p className="text-sm text-muted-foreground">
              This controls the top section in the Artists page.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Big Background Title</Label>
            <Input
              value={form.hero_title}
              onChange={(event) =>
                updateField("hero_title", event.target.value)
              }
              placeholder="FEATURED ARTISTS"
            />
          </div>

          <div className="space-y-2">
            <Label>Main Title</Label>
            <Input
              value={form.main_title}
              onChange={(event) =>
                updateField("main_title", event.target.value)
              }
              placeholder="ARTISTS"
            />
          </div>

          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={form.hero_subtitle}
              onChange={(event) =>
                updateField("hero_subtitle", event.target.value)
              }
              placeholder="Meet the visionaries behind our curated collection..."
            />
          </div>

          <div className="space-y-2">
            <Label>Heritage Text</Label>
            <Input
              value={form.heritage_title}
              onChange={(event) =>
                updateField("heritage_title", event.target.value)
              }
              placeholder="CONTEMPORARY FILIPINO ART"
            />
          </div>

          <div className="space-y-2">
            <Label>Hero Background Image URL</Label>
            <Input
              value={form.hero_background_url}
              onChange={(event) =>
                updateField("hero_background_url", event.target.value)
              }
              placeholder="Paste image URL for Artists top banner"
            />
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center hover:bg-muted">
            <ImagePlus className="mb-2 h-8 w-8 text-primary" />
            <span className="text-sm font-semibold">
              {isUploading ? "Uploading..." : "Upload Artists Hero Image"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              This image appears behind FEATURED ARTISTS.
            </span>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  uploadImage(file);
                }
              }}
            />
          </label>

          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-black">Featured Artists Section</h2>
          </div>

          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={form.section_title}
              onChange={(event) =>
                updateField("section_title", event.target.value)
              }
              placeholder="Featured Artists"
            />
          </div>

          <div className="space-y-2">
            <Label>Section Subtitle</Label>
            <textarea
              value={form.section_subtitle}
              onChange={(event) =>
                updateField("section_subtitle", event.target.value)
              }
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button
            type="button"
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Artists Page"}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
            <div
              className="relative flex min-h-[340px] items-center justify-center bg-[#3b1d12] bg-cover bg-center p-8 text-center text-white"
              style={
                form.hero_background_url
                  ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.58), rgba(0,0,0,0.58)), url(${form.hero_background_url})`,
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_85%,rgba(255,255,255,0.08),transparent_25%)]" />

              <h3 className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap font-serif text-6xl font-black uppercase text-white/20">
                {form.hero_title}
              </h3>

              <div className="relative z-10">
                <p className="font-serif text-5xl uppercase tracking-[0.2em]">
                  {form.main_title}
                </p>

                <p className="mx-auto mt-6 max-w-xl text-lg font-semibold leading-8">
                  {form.hero_subtitle}
                </p>

                <p className="mt-4 text-2xl font-black uppercase tracking-[0.18em] text-white/40">
                  {form.heritage_title}
                </p>
              </div>
            </div>

            <div className="p-4 text-sm text-muted-foreground">
              Live preview of the Artists top banner.
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-xl backdrop-blur">
            <h2 className="text-xl font-black">How to use</h2>

            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Upload an Artists Hero Image or paste an image URL.</li>
              <li>Edit the title/subtitle fields.</li>
              <li>Click Save Changes.</li>
              <li>Open /artists to see the public page update.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}