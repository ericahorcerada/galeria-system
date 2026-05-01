import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { DEFAULT_ARTISTS, listArtists } from '@/lib/artists';

export const metadata: Metadata = {
  title: 'Artists - Galeria Butuan City',
  description: 'Discover talented Filipino artists and their unique artistic expressions at Galeria Butuan City.',
};

export const dynamic = 'force-dynamic';

type PublicArtist = {
  artist_id: number;
  name: string;
  alias: string;
  bio: string;
  image_url: string;
  artworks: number;
  featured_work: string;
};

async function getArtists(): Promise<PublicArtist[]> {
  try {
    const artists = await listArtists({ activeOnly: true });
    return artists.length ? artists : DEFAULT_ARTISTS;
  } catch {
    return DEFAULT_ARTISTS;
  }
}

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
        <div className="absolute inset-0 bg-[url('/images/artists-hero.svg')] bg-cover bg-center"></div>
        <div className="relative z-20 text-center text-white px-6">
          <h1 className="text-5xl md:text-6xl font-light tracking-[0.15em] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            ARTISTS
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/90">
            Meet the visionaries behind our curated collection of contemporary Filipino art
          </p>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Featured Artists
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Our gallery represents a diverse group of established and emerging artists. Edits saved in the admin Artists page are shown here automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {artists.map((artist) => (
              <div key={artist.artist_id} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg mb-4 aspect-[3/4] bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={artist.image_url || '/placeholder-user.jpg'}
                    alt={artist.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                  />
                </div>
                <h3 className="text-xl font-medium mb-2 group-hover:text-primary transition-colors">{artist.name}</h3>
                <p className="text-muted-foreground text-sm mb-2">{artist.alias}</p>
                <p className="text-sm text-foreground/70 line-clamp-3">{artist.bio}</p>
                {artist.featured_work ? <p className="text-xs text-muted-foreground mt-3">Featured: {artist.featured_work}</p> : null}
              </div>
            ))}
          </div>

          <div className="text-center bg-muted/50 rounded-lg p-12">
            <h3 className="text-2xl md:text-3xl font-light tracking-[0.1em] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Become a Featured Artist
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Are you an artist looking to showcase your work? We're always looking for talented creators to join our gallery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-8 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors">
                Submit Your Portfolio
              </Link>
              <Link href="/shop" className="inline-flex items-center justify-center rounded-md border border-foreground/20 px-8 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors">
                Browse Artworks
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
