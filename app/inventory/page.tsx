import Link from "next/link";
import { Boxes, ClipboardList, PackageSearch, Truck } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  { title: "Stock Tracking", icon: Boxes, text: "Artwork stock is reduced after checkout, while staff can monitor low-stock items from the dashboard." },
  { title: "Supplier Records", icon: Truck, text: "Supplier contact details, purchase sources, and reorder references are managed in the admin inventory area." },
  { title: "Product SKUs", icon: PackageSearch, text: "Each product can include SKU, barcode, category, supplier, cost, price, unit, and reorder level." },
  { title: "Order Records", icon: ClipboardList, text: "Customer orders save contact, shipping, payment status, order status, and ordered artwork details in MySQL." },
];

export default function InventoryInfoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-28">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-accent">Store Operations</p>
          <h1 className="mb-4 font-serif text-4xl md:text-5xl">Stocks, Suppliers, and Inventory</h1>
          <p className="max-w-3xl text-muted-foreground">This area explains how the store keeps product, artwork, stock, supplier, and order information organized so customers and staff do not see blank sections.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader><section.icon className="mb-3 h-8 w-8 text-accent" /><CardTitle>{section.title}</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{section.text}</p></CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild><Link href="/shop">View Artwork Stock</Link></Button>
          <Button asChild variant="outline"><Link href="/login">Staff or Admin Login</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
