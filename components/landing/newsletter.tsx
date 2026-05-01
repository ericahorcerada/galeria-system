"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Check, Mail, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const benefits = [
  { icon: Mail, title: "Early Access", desc: "First look at new collections" },
  { icon: Gift, title: "Exclusive Offers", desc: "Member-only discounts" },
  { icon: Sparkles, title: "Artist Stories", desc: "Behind-the-scenes content" },
];

export function Newsletter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section ref={containerRef} className="py-20 md:py-28 bg-secondary">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-xl px-6 text-center"
      >
        <p className="text-sm text-accent font-medium tracking-wide uppercase">
          Stay Inspired
        </p>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground text-balance">
          Join Our Art Community
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Get exclusive access to new collections, artist interviews, and special
          offers. Be the first to discover emerging Filipino artists.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-background border-border text-foreground"
              required
            />
            <Button
              type="submit"
              className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 shrink-0"
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Subscribed
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Join 5,000+ art lovers. Unsubscribe anytime.
          </p>
        </form>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 grid sm:grid-cols-3 gap-6"
        >
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              className="text-center"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent mb-2">
                <benefit.icon className="h-4 w-4" />
              </div>
              <h3 className="font-medium text-sm text-foreground">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{benefit.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
