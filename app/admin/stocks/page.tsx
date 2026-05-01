"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackageCheck, RefreshCw, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Artwork = {
  artwork_id: number;
  title: string;
  artist_name: string;
  category: string;
  price: number;
  stock_quantity: number;
  status: "active" | "inactive" | "sold_out";
};

type Product = {
  product_id: number;
  name: string;
  sku: string;
  category_name: string | null;
  supplier_name: string | null;
  stock_qty: number;
  reorder_level: number;
  unit: string;
  status: "active" | "inactive" | "discontinued";
};

type StockRow = {
  id: string;
  type: "Artwork" | "Product";
  name: string;
  details: string;
  category: string;
  stock: number;
  reorderLevel: number;
  unit: string;
  status: string;
  editLink: string;
};

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export default function AdminStocksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState("");

  async function loadStocks() {
    setIsLoading(true);
    setError("");
    try {
      const stamp = Date.now();
      const [artworksResponse, productsResponse] = await Promise.all([
        fetch(`/api/admin/artworks?ts=${stamp}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
        fetch(`/api/admin/products?ts=${stamp}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
      ]);

      const artworksResult = await artworksResponse.json();
      const productsResult = await productsResponse.json();

      if (!artworksResponse.ok || !artworksResult.success) throw new Error(artworksResult.error || "Unable to load artwork stocks.");
      if (!productsResponse.ok || !productsResult.success) throw new Error(productsResult.error || "Unable to load product stocks.");

      setArtworks(artworksResult.artworks || []);
      setProducts(productsResult.products || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stocks.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStocks();
    const timer = window.setInterval(loadStocks, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const rows: StockRow[] = useMemo(() => {
    const artworkRows: StockRow[] = artworks.map((artwork) => ({
      id: `artwork-${artwork.artwork_id}`,
      type: "Artwork",
      name: artwork.title,
      details: `${artwork.artist_name} • ${peso.format(Number(artwork.price || 0))}`,
      category: artwork.category || "Artwork",
      stock: Number(artwork.stock_quantity || 0),
      reorderLevel: 2,
      unit: "piece",
      status: artwork.status,
      editLink: "/admin/artworks",
    }));

    const productRows: StockRow[] = products.map((product) => ({
      id: `product-${product.product_id}`,
      type: "Product",
      name: product.name,
      details: `${product.sku}${product.supplier_name ? ` • ${product.supplier_name}` : ""}`,
      category: product.category_name || "Product",
      stock: Number(product.stock_qty || 0),
      reorderLevel: Number(product.reorder_level || 0),
      unit: product.unit || "piece",
      status: product.status,
      editLink: "/admin/products",
    }));

    return [...artworkRows, ...productRows].sort((a, b) => a.stock - b.stock);
  }, [artworks, products]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.name, row.details, row.category, row.type, row.status].some((value) => value.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const totalItems = rows.length;
  const lowStock = rows.filter((row) => row.stock > 0 && row.stock <= row.reorderLevel).length;
  const outOfStock = rows.filter((row) => row.stock <= 0 || row.status === "sold_out").length;
  const totalUnits = rows.reduce((sum, row) => sum + row.stock, 0);

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Stocks</h1>
          <p className="text-muted-foreground">
            Automatically updates from artworks, products, and completed checkout stock deductions.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lastUpdated ? `Last refreshed: ${lastUpdated.toLocaleTimeString()}` : "Loading latest inventory..."}
          </p>
        </div>
        <Button onClick={loadStocks} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {isLoading ? "Refreshing..." : "Refresh Now"}
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Boxes className="h-4 w-4" />Inventory Items</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{totalItems}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><PackageCheck className="h-4 w-4" />Total Units</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{totalUnits}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Low Stock</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-amber-600">{lowStock}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ShoppingCart className="h-4 w-4" />Out of Stock</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-red-600">{outOfStock}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stocks, SKU, artist, supplier, or category" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading stock records...</p>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {filteredRows.map((row) => {
                  const isLow = row.stock > 0 && row.stock <= row.reorderLevel;
                  const isOut = row.stock <= 0 || row.status === "sold_out";
                  return (
                    <div key={`${row.id}-mobile`} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{row.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{row.details}</p>
                        </div>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize text-foreground">{row.type}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-muted-foreground">Category</p><p>{row.category}</p></div>
                        <div><p className="text-xs text-muted-foreground">Status</p><p className="capitalize">{row.status.replace("_", " ")}</p></div>
                        <div><p className="text-xs text-muted-foreground">Stock</p><p className={isOut ? "font-semibold text-red-600" : isLow ? "font-semibold text-amber-600" : "font-medium"}>{row.stock} {row.unit}</p></div>
                        <div><p className="text-xs text-muted-foreground">Reorder</p><p>{row.reorderLevel}</p></div>
                      </div>
                      <a href={row.editLink} className="mt-4 inline-flex text-sm font-medium underline underline-offset-4">Edit {row.type}</a>
                    </div>
                  );
                })}
                {filteredRows.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">No stock records found.</p>}
              </div>
              <div className="hidden overflow-x-auto md:block">
              <table className="mobile-safe-table w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const isLow = row.stock > 0 && row.stock <= row.reorderLevel;
                    const isOut = row.stock <= 0 || row.status === "sold_out";
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.details}</p>
                        </td>
                        <td className="px-4 py-3">{row.type}</td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3">
                          <span className={isOut ? "font-semibold text-red-600" : isLow ? "font-semibold text-amber-600" : "font-medium"}>
                            {row.stock} {row.unit}
                          </span>
                          <p className="text-xs text-muted-foreground">Reorder at {row.reorderLevel}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{row.status.replace("_", " ")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <a href={row.editLink} className="text-sm font-medium underline underline-offset-4">
                            Edit {row.type}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No stock records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
