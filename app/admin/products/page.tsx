"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

type Product = { product_id: number; category_id: number | null; category_name: string | null; supplier_id: number | null; supplier_name: string | null; name: string; sku: string; barcode: string | null; cost_price: number; selling_price: number; stock_qty: number; reorder_level: number; unit: string; status: "active" | "inactive" | "discontinued"; created_at: string };
type Lookup = { category_id?: number; supplier_id?: number; name: string };
type ProductForm = { productId?: number; name: string; sku: string; barcode: string; categoryId: string; supplierId: string; costPrice: string; sellingPrice: string; stockQty: string; reorderLevel: string; unit: string; status: Product["status"] };

const emptyForm: ProductForm = { name: "", sku: "", barcode: "", categoryId: "", supplierId: "", costPrice: "0", sellingPrice: "0", stockQty: "0", reorderLevel: "10", unit: "piece", status: "active" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [suppliers, setSuppliers] = useState<Lookup[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const query = useMemo(() => { const p = new URLSearchParams(); if (search) p.set("q", search); if (status) p.set("status", status); return p.toString(); }, [search, status]);

  async function loadProducts() {
    setIsLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/products${query ? `?${query}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to load products."); return; }
      setProducts(result.products); setCategories(result.categories || []); setSuppliers(result.suppliers || []);
    } catch { setError("Unable to reach the products server."); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadProducts(); }, [query]);

  function openCreateForm() { setForm(emptyForm); setIsFormOpen(true); setMessage(""); setError(""); }
  function openEditForm(product: Product) {
    setForm({ productId: product.product_id, name: product.name, sku: product.sku, barcode: product.barcode || "", categoryId: String(product.category_id || ""), supplierId: String(product.supplier_id || ""), costPrice: String(product.cost_price), sellingPrice: String(product.selling_price), stockQty: String(product.stock_qty), reorderLevel: String(product.reorder_level), unit: product.unit, status: product.status });
    setIsFormOpen(true); setMessage(""); setError("");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/products", { method: form.productId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to save product."); return; }
      setMessage(form.productId ? "Product updated." : "Product created."); setIsFormOpen(false); await loadProducts();
    } catch { setError("Unable to reach the products server."); }
    finally { setIsSaving(false); }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/products?productId=${product.product_id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to delete product."); return; }
      setMessage("Product deleted."); await loadProducts();
    } catch { setError("Unable to reach the products server."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-serif text-2xl text-foreground sm:text-3xl">Products</h1><p className="text-muted-foreground">Live MySQL POS inventory with costs, pricing, stock levels, suppliers, and categories.</p></div><div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row"><Button onClick={loadProducts} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={openCreateForm} size="sm"><Plus className="mr-2 h-4 w-4" />Add Product</Button></div></div>
      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}{error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, or barcode" className="pl-9" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="discontinued">Discontinued</option></select></CardContent></Card>
      <Card><CardContent className="p-0">{isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading products...</p> : <div className="overflow-x-auto"><table className="mobile-safe-table w-full text-sm"><thead><tr className="border-b bg-muted/50 text-left text-muted-foreground"><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Supplier</th><th className="px-4 py-3 font-medium">Cost</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product.product_id} className="border-b last:border-0"><td className="px-4 py-3"><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku}{product.barcode ? ` - ${product.barcode}` : ""}</p></td><td className="px-4 py-3">{product.category_name || "-"}</td><td className="px-4 py-3">{product.supplier_name || "-"}</td><td className="px-4 py-3">{peso.format(Number(product.cost_price))}</td><td className="px-4 py-3 font-medium">{peso.format(Number(product.selling_price))}</td><td className="px-4 py-3"><span className={Number(product.stock_qty) <= Number(product.reorder_level) ? "font-semibold text-red-600" : ""}>{product.stock_qty} {product.unit}</span><p className="text-xs text-muted-foreground">Reorder at {product.reorder_level}</p></td><td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{product.status}</span></td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEditForm(product)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => deleteProduct(product)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}{products.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No products found.</td></tr>}</tbody></table></div>}</CardContent></Card>
      {isFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={saveProduct} className="w-full max-w-3xl rounded-xl bg-background p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-serif text-2xl">{form.productId ? "Edit Product" : "Add Product"}</h2><p className="text-sm text-muted-foreground">SKU must be unique.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}><X className="h-4 w-4" /></Button></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div><div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></div><div className="space-y-2"><Label>Barcode</Label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div><div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div><div className="space-y-2"><Label>Category</Label><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="">No category</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}</select></div><div className="space-y-2"><Label>Supplier</Label><select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="">No supplier</option>{suppliers.map((supplier) => <option key={supplier.supplier_id} value={supplier.supplier_id}>{supplier.name}</option>)}</select></div><div className="space-y-2"><Label>Cost Price</Label><Input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div><div className="space-y-2"><Label>Selling Price</Label><Input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></div><div className="space-y-2"><Label>Stock</Label><Input type="number" min="0" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} /></div><div className="space-y-2"><Label>Reorder Level</Label><Input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></div><div className="space-y-2"><Label>Status</Label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductForm["status"] })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="discontinued">Discontinued</option></select></div></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Product"}</Button></div></form></div>}
    </div>
  );
}
