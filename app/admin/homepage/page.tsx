"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_SETTINGS = {
  eyebrow: "",
  title: "",
  highlight: "",
  subtitle: "",
  primary_button_text: "",
  primary_button_href: "",
  secondary_button_text: "",
  secondary_button_href: "",
  background_image_url: "",
  featured_image_url: "",
  featured_title: "",
  featured_subtitle: "",
};

type HomepageSettings = typeof EMPTY_SETTINGS;

function normalizeSettings(value: Partial<HomepageSettings> | null | undefined): HomepageSettings {
  const incoming = value || {};
  return Object.fromEntries(
    Object.keys(EMPTY_SETTINGS).map((key) => [key, String((incoming as Record<string, unknown>)[key] ?? "")]),
  ) as HomepageSettings;
}

export default function AdminHomepagePage() {
  const [settings, setSettings] = useState<HomepageSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<"background_image_url" | "featured_image_url" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (field: keyof HomepageSettings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/homepage", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load homepage settings.");
      setSettings(normalizeSettings(data.settings));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load homepage settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const uploadImage = async (file: File, field: "background_image_url" | "featured_image_url") => {
    if (!file) return;
    try {
      setUploadingField(field);
      setError("");
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "homepage");

      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Upload failed.");
      const nextSettings = normalizeSettings({ ...settings, [field]: data.url });
      setSettings(nextSettings);

      const saveResponse = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok || !saveData.success) throw new Error(saveData.error || "Image uploaded, but publishing to homepage failed.");
      setSettings(normalizeSettings(saveData.settings));
      setMessage("Image uploaded and published. Refresh the customer homepage to see the new background.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save homepage settings.");
      setSettings(normalizeSettings(data.settings));
      setMessage("Homepage saved. The customer homepage now uses these MySQL settings.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save homepage settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading homepage editor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Homepage</h1>
          <p className="text-muted-foreground">Edit the customer homepage hero section and background image.</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Homepage
        </Button>
      </div>

      {error && <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-xl">Hero Text</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Small Label</Label>
                <Input value={settings.eyebrow || ""} onChange={(e) => updateField("eyebrow", e.target.value)} placeholder="Live Filipino Art Store" />
              </div>
              <div className="space-y-2">
                <Label>Main Title</Label>
                <Input value={settings.title || ""} onChange={(e) => updateField("title", e.target.value)} placeholder="Curated art for" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Highlighted Title Line</Label>
                <Input value={settings.highlight || ""} onChange={(e) => updateField("highlight", e.target.value)} placeholder="modern Filipino spaces." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={4} value={settings.subtitle || ""} onChange={(e) => updateField("subtitle", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-xl">Buttons</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary Button Text</Label>
                <Input value={settings.primary_button_text || ""} onChange={(e) => updateField("primary_button_text", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Primary Button Link</Label>
                <Input value={settings.primary_button_href || ""} onChange={(e) => updateField("primary_button_href", e.target.value)} placeholder="/shop" />
              </div>
              <div className="space-y-2">
                <Label>Secondary Button Text</Label>
                <Input value={settings.secondary_button_text || ""} onChange={(e) => updateField("secondary_button_text", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Secondary Button Link</Label>
                <Input value={settings.secondary_button_href || ""} onChange={(e) => updateField("secondary_button_href", e.target.value)} placeholder="/login" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-xl">Homepage Background</h2>
            <ImageUploadRow
              label="Background Image"
              value={settings.background_image_url}
              uploading={uploadingField === "background_image_url"}
              onChange={(value) => updateField("background_image_url", value)}
              onUpload={(file) => uploadImage(file, "background_image_url")}
            />
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-xl">Featured Card</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Featured Title</Label>
                <Input value={settings.featured_title || ""} onChange={(e) => updateField("featured_title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Featured Subtitle</Label>
                <Input value={settings.featured_subtitle || ""} onChange={(e) => updateField("featured_subtitle", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <ImageUploadRow
                  label="Featured Image"
                  value={settings.featured_image_url}
                  uploading={uploadingField === "featured_image_url"}
                  onChange={(value) => updateField("featured_image_url", value)}
                  onUpload={(file) => uploadImage(file, "featured_image_url")}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="rounded-lg border bg-card p-5 shadow-sm xl:sticky xl:top-8 xl:self-start">
          <h2 className="mb-4 font-serif text-xl">Live Preview</h2>
          <div className="relative min-h-[520px] overflow-hidden rounded-xl bg-[#120f0d] text-white">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${settings.background_image_url || "/artworks/aznar-manilabay.jpg"}')` }} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,13,0.95),rgba(18,15,13,0.55))]" />
            <div className="relative z-10 flex min-h-[520px] flex-col justify-center p-8">
              <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
                <ImageIcon className="h-3 w-3" /> {settings.eyebrow || "Label"}
              </p>
              <h3 className="font-serif text-4xl leading-none">
                {settings.title || "Title"}
                <span className="block text-[#d9b878]">{settings.highlight || "Highlight"}</span>
              </h3>
              <p className="mt-5 text-sm leading-6 text-white/80">{settings.subtitle || "Description"}</p>
              <div className="mt-7 flex flex-wrap gap-3 text-xs">
                <span className="rounded bg-[#d9b878] px-4 py-2 font-semibold text-[#17130f]">{settings.primary_button_text || "Primary"}</span>
                <span className="rounded border border-white/30 bg-white/10 px-4 py-2 text-white">{settings.secondary_button_text || "Secondary"}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ImageUploadRow({
  label,
  value,
  uploading,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-start">
      <div className="overflow-hidden rounded-lg border bg-muted">
        {value ? (
          <img src={value} alt={label} className="aspect-square h-full w-full object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>{label} URL or Uploaded Path</Label>
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/homepage/image.jpg or https://example.com/image.jpg" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (file) onUpload(file);
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">You can upload from your computer or paste an internet image link.</p>
        </div>
      </div>
    </div>
  );
}
