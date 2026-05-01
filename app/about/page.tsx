import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'About - Galeria Butuan City',
  description: 'Learn about Galeria Butuan City\'s mission to promote Filipino contemporary art and support local artists.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
        <div className="absolute inset-0 bg-[url('/images/about-hero.svg')] bg-cover bg-center"></div>
        <div className="relative z-20 text-center text-white px-6">
          <h1 className="text-5xl md:text-6xl font-light tracking-[0.15em] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            ABOUT
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/90">
            Celebrating Filipino artistic excellence in the heart of Butuan City
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Our Story
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Founded in 2010, Galeria Butuan City emerged from a passionate vision to create a platform where Filipino contemporary art could thrive and be celebrated both locally and internationally.
              </p>
              <p className="text-foreground/80 mb-6">
                What began as a small gallery space has grown into a vibrant cultural hub, representing over 50 artists and hosting numerous exhibitions that have shaped the Philippine art landscape.
              </p>
              <p className="text-foreground/80">
                Our commitment remains steadfast: to discover, nurture, and showcase exceptional Filipino artistic talent while making art accessible to everyone who appreciates beauty and creativity.
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <img
                src="/images/gallery-interior.svg"
                alt="Gallery Space"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Mission & Values */}
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Our Mission & Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-medium mb-3">Artistic Excellence</h3>
                <p className="text-muted-foreground">
                  Curating exceptional works that represent the pinnacle of contemporary Filipino art
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-medium mb-3">Artist Support</h3>
                <p className="text-muted-foreground">
                  Providing a platform for artists to grow, experiment, and reach new audiences
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-medium mb-3">Cultural Heritage</h3>
                <p className="text-muted-foreground">
                  Preserving and promoting Filipino cultural identity through contemporary artistic expression
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-muted/50 rounded-lg p-12 mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Artists</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1000+</div>
                <div className="text-muted-foreground">Artworks</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">200+</div>
                <div className="text-muted-foreground">Exhibitions</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">14</div>
                <div className="text-muted-foreground">Years</div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-light tracking-[0.1em] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Visit Our Gallery
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the beauty of Filipino contemporary art in person. Our gallery is open Tuesday through Sunday, 10am to 6pm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/collections"
                className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-8 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Plan Your Visit
              </Link>
              <Link 
                href="mailto:info@galeriabutuan.com"
                className="inline-flex items-center justify-center rounded-md border border-foreground/20 px-8 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
