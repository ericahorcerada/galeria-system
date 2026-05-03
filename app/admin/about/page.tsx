"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AboutForm = {
  hero_title: string;
  hero_subtitle: string;
  heritage_title: string;
  hero_background_url: string;
  story_title: string;
  story_paragraph_1: string;
  story_paragraph_2: string;
  story_paragraph_3: string;
  image_url: string;
  image_title: string;
  image_subtitle: string;
};

const defaultForm: AboutForm = {
  hero_title: "ABOUT GALERIA",
  hero_subtitle:
    "Celebrating Filipino artistic excellence in the heart of Butuan City",
  heritage_title: "BUTUAN CITY ART HERITAGE",
  hero_background_url: "",
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

export default function AdminAboutPage() {
  const [form, setForm] = useState<AboutForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAbout() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/about", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to load About page.");
        return;
      }

      setForm({
        ...defaultForm,
        ...result.about,
      });
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAbout() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/about", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to save About page.");
        return;
      }

      setMessage("About page updated successfully.");
    } catch {
      setError("Unable to save About page.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(
    file: File,
    field: "hero_background_url" | "image_url"
  ) {
    if (field === "hero_background_url") {
      setIsUploadingHero(true);
    } else {
      setIsUploadingGallery(true);
    }

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
        [field]: uploadedUrl,
      }));

      setMessage("Image uploaded. Click Save Changes to publish it.");
    } catch {
      setError("Upload failed. You can paste an image URL instead.");
    } finally {
      setIsUploadingHero(false);
      setIsUploadingGallery(false);
    }
  }

  useEffect(() => {
    loadAbout();
  }, []);

  const updateField = (field: keyof AboutForm, value: string) => {
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
              About Page Settings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Edit the About hero banner, story section, and gallery image.
            </p>
          </div>

          <Button
            type="button"
            onClick={saveAbout}
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
          Loading About page settings...
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
            <h2 className="text-xl font-black">Hero Banner Content</h2>
            <p className="text-sm text-muted-foreground">
              This controls the top About section in your screenshot.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Hero Title</Label>
            <Input
              value={form.hero_title}
              onChange={(event) =>
                updateField("hero_title", event.target.value)
              }
              placeholder="ABOUT GALERIA"
            />
          </div>

          <div className="space-y-2">
            <Label>Hero Subtitle</Label>
            <Input
              value={form.hero_subtitle}
              onChange={(event) =>
                updateField("hero_subtitle", event.target.value)
              }
              placeholder="Celebrating Filipino artistic excellence..."
            />
          </div>

          <div className="space-y-2">
            <Label>Heritage Title</Label>
            <Input
              value={form.heritage_title}
              onChange={(event) =>
                updateField("heritage_title", event.target.value)
              }
              placeholder="BUTUAN CITY ART HERITAGE"
            />
          </div>

          <div className="space-y-2">
            <Label>Hero Background Image URL</Label>
            <Input
              value={form.hero_background_url}
              onChange={(event) =>
                updateField("hero_background_url", event.target.value)
              }
              placeholder="https://..."
            />
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center hover:bg-muted">
            <ImagePlus className="mb-2 h-8 w-8 text-primary" />
            <span className="text-sm font-semibold">
              {isUploadingHero ? "Uploading hero image..." : "Upload Hero Image"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              This image appears behind ABOUT GALERIA.
            </span>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingHero}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadImage(file, "hero_background_url");
              }}
            />
          </label>

          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-black">Story Content</h2>
          </div>

          <div className="space-y-2">
            <Label>Story Title</Label>
            <Input
              value={form.story_title}
              onChange={(event) =>
                updateField("story_title", event.target.value)
              }
              placeholder="Our Story"
            />
          </div>

          <div className="space-y-2">
            <Label>Story Paragraph 1</Label>
            <textarea
              value={form.story_paragraph_1}
              onChange={(event) =>
                updateField("story_paragraph_1", event.target.value)
              }
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label>Story Paragraph 2</Label>
            <textarea
              value={form.story_paragraph_2}
              onChange={(event) =>
                updateField("story_paragraph_2", event.target.value)
              }
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label>Story Paragraph 3</Label>
            <textarea
              value={form.story_paragraph_3}
              onChange={(event) =>
                updateField("story_paragraph_3", event.target.value)
              }
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
            <div
              className="relative flex min-h-[280px] items-center justify-center bg-[#222] bg-cover bg-center p-8 text-center text-white"
              style={
                form.hero_background_url
                  ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.58), rgba(0,0,0,0.58)), url(${form.hero_background_url})`,
                    }
                  : undefined
              }
            >
              <h3 className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap font-serif text-6xl font-black uppercase text-white/15">
                {form.hero_title}
              </h3>

              <div className="relative z-10">
                <p className="font-serif text-4xl uppercase tracking-[0.25em]">
                  {form.hero_title.replace("GALERIA", "").trim() || "ABOUT"}
                </p>
                <p className="mt-5 font-semibold">{form.hero_subtitle}</p>
                <p className="mt-4 text-xl font-black uppercase tracking-[0.18em] text-white/40">
                  {form.heritage_title}
                </p>
              </div>
            </div>

            <div className="p-4 text-sm text-muted-foreground">
              Live preview of the top About hero banner.
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-xl backdrop-blur">
            <div className="mb-5">
              <h2 className="text-xl font-black">Gallery Interior Image</h2>
              <p className="text-sm text-muted-foreground">
                This controls the lower right image section.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center hover:bg-muted">
                <ImagePlus className="mb-2 h-8 w-8 text-primary" />
                <span className="text-sm font-semibold">
                  {isUploadingGallery
                    ? "Uploading gallery image..."
                    : "Upload Gallery Image"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG, or WEBP
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingGallery}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadImage(file, "image_url");
                  }}
                />
              </label>

              <div className="space-y-2">
                <Label>Gallery Image URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(event) =>
                    updateField("image_url", event.target.value)
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Image Title</Label>
                <Input
                  value={form.image_title}
                  onChange={(event) =>
                    updateField("image_title", event.target.value)
                  }
                  placeholder="GALLERY INTERIOR"
                />
              </div>

              <div className="space-y-2">
                <Label>Image Subtitle</Label>
                <Input
                  value={form.image_subtitle}
                  onChange={(event) =>
                    updateField("image_subtitle", event.target.value)
                  }
                  placeholder="VISIT US IN BUTUAN CITY"
                />
              </div>

              <Button
                type="button"
                onClick={saveAbout}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Image and Content"}
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
            <div
              className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-amber-900 via-orange-700 to-yellow-600 bg-cover bg-center p-6"
              style={
                form.image_url
                  ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url(${form.image_url})`,
                    }
                  : undefined
              }
            >
              <div className="w-full rounded-2xl border border-white/25 bg-black/15 p-8 text-center text-white backdrop-blur-sm">
                <h3 className="font-serif text-3xl font-bold">
                  {form.image_title}
                </h3>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                  {form.image_subtitle}
                </p>
              </div>
            </div>

            <div className="p-4 text-sm text-muted-foreground">
              Live preview of the gallery image section.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}