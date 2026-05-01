"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    content:
      "The quality of the prints exceeded my expectations. Each piece captures the essence of Filipino artistry beautifully. My Amorsolo print is now the centerpiece of my living room.",
    author: "Maria Santos",
    role: "Art Collector, Butuan City",
    rating: 5,
    image: "/images/testimonials/client-1.svg",
  },
  {
    id: 2,
    content:
      "As an interior designer, I recommend Galeria Butuan City to all my clients. The framing quality is exceptional, and their customer service truly understands art presentation.",
    author: "Carlos Reyes",
    role: "Interior Designer, BGC",
    rating: 5,
    image: "/images/artists/artist-1.svg",
  },
  {
    id: 3,
    content:
      "I purchased a BenCab print for my office and the reactions have been incredible. The attention to detail in both the print and packaging shows true craftsmanship.",
    author: "Ana Gonzales",
    role: "CEO, Startup Founder",
    rating: 5,
    image: "/images/artists/artist-8.svg",
  },
];

const trustedBy = ["Ayala Museum", "CCP", "Pinto Art Museum", "Ateneo Art Gallery"];

export function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-sm text-accent font-medium tracking-wide uppercase">
            What Our Collectors Say
          </p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground">
            Voices of Art Lovers
          </h2>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative bg-secondary p-6 rounded"
            >
              {/* Quote icon */}
              <div className="absolute -top-3 left-5 p-2 bg-accent rounded">
                <Quote className="h-3.5 w-3.5 text-white" />
              </div>

              {/* Rating */}
              <div className="flex gap-0.5 mb-4 pt-2">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground/80 text-sm leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-sm text-foreground">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 pt-10 border-t border-border"
        >
          <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-wider">
            Trusted by collectors and institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {trustedBy.map((name) => (
              <span key={name} className="font-serif text-lg text-muted-foreground/50">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
