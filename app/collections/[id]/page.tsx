import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { DEFAULT_COLLECTIONS, getCollectionWithArtworks } from "@/lib/collections";

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

async function findCollection(id: string) {
  const collectionId = Number.parseInt(id, 10);
  if (!Number.isFinite(collectionId) || collectionId <= 0) return null;
  try {
    const collection = await getCollectionWithArtworks(collectionId);
    if (collection) return collection;
  } catch {
    // If MySQL is not running yet, keep the homepage collection links usable
    // with the same safe default collections used by the admin seed.
  }

  const fallback = DEFAULT_COLLECTIONS.find((collection) => collection.id === collectionId);
  return fallback ? { ...fallback, artworks: [] } : null;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const collection = await findCollection(id);

  if (!collection) {
    return {
      title: "Collection Not Found | Galeria Butuan City",
      description: "The requested collection could not be found.",
    };
  }

  return {
    title: `${collection.name} | Galeria Butuan City`,
    description: collection.description,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const collection = await findCollection(id);

  if (!collection) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative flex h-96 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 to-black/50" />
        <img
          src={collection.heroImageUrl || collection.imageUrl || "/images/collection-hero.svg"}
          alt={collection.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-20 px-6 text-center text-white">
          <Link href="/collections" className="mb-6 inline-flex items-center justify-center rounded-md border border-white/20 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
            ← Back to Collections
          </Link>
          <h1 className="mb-4 font-serif text-5xl font-light tracking-[0.15em] md:text-6xl">{collection.name}</h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">{collection.description}</p>
        </div>
      </section>

      <section className="border-b border-border px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-1 text-2xl font-bold text-primary">{collection.artworkCount}</div>
              <div className="text-sm text-muted-foreground">Artworks</div>
            </div>
            <div>
              <div className="mb-1 text-2xl font-bold text-primary">{collection.year}</div>
              <div className="text-sm text-muted-foreground">Year</div>
            </div>
            <div>
              <div className="mb-1 text-2xl font-bold text-primary">{collection.featuredArtists.length}</div>
              <div className="text-sm text-muted-foreground">Artists</div>
            </div>
            <div>
              <div className="mb-1 text-lg font-bold text-primary">{collection.curator}</div>
              <div className="text-sm text-muted-foreground">Curator</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-light tracking-[0.1em] md:text-4xl">Featured Artists</h2>
          <div className="mb-16 flex flex-wrap justify-center gap-4">
            {collection.featuredArtists.map((artist) => (
              <div key={artist} className="rounded-full bg-muted/50 px-6 py-3">
                <span className="text-sm font-medium">{artist}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-light tracking-[0.1em] md:text-4xl">Artworks in This Collection</h2>
          {collection.artworks.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              No artworks are assigned to this collection yet. Add artwork IDs in Admin → Collections.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {collection.artworks.map((artwork) => (
                <Link key={artwork.id} href={`/artwork/${artwork.id}`} className="group block">
                  <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                    <img
                      src={artwork.image || "/placeholder.jpg"}
                      alt={artwork.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mb-1 text-lg font-medium transition-colors group-hover:text-primary">{artwork.title}</h3>
                  <p className="mb-2 text-sm text-muted-foreground">{artwork.artist}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{artwork.medium}</span>
                    <span className="font-medium">₱{artwork.price.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{artwork.dimensions}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-muted/30 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 font-serif text-3xl font-light tracking-[0.1em] md:text-4xl">Interested in This Collection?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Schedule a private viewing or inquire about purchasing artworks from this exceptional collection.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/about" className="inline-flex items-center justify-center rounded-md bg-foreground px-8 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
              Schedule Viewing
            </Link>
            <Link href="/shop" className="inline-flex items-center justify-center rounded-md border border-foreground/20 px-8 py-3 text-sm font-medium transition-colors hover:bg-foreground/5">
              Browse All Artworks
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
