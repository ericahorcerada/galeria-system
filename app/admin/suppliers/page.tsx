"use client";

import { FormEvent, useEffect, useState } from "react";
import { Edit, Plus, RefreshCw, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Supplier = { supplier_id: number; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null; created_at: string };
type SupplierForm = { supplierId?: number; name: string; contactPerson: string; phone: string; email: string; address: string };
const emptyForm: SupplierForm = { name: "", contactPerson: "", phone: "", email: "", address: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSuppliers() {
    setIsLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/suppliers", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to load suppliers."); return; }
      setSuppliers(result.suppliers || []);
    } catch { setError("Unable to reach suppliers server."); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadSuppliers(); }, []);
  function openCreate() { setForm(emptyForm); setIsFormOpen(true); setMessage(""); setError(""); }
  function openEdit(supplier: Supplier) { setForm({ supplierId: supplier.supplier_id, name: supplier.name, contactPerson: supplier.contact_person || "", phone: supplier.phone || "", email: supplier.email || "", address: supplier.address || "" }); setIsFormOpen(true); setMessage(""); setError(""); }

  async function saveSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/suppliers", { method: form.supplierId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to save supplier."); return; }
      setMessage(form.supplierId ? "Supplier updated." : "Supplier created."); setIsFormOpen(false); await loadSuppliers();
    } catch { setError("Unable to reach suppliers server."); }
    finally { setIsSaving(false); }
  }

  async function deleteSupplier(supplier: Supplier) {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;
    setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/suppliers?supplierId=${supplier.supplier_id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to delete supplier."); return; }
      setMessage("Supplier deleted."); await loadSuppliers();
    } catch { setError("Unable to reach suppliers server."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-serif text-2xl text-foreground sm:text-3xl">Suppliers</h1><p className="text-muted-foreground">Manage supplier names, contact people, email, phone, and addresses used by inventory products.</p></div><div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row"><Button onClick={loadSuppliers} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={openCreate} size="sm"><Plus className="mr-2 h-4 w-4" />Add Supplier</Button></div></div>
      {message && <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-300">{message}</p>}{error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <Card><CardContent className="p-0">{isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading suppliers...</p> : <div className="overflow-x-auto"><table className="mobile-safe-table w-full text-sm"><thead><tr className="border-b bg-muted/50 text-left text-muted-foreground"><th className="px-4 py-3 font-medium">Supplier</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Address</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.supplier_id} className="border-b last:border-0"><td className="px-4 py-3"><p className="font-medium">{supplier.name}</p><p className="text-xs text-muted-foreground">ID #{supplier.supplier_id}</p></td><td className="px-4 py-3"><p>{supplier.contact_person || "No contact person"}</p><p className="text-xs text-muted-foreground">{supplier.email || "No email"} {supplier.phone ? `• ${supplier.phone}` : ""}</p></td><td className="px-4 py-3 text-muted-foreground">{supplier.address || "No address"}</td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(supplier)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => deleteSupplier(supplier)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}{suppliers.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground"><Truck className="mx-auto mb-2 h-8 w-8" />No suppliers found.</td></tr>}</tbody></table></div>}</CardContent></Card>
      {isFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={saveSupplier} className="w-full max-w-2xl rounded-xl bg-background p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-serif text-2xl">{form.supplierId ? "Edit Supplier" : "Add Supplier"}</h2><p className="text-sm text-muted-foreground">Supplier details help staff reorder stock and trace product sources.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}><X className="h-4 w-4" /></Button></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div><div className="space-y-2"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div><div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div><div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div className="space-y-2 sm:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} /></div></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Supplier"}</Button></div></form></div>}
    </div>
  );
}
