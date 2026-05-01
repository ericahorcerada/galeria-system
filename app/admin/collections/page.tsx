"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, ImagePlus, Plus, RefreshCw, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Collection = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  heroImageUrl: string;
  artworkCount: number;
  featuredArtists: string[];
  year: number;
  curator: string;
  exploreButtonText: string;
  artworkIds: number[];
  status: "active" | "inactive";
  sortOrder: number;
};

type Artwork = {
  artwork_id: number;
  title: string;
  artist_name: string;
  image_url: string | null;
  status: string;
};

type CollectionForm = {
  collectionId?: number;
  name: string;
  description: string;
  imageUrl: string;
  heroImageUrl: string;
  artworkCount: string;
  featuredArtists: string;
  year: string;
  curator: string;
  exploreButtonText: string;
  artworkIds: string;
  status: "active" | "inactive";
  sortOrder: string;
};

const emptyForm: CollectionForm = {
  name: "",
  description: "",
  imageUrl: "",
  heroImageUrl: "",
  artworkCount: "0",
  featuredArtists: "",
  year: String(new Date().getFullYear()),
  curator: "Galeria Butuan City Curatorial Team",
  exploreButtonText: "Explore Collection",
  artworkIds: "",
  status: "active",
  sortOrder: "0",
};

function toCsv(values: Array<string | number>) {
  return values.join(", ");
}

