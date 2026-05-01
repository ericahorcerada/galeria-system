"use client";

import { FormEvent, useState } from "react";
import { MessageSquare, Send, Star } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: "", email: "", rating: "5", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(""); setError(""); setIsSaving(true);
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "Unable to submit feedback."); return; }
      setStatus(result.message || "Feedback submitted.");
      setForm({ name: "", email: "", rating: "5", subject: "", message: "" });
    } catch { setError("Unable to reach feedback server."); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-28">
        <div className="mb-10 text-center">
          <MessageSquare className="mx-auto mb-4 h-10 w-10 text-accent" />
          <h1 className="mb-4 font-serif text-4xl md:text-5xl">Customer Feedback</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">Tell the gallery what went well, what needs improvement, or what artwork you want to see next.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Share Your Experience</CardTitle></CardHeader>
          <CardContent>
            {status && <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">{status}</p>}
            {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
            <form onSubmit={submitFeedback} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <div><Label htmlFor="rating">Rating</Label><select id="rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></div>
                <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Checkout, artwork, delivery, website, or service" required /></div>
              </div>
              <div><Label htmlFor="message">Message</Label><Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Sending..." : <><Send className="mr-2 h-4 w-4" />Submit Feedback</>}</Button>
            </form>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5" /> Admin can review submissions in the dashboard.</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
