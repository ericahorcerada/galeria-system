"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";

const footerLinks = {
  shop: [
    { name: "Artworks", href: "/shop" },
    { name: "Sale Offers", href: "/sale" },
    { name: "Inventory Info", href: "/inventory" },
    { name: "Cart", href: "/cart" },
  ],
  artists: [
    { name: "Featured Artists", href: "/artists" },
    { name: "Collections", href: "/collections" },
    { name: "Artist Directory", href: "/artists" },
    { name: "Feedback", href: "/feedback" },
  ],
  support: [
    { name: "Contact Gallery", href: "mailto:hello@galeriabutuan.ph" },
    { name: "Customer Login", href: "/login" },
    { name: "Order Cart", href: "/cart" },
    { name: "Share Feedback", href: "/feedback" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Gallery Info", href: "/about" },
    { name: "Inventory", href: "/inventory" },
    { name: "Admin Login", href: "/login" },
  ],
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "Twitter", icon: Twitter, href: "https://x.com" },
];

export function Footer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <footer ref={containerRef} className="bg-foreground text-background pt-14 pb-6 px-6 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="col-span-2 md:col-span-3 lg:col-span-2"
          >
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl tracking-[0.15em]">
                GALERIA
              </span>
              <span className="block text-[9px] tracking-[0.2em] text-white/50 uppercase">
                Butuan City
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              Celebrating Philippine art heritage through museum-quality prints
              and custom framing since 2015.
            </p>

            {/* Contact info */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>123 Butuan City Avenue, Butuan City</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>+63 (2) 8123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>hello@galeriabutuan.ph</span>
              </div>
            </div>

            {/* Social links */}
            <div className="mt-5 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 rounded border border-white/20 hover:bg-white/10 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: (i + 1) * 0.05 }}
            >
              <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3 font-medium">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 pt-5 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>&copy; {new Date().getFullYear()} Galeria Butuan City. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link>
              <Link href="/sale" className="hover:text-white transition-colors">Sale</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
