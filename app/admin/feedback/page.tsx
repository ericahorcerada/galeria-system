"use client";

import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Feedback = {
  feedback_id: number;
  name: string;
  email: string;
  rating: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadFeedbacks() {
    setIsLoading(true); setError("");
    try {
      const response = await fetch("/api/feedback", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to load feedback."); return; }
      setFeedbacks(result.feedbacks || []);
    } catch { setError("Unable to reach feedback server."); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadFeedbacks(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-serif text-2xl text-foreground sm:text-3xl">Feedback</h1><p className="text-muted-foreground">Read customer comments, ratings, and website improvement requests.</p></div>
        <Button onClick={loadFeedbacks} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>
      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Customer Messages</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading feedback...</p> : feedbacks.length === 0 ? <p className="text-sm text-muted-foreground">No feedback submitted yet.</p> : (
            <div className="space-y-4">
              {feedbacks.map((item) => (
                <article key={item.feedback_id} className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div><h2 className="font-semibold text-foreground">{item.subject}</h2><p className="text-sm text-muted-foreground">{item.name} • {item.email}</p></div>
                    <div className="flex items-center gap-1 text-sm text-accent">{Array.from({ length: item.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{item.message}</p>
                  <p className="mt-3 text-xs text-muted-foreground">Submitted {new Date(item.created_at).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
