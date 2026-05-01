"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, ImagePlus, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

type Artwork = { artwork_id: number; title: string; artist_name: string; description: string | null; category: string; medium: string | null; dimensions: string | null; image_url: string | null; price: number; stock_quantity: number; status: "active" | "inactive" | "sold_out"; created_at: string };
type ArtworkForm = { artworkId?: number; title: string; artistName: string; description: string; category: string; medium: string; dimensions: string; imageUrl: string; price: string; stockQuantity: string; status: Artwork["status"] };
const emptyForm: ArtworkForm = { title: "", artistName: "", description: "", category: "Contemporary Art", medium: "Fine art print", dimensions: "", imageUrl: "/placeholder.jpg", price: "0", stockQuantity: "0", status: "active" };

export default function AdminArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<ArtworkForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const query = useMemo(() => { const params = new URLSearchParams(); if (search) params.set("q", search); if (status) params.set("status", status); params.set("ts", String(Date.now())); return params.toString(); }, [search, status]);

  async function loadArtworks() {
    setIsLoading(true); setError("");
    try { const response = await fetch(`/api/admin/artworks?${query}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } }); const result = await response.json(); if (!response.ok || !result.success) { setError(result.error || "Unable to load artworks."); return; } setArtworks(result.artworks); }
    catch { setError("Unable to reach the artworks server."); }
    finally { setIsLoading(false); }
  }
  useEffect(() => { loadArtworks(); }, [query]);

  function openCreateForm() { setForm(emptyForm); setIsFormOpen(true); setMessage(""); setError(""); }
  function openEditForm(artwork: Artwork) { setForm({ artworkId: artwork.artwork_id, title: artwork.title, artistName: artwork.artist_name, description: artwork.description || "", category: artwork.category, medium: artwork.medium || "", dimensions: artwork.dimensions || "", imageUrl: artwork.image_url || "/placeholder.jpg", price: String(artwork.price), stockQuantity: String(artwork.stock_quantity), status: artwork.status }); setIsFormOpen(true); setMessage(""); setError(""); }

  async function uploadArtworkImage(file: File) {
    setIsUploading(true); setError(""); setMessage("");
    try { const formData = new FormData(); formData.append("file", file); const response = await fetch("/api/admin/uploads", { method: "POST", body: formData, cache: "no-store" }); const result = await response.json(); if (!response.ok || !result.success || !result.url) { setError(result.error || "Unable to upload image."); return; } setForm((current) => ({ ...current, imageUrl: result.url })); setMessage("Image uploaded. Save the artwork to publish the new image."); }
    catch { setError("Unable to upload the image."); }
    finally { setIsUploading(false); }
  }

  async function saveArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError(""); setMessage("");
    try { const response = await fetch("/api/admin/artworks", { method: form.artworkId ? "PATCH" : "POST", headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }, body: JSON.stringify(form), cache: "no-store" }); const result = await response.json(); if (!response.ok || !result.success) { setError(result.error || "Unable to save artwork."); return; } setMessage(form.artworkId ? "Artwork updated. The shop will show this live from MySQL." : "Artwork created. The shop will show this live from MySQL."); setIsFormOpen(false); await loadArtworks(); }
    catch { setError("Unable to reach the artworks server."); }
    finally { setIsSaving(false); }
  }

  async function deleteArtwork(artwork: Artwork) {
    if (!window.confirm(`Delete ${artwork.title}?`)) return; setError(""); setMessage("");
    try { const response = await fetch(`/api/admin/artworks?artworkId=${artwork.artwork_id}&ts=${Date.now()}`, { method: "DELETE", cache: "no-store" }); const result = await response.json(); if (!response.ok || !result.success) { setError(result.error || "Unable to delete artwork."); return; } setMessage("Artwork deleted. Refresh the shop to confirm it is gone."); await loadArtworks(); }
    catch { setError("Unable to reach the artworks server."); }
  }

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-serif text-2xl text-foreground sm:text-3xl">Artworks</h1><p className="text-muted-foreground">Manage live storefront artwork records directly from MySQL.</p></div><div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row"><Button onClick={loadArtworks} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={openCreateForm} size="sm"><Plus className="mr-2 h-4 w-4" />Add Artwork</Button></div></div>
      {message && <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-300">{message}</div>}{error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, artist, or category" className="pl-9" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="sold_out">Sold out</option></select></CardContent></Card>
      <Card><CardContent className="p-0">{isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading artworks...</p> : <div className="overflow-x-auto"><table className="mobile-safe-table w-full text-sm"><thead><tr className="border-b bg-muted/50 text-left text-muted-foreground"><th className="px-4 py-3 font-medium">Artwork</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Medium</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{artworks.map((artwork) => <tr key={artwork.artwork_id} className="border-b last:border-0"><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={artwork.image_url || "/placeholder.jpg"} alt="" className="h-12 w-12 rounded-md bg-muted object-cover" /><div><p className="font-medium text-foreground">{artwork.title}</p><p className="text-xs text-muted-foreground">{artwork.artist_name}</p></div></div></td><td className="px-4 py-3">{artwork.category}</td><td className="px-4 py-3">{artwork.medium || "-"}<p className="text-xs text-muted-foreground">{artwork.dimensions || ""}</p></td><td className="px-4 py-3 font-medium">{peso.format(Number(artwork.price))}</td><td className="px-4 py-3"><span className={Number(artwork.stock_quantity) <= 2 ? "font-semibold text-destructive" : ""}>{artwork.stock_quantity}</span></td><td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-xs capitalize text-foreground">{artwork.status.replace("_", " ")}</span></td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEditForm(artwork)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => deleteArtwork(artwork)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}{artworks.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No artworks found.</td></tr>}</tbody></table></div>}</CardContent></Card>
      {isFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"><form onSubmit={saveArtwork} className="mobile-dialog w-full max-w-4xl rounded-xl border border-border bg-background p-4 text-foreground shadow-xl sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-serif text-2xl text-foreground">{form.artworkId ? "Edit Artwork" : "Add Artwork"}</h2><p className="text-sm text-muted-foreground">Upload an image or paste a local/remote image URL. The saved image URL is stored in MySQL.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}><X className="h-4 w-4" /></Button></div><div className="grid gap-5 lg:grid-cols-[220px_1fr]"><div className="space-y-3"><div className="aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">{form.imageUrl ? <img src={form.imageUrl} alt="Artwork preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImagePlus className="h-10 w-10" /></div>}</div><Label htmlFor="artwork-upload" className="block text-sm font-medium">Upload Image</Label><Input id="artwork-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadArtworkImage(file); event.currentTarget.value = ""; }} /><Button type="button" variant="outline" className="w-full" disabled={isUploading}><Upload className="mr-2 h-4 w-4" />{isUploading ? "Uploading..." : "Stored in public/uploads"}</Button></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div><div className="space-y-2"><Label>Artist</Label><Input value={form.artistName} onChange={(event) => setForm({ ...form, artistName: event.target.value })} required /></div><div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div><div className="space-y-2"><Label>Medium</Label><Input value={form.medium} onChange={(event) => setForm({ ...form, medium: event.target.value })} /></div><div className="space-y-2"><Label>Dimensions</Label><Input value={form.dimensions} onChange={(event) => setForm({ ...form, dimensions: event.target.value })} /></div><div className="space-y-2"><Label>Image URL</Label><Input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="/uploads/artworks/example.jpg" /></div><div className="space-y-2"><Label>Price</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div><div className="space-y-2"><Label>Stock</Label><Input type="number" min="0" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })} /></div><div className="space-y-2"><Label>Status</Label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ArtworkForm["status"] })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="active">Active</option><option value="inactive">Inactive</option><option value="sold_out">Sold out</option></select></div><div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></div></div></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving || isUploading}>{isSaving ? "Saving..." : "Save Artwork"}</Button></div></form></div>}
    </div>
  );
}
