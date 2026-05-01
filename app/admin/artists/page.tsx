"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Eye, X, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Artist {
  artist_id: number;
  name: string;
  alias: string;
  bio: string;
  image_url: string;
  artworks: number;
  total_sales: number;
  featured_work: string;
  status: "active" | "inactive";
}

const fallbackArtists: Artist[] = [
  { artist_id: 1, name: "Benedicto Cabrera", alias: "BenCab", bio: "National Artist of the Philippines, known for his iconic Sabel series and depictions of Filipino life and culture.", image_url: "/images/artists/artist-1.svg", artworks: 45, total_sales: 2340000, featured_work: "Sabel in the Wind", status: "active" },
  { artist_id: 2, name: "Fernando Amorsolo", alias: "Grand Old Man of Philippine Art", bio: "First National Artist, celebrated for his mastery of light and romanticized depictions of Philippine rural life.", image_url: "/images/artists/artist-2.svg", artworks: 38, total_sales: 3150000, featured_work: "Rice Planting", status: "active" },
  { artist_id: 3, name: "Ronald Ventura", alias: "Master of Hyperrealism", bio: "Contemporary artist known for layered imagery combining hyperrealism with pop culture and religious iconography.", image_url: "/images/artists/artist-3.svg", artworks: 32, total_sales: 4200000, featured_work: "Grayground", status: "active" },
  { artist_id: 4, name: "Ang Kiukok", alias: "Master of Philippine Expressionism", bio: "Known for his powerful visual imagery, angular forms, and emotionally charged paintings.", image_url: "/images/artists/artist-4.svg", artworks: 28, total_sales: 1890000, featured_work: "Fishermen of Batangas", status: "active" },
  { artist_id: 5, name: "Juan Luna", alias: "Filipino Master", bio: "One of the first Filipino artists to gain international recognition, known for historical and allegorical works.", image_url: "/images/artists/artist-5.svg", artworks: 15, total_sales: 5600000, featured_work: "Portrait of a Filipina", status: "active" },
  { artist_id: 6, name: "Vicente Manansala", alias: "Transparent Cubism Pioneer", bio: "National Artist known for developing transparent cubism and interpreting Filipino life through layered forms.", image_url: "/images/artists/artist-6.svg", artworks: 22, total_sales: 1450000, featured_work: "Chocolate Hills of Bohol", status: "active" },
  { artist_id: 7, name: "Arturo Luz", alias: "Modernist Master", bio: "National Artist recognized for elegant minimalist compositions, linear forms, and geometric abstraction.", image_url: "/images/artists/artist-7.svg", artworks: 18, total_sales: 2100000, featured_work: "Archipelago Dreams", status: "active" },
  { artist_id: 8, name: "Juvenal Sanso", alias: "Poet of Forms", bio: "Known for dreamlike landscapes and expressive compositions inspired by nature and memory.", image_url: "/images/artists/artist-8.svg", artworks: 20, total_sales: 1750000, featured_work: "Palawan Underground River", status: "active" },
];

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    alias: "",
    bio: "",
    image_url: "",
    image_link: "",
    featured_work: "",
    artworks: "0",
    total_sales: "0",
    status: "active" as Artist["status"],
  });

  const loadArtists = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/artists", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load artists.");
      setArtists(data.artists || []);
    } catch (error) {
      setArtists(fallbackArtists);
      setMessage(error instanceof Error ? error.message : "Unable to load artists from MySQL. Showing fallback artists.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const filteredArtists = useMemo(() => artists.filter((artist) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = artist.name.toLowerCase().includes(query) || artist.alias.toLowerCase().includes(query) || artist.bio.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || artist.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [artists, searchQuery, statusFilter]);

  const currentImage = formData.image_link.trim() || formData.image_url || "/placeholder-user.jpg";

  const openModal = (artist?: Artist) => {
    if (artist) {
      setEditingArtist(artist);
      setFormData({
        name: artist.name,
        alias: artist.alias,
        bio: artist.bio,
        image_url: artist.image_url || "/placeholder-user.jpg",
        image_link: artist.image_url?.startsWith("http") ? artist.image_url : "",
        featured_work: artist.featured_work || "",
        artworks: String(artist.artworks ?? 0),
        total_sales: String(artist.total_sales ?? 0),
        status: artist.status,
      });
    } else {
      setEditingArtist(null);
      setFormData({ name: "", alias: "", bio: "", image_url: "/placeholder-user.jpg", image_link: "", featured_work: "", artworks: "0", total_sales: "0", status: "active" });
    }
    setMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving || isUploading) return;
    setIsModalOpen(false);
    setEditingArtist(null);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    setMessage("");
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "artists");
      const response = await fetch("/api/admin/uploads", { method: "POST", body: uploadData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Upload failed.");
      setFormData((prev) => ({ ...prev, image_url: data.url, image_link: "" }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setMessage("Artist name is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    const imageUrl = formData.image_link.trim() || formData.image_url || "/placeholder-user.jpg";
    const payload = {
      artistId: editingArtist?.artist_id,
      name: formData.name.trim(),
      alias: formData.alias.trim(),
      bio: formData.bio.trim(),
      imageUrl,
      featuredWork: formData.featured_work.trim(),
      artworks: Number(formData.artworks) || 0,
      totalSales: Number(formData.total_sales) || 0,
      status: formData.status,
    };

    try {
      const response = await fetch("/api/admin/artists", {
        method: editingArtist ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save artist.");
      await loadArtists();
      setIsModalOpen(false);
      setEditingArtist(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save artist.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (artistId: number) => {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/artists?artistId=${artistId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to delete artist.");
      await loadArtists();
      setDeleteConfirm(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete artist.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-2xl text-foreground sm:text-3xl">Artists</h1>
          <p className="text-sm text-muted-foreground mt-1">{artists.length} artists</p>
        </div>
        <Button onClick={() => openModal()} className="bg-foreground text-background hover:bg-foreground/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Artist
        </Button>
      </div>

      {message && <div className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{message}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search artists..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded border border-border bg-background text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="rounded border border-border p-12 text-center text-muted-foreground">Loading artists...</div>
      ) : filteredArtists.length === 0 ? (
        <div className="rounded border border-border p-12 text-center text-muted-foreground">No artists found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtists.map((artist) => (
            <motion.div key={artist.artist_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    <img src={artist.image_url || "/placeholder-user.jpg"} alt={artist.name} className="h-16 w-16 rounded-full object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium truncate">{artist.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{artist.alias}</p>
                        </div>
                        <span className={`shrink-0 inline-flex text-xs px-2 py-0.5 rounded font-medium ${artist.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {artist.status.charAt(0).toUpperCase() + artist.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{artist.bio}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-t border-border">
                    <div className="p-3 text-center border-r border-border">
                      <p className="text-lg font-semibold">{artist.artworks}</p>
                      <p className="text-xs text-muted-foreground">Artworks</p>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-lg font-semibold">{new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(Number(artist.total_sales || 0))}</p>
                      <p className="text-xs text-muted-foreground">Sales</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 p-2 border-t border-border bg-muted/30">
                    <button onClick={() => setSelectedArtist(artist)} className="p-1.5 text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => openModal(artist)} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteConfirm(artist.artist_id)} className="p-1.5 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedArtist && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedArtist(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-background text-foreground border border-border rounded-lg w-full max-w-md">
              <div className="relative h-32 bg-muted">
                <img src={selectedArtist.image_url || "/placeholder-user.jpg"} alt={selectedArtist.name} className="absolute -bottom-10 left-4 h-20 w-20 rounded-full border-4 border-background object-cover bg-muted" />
                <button onClick={() => setSelectedArtist(null)} className="absolute top-2 right-2 p-1 bg-background/90 border border-border rounded-full text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="pt-12 p-4">
                <h2 className="font-serif text-xl">{selectedArtist.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedArtist.alias}</p>
                <p className="text-sm text-muted-foreground mt-4">{selectedArtist.bio}</p>
                {selectedArtist.featured_work && <p className="text-sm mt-4"><span className="font-medium">Featured work:</span> {selectedArtist.featured_work}</p>}
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-border">
                <Button variant="outline" onClick={() => setSelectedArtist(null)}>Close</Button>
                <Button onClick={() => { setSelectedArtist(null); openModal(selectedArtist); }} className="bg-foreground text-background hover:bg-foreground/90">Edit</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-background text-foreground border border-border rounded-lg w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-serif text-xl">{editingArtist ? "Edit Artist" : "Add New Artist"}</h2>
                <button onClick={closeModal} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <img src={currentImage} alt="Artist preview" className="h-24 w-24 rounded-full object-cover bg-muted border border-border" />
                    <label className="absolute bottom-0 right-0 p-2 bg-foreground text-background rounded-full cursor-pointer shadow">
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Upload Display Picture</label>
                  <Input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} disabled={isUploading} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Uploaded files are saved under public/uploads/artists and the path is stored in MySQL.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Or Image Link From Internet</label>
                  <div className="relative mt-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={formData.image_link} onChange={(e) => setFormData({ ...formData, image_link: e.target.value })} className="pl-9" placeholder="https://example.com/artist-photo.jpg" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">When this is filled, this URL is saved to MySQL and used on the customer homepage.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" placeholder="Artist's full name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Alias / Title</label>
                  <Input value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} className="mt-1" placeholder="e.g., Master of Expressionism" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Biography</label>
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-sm resize-none" rows={3} placeholder="Brief biography..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Featured Work</label>
                  <Input value={formData.featured_work} onChange={(e) => setFormData({ ...formData, featured_work: e.target.value })} className="mt-1" placeholder="e.g., Sabel in the Wind" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Artworks Count</label>
                    <Input type="number" min="0" value={formData.artworks} onChange={(e) => setFormData({ ...formData, artworks: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Total Sales</label>
                    <Input type="number" min="0" value={formData.total_sales} onChange={(e) => setFormData({ ...formData, total_sales: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Artist["status"] })} className="w-full mt-1 h-10 px-3 rounded border border-border bg-background text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-border">
                <Button variant="outline" onClick={closeModal} disabled={isSaving || isUploading}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || isUploading} className="bg-foreground text-background hover:bg-foreground/90">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingArtist ? "Save Changes" : "Create Artist"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-background text-foreground border border-border rounded-lg w-full max-w-sm p-6">
              <h3 className="font-serif text-lg text-foreground">Delete Artist?</h3>
              <p className="text-sm text-muted-foreground mt-2">This removes the artist from MySQL. If all artists are deleted, the starter artists are automatically restored.</p>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button onClick={() => handleDelete(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
