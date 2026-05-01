import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";

export default function CustomerDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-24">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-accent">Customer Dashboard</p>
          <h1 className="mb-4 font-serif text-4xl text-foreground md:text-5xl">Welcome to your Galeria Butuan City account.</h1>
          <p className="mb-8 max-w-2xl text-muted-foreground">
            You are signed in as a customer. From here, you can browse artworks, view collections, and continue shopping.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/shop">Browse Shop</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections">View Collections</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
