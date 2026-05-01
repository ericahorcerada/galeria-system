import Link from "next/link";
import { BadgePercent, CalendarDays, Gift, PackageCheck } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const offers = [
  { title: "Collectors Week", value: "10% off", detail: "Selected contemporary artworks for signed-in customers.", icon: BadgePercent },
  { title: "Free Curation Advice", value: "Included", detail: "Staff can help match artworks to your room, budget, and preferred artist.", icon: Gift },
  { title: "Bundle Framing", value: "Save 15%", detail: "Discounted framing support when you reserve two or more eligible pieces.", icon: PackageCheck },
];

export default function SalePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-28">
        <section className="mb-10 rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm md:p-12">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-accent"><CalendarDays className="h-4 w-4" /> Current Gallery Offers</div>
          <h1 className="mb-4 font-serif text-4xl md:text-5xl">Sale and Discount Programs</h1>
          <p className="max-w-3xl text-muted-foreground">Browse active promotions, reservation perks, and customer benefits. Final eligibility is confirmed by staff before payment or pickup.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link href="/shop">Shop Eligible Artworks</Link></Button>
            <Button asChild variant="outline"><Link href="/login?next=/shop">Create Customer Account</Link></Button>
          </div>
        </section>
        <div className="grid gap-5 md:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.title}>
              <CardHeader><offer.icon className="mb-3 h-8 w-8 text-accent" /><CardTitle>{offer.title}</CardTitle></CardHeader>
              <CardContent><p className="mb-2 text-2xl font-semibold">{offer.value}</p><p className="text-sm text-muted-foreground">{offer.detail}</p></CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
