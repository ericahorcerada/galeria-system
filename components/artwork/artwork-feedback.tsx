"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MessageSquare, Star } from "lucide-react";

type ArtworkFeedbackProps = {
  artworkId: number | string;
  artworkTitle?: string;
};

type FeedbackItem = {
  feedback_id?: number;
  artwork_id?: number;
  customer_name?: string | null;
  email?: string | null;
  rating?: number;
  message?: string;
  created_at?: string;
};

type StoredUser = {
  name?: string;
  full_name?: string;
  email?: string;
  identifier?: string;
};

function getStoredUser(): StoredUser {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem("galeria_user");

    if (!stored) {
      return {};
    }

    return JSON.parse(stored) as StoredUser;
  } catch {
    return {};
  }
}

function getUserName(user: StoredUser) {
  return (
    user.name ||
    user.full_name ||
    user.email ||
    user.identifier ||
    "Customer"
  );
}

function getUserEmail(user: StoredUser) {
  return user.email || user.identifier || "";
}

function formatDate(value?: string) {
  if (!value) {
    return "Just now";
  }

  return new Date(value).toLocaleDateString();
}

export function ArtworkFeedback({
  artworkId,
  artworkTitle,
}: ArtworkFeedbackProps) {
  const numericArtworkId = Number(artworkId);

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) {
      return 0;
    }

    const total = feedbacks.reduce((sum, item) => {
      return sum + Number(item.rating || 0);
    }, 0);

    return total / feedbacks.length;
  }, [feedbacks]);

  async function loadFeedbacks() {
    if (!Number.isFinite(numericArtworkId) || numericArtworkId <= 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/artwork-feedback?artworkId=${numericArtworkId}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      const list =
        result.feedbacks ||
        result.feedback ||
        result.data ||
        result.results ||
        result.items ||
        [];

      if (Array.isArray(list)) {
        setFeedbacks(list);
      } else {
        setFeedbacks([]);
      }
    } catch {
      setFeedbacks([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericArtworkId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setNotice("");
    setError("");

    if (!Number.isFinite(numericArtworkId) || numericArtworkId <= 0) {
      setError("Artwork is missing.");
      return;
    }

    if (!message.trim()) {
      setError("Please write your feedback.");
      return;
    }

    const user = getStoredUser();

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/artwork-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artworkId: numericArtworkId,
          customerName: getUserName(user),
          customerEmail: getUserEmail(user),
          rating,
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to submit feedback.");
        return;
      }

      setNotice("Your rating and feedback were submitted.");
      setMessage("");
      setRating(5);
      await loadFeedbacks();
    } catch {
      setError("Unable to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Artwork Reviews
          </p>

          <h2 className="mt-2 text-2xl font-black">Ratings & Feedback</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {artworkTitle
              ? `Share your thoughts about ${artworkTitle}.`
              : "Share your thoughts about this artwork."}
          </p>
        </div>

        <div className="rounded-2xl bg-muted px-4 py-3 text-sm font-bold">
          {feedbacks.length > 0 ? (
            <span>
              {averageRating.toFixed(1)} / 5 from {feedbacks.length} review
              {feedbacks.length === 1 ? "" : "s"}
            </span>
          ) : (
            <span>No ratings yet</span>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-background p-5"
      >
        <label className="text-sm font-bold">Your Rating</label>

        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= rating;

            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`rounded-xl border px-3 py-2 transition ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
              >
                <Star className="h-5 w-5" />
              </button>
            );
          })}
        </div>

        <label className="mt-5 block text-sm font-bold">Your Feedback</label>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your feedback about this artwork..."
          className="mt-3 min-h-32 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary"
        />

        {notice && (
          <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Rating & Feedback"}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="mb-4 font-black">Customer Feedback</h3>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading feedback...</p>
        ) : feedbacks.length === 0 ? (
          <div className="rounded-2xl bg-muted p-6 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-primary" />

            <p className="font-bold">No feedback yet.</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to rate this artwork.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {feedbacks.map((feedback) => (
              <div
                key={
                  feedback.feedback_id ||
                  `${feedback.email}-${feedback.created_at}-${feedback.message}`
                }
                className="rounded-2xl border border-border bg-background p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">
                      {feedback.customer_name || "Customer"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(feedback.created_at)}
                    </p>
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                    {feedback.rating || 0}/5
                  </span>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {feedback.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ArtworkFeedback;