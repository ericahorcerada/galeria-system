"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  RefreshCw,
  Star,
  User,
  Palette,
  Globe,
} from "lucide-react";

type GeneralFeedback = {
  feedback_id?: number;
  id?: number;
  name?: string;
  customer_name?: string;
  email?: string;
  subject?: string;
  message?: string;
  rating?: number;
  status?: string;
  created_at?: string;
};

type ArtworkFeedback = {
  feedback_id?: number;
  id?: number;
  artwork_id?: number;
  customer_name?: string | null;
  name?: string | null;
  email?: string | null;
  rating?: number;
  message?: string;
  created_at?: string;
  subject?: string;
  status?: string;
};

function getDate(value?: string) {
  if (!value) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleString();
}

function getFeedbackId(feedback: GeneralFeedback | ArtworkFeedback) {
  return (
    feedback.feedback_id ||
    feedback.id ||
    `${feedback.email}-${feedback.message}-${feedback.created_at}`
  );
}

function Stars({ rating }: { rating?: number }) {
  const count = Number(rating || 0);

  return (
    <div className="flex items-center gap-1 text-pink-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= count ? "fill-current" : "opacity-30"
          }`}
        />
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [generalFeedback, setGeneralFeedback] = useState<GeneralFeedback[]>([]);
  const [artworkFeedback, setArtworkFeedback] = useState<ArtworkFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"artwork" | "general">(
    "artwork"
  );
  const [error, setError] = useState("");

  async function loadGeneralFeedback() {
    const responses = await Promise.allSettled([
      fetch("/api/admin/feedback", { cache: "no-store" }),
      fetch("/api/feedback", { cache: "no-store" }),
    ]);

    const allFeedback: GeneralFeedback[] = [];

    for (const item of responses) {
      if (item.status !== "fulfilled") {
        continue;
      }

      if (!item.value.ok) {
        continue;
      }

      const result = await item.value.json();

      const possibleLists = [
        result.feedback,
        result.feedbacks,
        result.data,
        result.results,
        result.items,
        result.messages,
      ];

      for (const list of possibleLists) {
        if (Array.isArray(list)) {
          allFeedback.push(...list);
        }
      }

      if (Array.isArray(result)) {
        allFeedback.push(...result);
      }
    }

    const uniqueFeedback = allFeedback.filter((feedback, index, array) => {
      const id = getFeedbackId(feedback);

      return array.findIndex((item) => getFeedbackId(item) === id) === index;
    });

    setGeneralFeedback(uniqueFeedback);
  }

  async function loadArtworkFeedback() {
    const response = await fetch("/api/artwork-feedback", {
      cache: "no-store",
    });

    if (!response.ok) {
      setArtworkFeedback([]);
      return;
    }

    const result = await response.json();

    const feedbackList =
      result.feedbacks ||
      result.feedback ||
      result.data ||
      result.results ||
      result.items ||
      [];

    if (Array.isArray(feedbackList)) {
      setArtworkFeedback(feedbackList);
      return;
    }

    setArtworkFeedback([]);
  }

  async function loadAllFeedback() {
    setIsLoading(true);
    setError("");

    try {
      await Promise.all([loadGeneralFeedback(), loadArtworkFeedback()]);
    } catch {
      setError("Unable to load feedback.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAllFeedback();
  }, []);

  const totalArtworkFeedback = artworkFeedback.length;
  const totalGeneralFeedback = generalFeedback.length;

  const averageArtworkRating = useMemo(() => {
    if (artworkFeedback.length === 0) {
      return 0;
    }

    const total = artworkFeedback.reduce((sum, feedback) => {
      return sum + Number(feedback.rating || 0);
    }, 0);

    return total / artworkFeedback.length;
  }, [artworkFeedback]);

  return (
    <main className="min-h-screen bg-[#12091f] px-6 py-8 text-white lg:px-10">
      <section className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-300">
            Admin Studio
          </p>

          <h1 className="mt-2 font-serif text-4xl">Feedback</h1>

          <p className="mt-2 text-sm text-white/70">
            Read general customer messages and artwork-specific ratings.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAllFeedback}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-300">
            <Palette className="h-6 w-6" />
          </div>

          <p className="text-sm text-white/60">Artwork Feedback</p>
          <p className="mt-1 text-3xl font-black">{totalArtworkFeedback}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-300">
            <Globe className="h-6 w-6" />
          </div>

          <p className="text-sm text-white/60">General Feedback</p>
          <p className="mt-1 text-3xl font-black">{totalGeneralFeedback}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
            <Star className="h-6 w-6" />
          </div>

          <p className="text-sm text-white/60">Average Artwork Rating</p>
          <p className="mt-1 text-3xl font-black">
            {averageArtworkRating ? averageArtworkRating.toFixed(1) : "0.0"}
          </p>
        </div>
      </section>

      <section className="mb-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveView("artwork")}
          className={`rounded-xl px-5 py-3 text-sm font-black transition ${
            activeView === "artwork"
              ? "bg-orange-500 text-white"
              : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          Artwork Ratings & Feedback
        </button>

        <button
          type="button"
          onClick={() => setActiveView("general")}
          className={`rounded-xl px-5 py-3 text-sm font-black transition ${
            activeView === "general"
              ? "bg-orange-500 text-white"
              : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          General Feedback
        </button>
      </section>

      {isLoading ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/70">Loading feedback...</p>
        </section>
      ) : activeView === "artwork" ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-orange-300" />
            <h2 className="text-xl font-black">
              Artwork-Specific Customer Feedback
            </h2>
          </div>

          {artworkFeedback.length === 0 ? (
            <div className="rounded-2xl bg-black/20 p-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-orange-300" />

              <p className="font-black">No artwork feedback yet.</p>

              <p className="mt-2 text-sm text-white/60">
                Feedback submitted from individual artwork pages will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {artworkFeedback.map((feedback) => {
                const feedbackId = getFeedbackId(feedback);

                return (
                  <article
                    key={String(feedbackId)}
                    className="rounded-2xl border border-white/10 bg-[#1f1233] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-300">
                            Artwork #{feedback.artwork_id || "Unknown"}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                            {feedback.status || "submitted"}
                          </span>
                        </div>

                        <h3 className="text-lg font-black">
                          {feedback.customer_name ||
                            feedback.name ||
                            "Customer"}
                        </h3>

                        <p className="mt-1 text-sm text-orange-200">
                          {feedback.email || "No email"}
                        </p>

                        <p className="mt-4 text-sm leading-6 text-white/80">
                          {feedback.message || "No message content."}
                        </p>

                        <p className="mt-4 text-xs text-white/50">
                          Submitted {getDate(feedback.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-4 lg:items-end">
                        <Stars rating={feedback.rating} />

                        {feedback.artwork_id ? (
                          <Link
                            href={`/artwork/${feedback.artwork_id}`}
                            className="rounded-xl border border-orange-300/40 px-4 py-2 text-xs font-black text-orange-200 transition hover:bg-orange-500 hover:text-white"
                          >
                            View Artwork
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-pink-300" />
            <h2 className="text-xl font-black">General Customer Messages</h2>
          </div>

          {generalFeedback.length === 0 ? (
            <div className="rounded-2xl bg-black/20 p-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-pink-300" />

              <p className="font-black">No general feedback yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {generalFeedback.map((feedback) => {
                const feedbackId = getFeedbackId(feedback);

                return (
                  <article
                    key={String(feedbackId)}
                    className="rounded-2xl border border-white/10 bg-[#1f1233] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-black">
                          {feedback.subject || "Customer Message"}
                        </h3>

                        <p className="mt-1 text-sm text-orange-200">
                          {feedback.name ||
                            feedback.customer_name ||
                            "Customer"}{" "}
                          • {feedback.email || "No email"}
                        </p>

                        <p className="mt-4 text-sm leading-6 text-white/80">
                          {feedback.message || "No message content."}
                        </p>

                        <p className="mt-4 text-xs text-white/50">
                          Submitted {getDate(feedback.created_at)}
                        </p>
                      </div>

                      <Stars rating={feedback.rating} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}