function fromCollection(collection: Collection): CollectionForm {
  return {
    collectionId: collection.id,
    name: collection.name,
    description: collection.description || "",
    imageUrl: collection.imageUrl || "",
    heroImageUrl: collection.heroImageUrl || "",
    artworkCount: String(collection.artworkCount || 0),
    featuredArtists: toCsv(collection.featuredArtists || []),
    year: String(collection.year || new Date().getFullYear()),
    curator: collection.curator || "Galeria Butuan City Curatorial Team",
    exploreButtonText: collection.exploreButtonText || "Explore Collection",
    artworkIds: toCsv(collection.artworkIds || []),
    status: collection.status || "active",
    sortOrder: String(collection.sortOrder || 0),
  };
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [form, setForm] = useState<CollectionForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<"imageUrl" | "heroImageUrl" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedArtworkIds = useMemo(() => {
    return new Set(
      form.artworkIds
        .split(",")
        .map((item) => Number.parseInt(item.trim(), 10))
        .filter((id) => Number.isFinite(id) && id > 0),
    );
  }, [form.artworkIds]);

  async function loadCollections() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/admin/collections?t=${Date.now()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load collections.");
      setCollections(data.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load collections.");
    } finally {
      setLoading(false);
    }
  }

  async function loadArtworks() {
    try {
      const response = await fetch(`/api/admin/artworks?t=${Date.now()}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.success) setArtworks(data.artworks || []);
    } catch {
      // Artwork picker is optional. Keep the page usable even if this fails.
    }
  }

  useEffect(() => {
    loadCollections();
    loadArtworks();
  }, []);

  function updateField<K extends keyof CollectionForm>(key: K, value: CollectionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startAdd() {
    setForm({ ...emptyForm, sortOrder: String(collections.length + 1) });
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function startEdit(collection: Collection) {
    setForm(fromCollection(collection));
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setForm(emptyForm);
    setShowForm(false);
    setMessage("");
  }

  function toggleArtwork(id: number) {
    const ids = new Set(selectedArtworkIds);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    updateField("artworkIds", Array.from(ids).sort((a, b) => a - b).join(", "));
    updateField("artworkCount", String(ids.size));
  }

  async function uploadImage(file: File, field: "imageUrl" | "heroImageUrl") {
    try {
      setUploadingField(field);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "collections");
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Upload failed.");
      updateField(field, data.url);
      if (field === "imageUrl" && !form.heroImageUrl) updateField("heroImageUrl", data.url);
      setMessage("Image uploaded. Click Save Collection to publish the change.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingField(null);
    }
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        collectionId: form.collectionId,
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        heroImageUrl: form.heroImageUrl,
        artworkCount: Number.parseInt(form.artworkCount, 10) || 0,
        featuredArtists: form.featuredArtists,
        year: Number.parseInt(form.year, 10) || new Date().getFullYear(),
        curator: form.curator,
        exploreButtonText: form.exploreButtonText,
        artworkIds: form.artworkIds,
        status: form.status,
        sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      };
      const response = await fetch("/api/admin/collections", {
        method: form.collectionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save collection.");
      setMessage("Collection saved. Refresh the public Collections page to see it.");
      setShowForm(false);
      setForm(emptyForm);
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save collection.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCollection(collection: Collection) {
    if (!confirm(`Delete ${collection.name}?`)) return;
    try {
      setError("");
      const response = await fetch(`/api/admin/collections?collectionId=${collection.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to delete collection.");
      setMessage("Collection deleted.");
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete collection.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Collections</h1>
          <p className="text-sm text-muted-foreground">Edit the Art Collections cards, Explore button text, images, hero image, and artworks shown inside each collection.</p>
        </div>
        <div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => { loadCollections(); loadArtworks(); }} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startAdd}>
            <Plus className="h-4 w-4" />
            Add Collection
          </Button>
        </div>
      </div>

      {message && <div className="rounded-md border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-200">{message}</div>}
      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={saveCollection} className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl">{form.collectionId ? "Edit Collection" : "Add Collection"}</h2>
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Collection Name</Label>
                  <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Contemporary Masters" required />
                </div>
                <div className="space-y-2">
                  <Label>Explore Button Text</Label>
                  <Input value={form.exploreButtonText} onChange={(event) => updateField("exploreButtonText", event.target.value)} placeholder="Explore Collection" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Short collection description" />
                </div>
                <div className="space-y-2">
                  <Label>Card Image URL</Label>
                  <div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row">
                    <Input value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} placeholder="/artworks/bencab-sabel.jpg" />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      {uploadingField === "imageUrl" ? "Uploading" : "Upload"}
                      <input className="hidden" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], "imageUrl")} />
                    </label>
                  </div>
                  {form.imageUrl && <img src={form.imageUrl} alt="Card preview" className="h-32 w-full rounded-md object-cover" />}
                </div>
                <div className="space-y-2">
                  <Label>Collection Page Hero Image URL</Label>
                  <div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row">
                    <Input value={form.heroImageUrl} onChange={(event) => updateField("heroImageUrl", event.target.value)} placeholder="/artworks/bencab-sabel.jpg" />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted">
                      <ImagePlus className="h-4 w-4" />
                      {uploadingField === "heroImageUrl" ? "Uploading" : "Upload"}
                      <input className="hidden" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], "heroImageUrl")} />
                    </label>
                  </div>
                  {form.heroImageUrl && <img src={form.heroImageUrl} alt="Hero preview" className="h-32 w-full rounded-md object-cover" />}
                </div>
                <div className="space-y-2">
                  <Label>Featured Artists, comma-separated</Label>
                  <Input value={form.featuredArtists} onChange={(event) => updateField("featuredArtists", event.target.value)} placeholder="BenCab, Ronald Ventura" />
                </div>
                <div className="space-y-2">
                  <Label>Curator</Label>
                  <Input value={form.curator} onChange={(event) => updateField("curator", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input value={form.year} onChange={(event) => updateField("year", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Artwork Count Badge</Label>
                  <Input value={form.artworkCount} onChange={(event) => updateField("artworkCount", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={form.status} onChange={(event) => updateField("status", event.target.value as "active" | "inactive")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input value={form.sortOrder} onChange={(event) => updateField("sortOrder", event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Artwork IDs in This Collection</Label>
                  <Input value={form.artworkIds} onChange={(event) => updateField("artworkIds", event.target.value)} placeholder="1, 4, 8" />
                  <p className="text-xs text-muted-foreground">The artwork images on the Explore Collection page come from these artwork IDs. You can type IDs or click artworks below.</p>
                  <div className="grid max-h-72 gap-2 overflow-auto rounded-md border border-border p-3 md:grid-cols-2 lg:grid-cols-3">
                    {artworks.map((artwork) => (
                      <button
                        type="button"
                        key={artwork.artwork_id}
                        onClick={() => toggleArtwork(artwork.artwork_id)}
                        className={`flex items-center gap-3 rounded-md border p-2 text-left text-sm transition-colors ${selectedArtworkIds.has(artwork.artwork_id) ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                      >
                        <img src={artwork.image_url || "/placeholder.jpg"} alt="" className="h-12 w-12 rounded object-cover" />
                        <span className="min-w-0">
                          <span className="block font-medium">#{artwork.artwork_id} {artwork.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{artwork.artist_name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={saving || uploadingField !== null}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Collection"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading collections...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="mobile-safe-table w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Collection</th>
                    <th className="px-4 py-3">Images</th>
                    <th className="px-4 py-3">Button</th>
                    <th className="px-4 py-3">Artwork IDs</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((collection) => (
                    <tr key={collection.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium">{collection.name}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{collection.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row">
                          <img src={collection.imageUrl || "/placeholder.jpg"} alt="" className="h-12 w-16 rounded object-cover" />
                          <img src={collection.heroImageUrl || collection.imageUrl || "/placeholder.jpg"} alt="" className="h-12 w-16 rounded object-cover" />
                        </div>
                      </td>
                      <td className="px-4 py-3">{collection.exploreButtonText}</td>
                      <td className="px-4 py-3">{toCsv(collection.artworkIds || []) || "None"}</td>
                      <td className="px-4 py-3">{collection.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(collection)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCollection(collection)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {collections.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No collections yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
