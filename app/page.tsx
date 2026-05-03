import Link from "next/link";
import {
  ArrowRight,
  Brush,
  Frame,
  Images,
  Palette,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";

const featuredCards = [
  {
    title: "Original Artworks",
    description:
      "Browse curated Philippine-inspired pieces for homes, offices, and creative spaces.",
    icon: Palette,
    href: "/shop",
  },
  {
    title: "Framed Prints",
    description:
      "Museum-style prints with elegant framing options for modern interiors.",
    icon: Frame,
    href: "/shop",
  },
  {
    title: "Collections",
    description:
      "Explore themed collections featuring landscapes, culture, color, and contemporary works.",
    icon: Images,
    href: "/collections",
  },
];

const quickLinks = [
  { label: "Shop Artworks", href: "/shop" },
  { label: "View Sale", href: "/sale" },
  { label: "Meet Artists", href: "/artists" },
  { label: "Collections", href: "/collections" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="overflow-hidden">
        <section className="relative flex min-h-screen items-center px-6 pb-20 pt-32 sm:px-10 lg:px-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,0.22),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(236,72,153,0.18),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(139,92,246,0.16),transparent_34%)]" />

          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Butuan City Art Gallery
              </div>

              <h1 className="max-w-4xl font-serif text-6xl leading-none tracking-tight text-foreground sm:text-7xl lg:text-8xl">
                GALERIA
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Discover colorful artworks, framed prints, and curated
                collections made for homes, offices, and creative spaces.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/shop"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95"
                >
                  Shop Live Collection
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-6 text-sm font-bold text-foreground shadow-sm backdrop-blur transition hover:bg-muted"
                >
                  Create Customer Account
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-border bg-card/75 px-4 py-3 text-center text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 -top-6 h-36 w-36 rounded-full bg-orange-400/25 blur-3xl" />
              <div className="absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-pink-500/25 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-violet-950 via-purple-900 to-orange-700 p-5 shadow-2xl shadow-purple-950/30">
                <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-[radial-gradient(circle_at_20%_20%,#facc15,transparent_20%),radial-gradient(circle_at_75%_25%,#ec4899,transparent_25%),radial-gradient(circle_at_50%_80%,#22c55e,transparent_22%),linear-gradient(135deg,#4f46e5,#7c3aed,#f97316)]">
                    <div className="flex h-full items-center justify-center">
                      <Brush className="h-24 w-24 text-white/80" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-3xl text-white">
                        Golden Horizon
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/75">
                        A vibrant featured artwork from the Galeria collection.
                      </p>
                    </div>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                      MySQL Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary">
                  Art Shop Features
                </p>
                <h2 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">
                  Explore the gallery
                </h2>
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                View all artworks
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {featuredCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 text-white shadow-lg shadow-pink-500/20">
                    <card.icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-black text-foreground">
                    {card.title}
                  </h3>

                  <p className="mt-3 leading-7 text-muted-foreground">
                    {card.description}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
                    Open
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-card/85 shadow-2xl shadow-black/5 backdrop-blur">
            <div className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-4 flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>

                <h2 className="font-serif text-4xl text-foreground">
                  Bring color into your space.
                </h2>

                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Shop artworks, discover artists, and manage orders through a
                  colorful Galeria e-commerce experience.
                </p>
              </div>

              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95"
              >
                <ShoppingBag className="h-4 w-4" />
                Start Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}