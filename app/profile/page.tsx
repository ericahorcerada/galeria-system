"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, signOut } from "next-auth/react";
import {
  User,
  ShoppingBag,
  Truck,
  Star,
  Heart,
  MessageSquare,
  LogOut,
  ShoppingCart,
  Gift,
  CreditCard,
  Bell,
  Settings,
  Package,
  Home,
  Clock,
  CheckCircle,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";

type ProfileUser = {
  name: string;
  email: string;
  provider: "google" | "local";
};

type ActivePanel = "pay" | "process" | "receive" | "rate" | "history" | "notifications" | "account";

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>("pay");

  useEffect(() => {
    async function loadUser() {
      try {
        const googleSession = await getSession();

        if (googleSession?.user?.email) {
          setUser({
            name: googleSession.user.name || "Google Customer",
            email: googleSession.user.email,
            provider: "google",
          });
          setLoading(false);
          return;
        }

        const localResponse = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (localResponse.ok) {
          const result = await localResponse.json();

          if (result.user) {
            setUser({
              name: result.user.name || result.user.email || "Customer",
              email: result.user.email || result.user.identifier || "",
              provider: "local",
            });
            setLoading(false);
            return;
          }
        }

        window.location.href = "/login";
      } catch {
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // Continue logout even if old logout route fails.
    }

    localStorage.removeItem("galeria_user");

    await signOut({
      callbackUrl: "/login",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex min-h-screen items-center justify-center pt-24">
          <p className="text-muted-foreground">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.name.split(" ")[0] || "Customer";

  const panelContent = {
    pay: {
      title: "To Pay",
      icon: CreditCard,
      description: "Items added to your cart and unpaid orders will appear here.",
      actionText: "Go to Cart",
      actionHref: "/cart",
      note: "Review your selected artworks and proceed to checkout when ready.",
    },
    process: {
      title: "To Process",
      icon: Package,
      description: "Orders being prepared by the gallery will appear here.",
      actionText: "Continue Shopping",
      actionHref: "/shop",
      note: "After checkout, your order details can be monitored from this account page.",
    },
    receive: {
      title: "To Receive",
      icon: Truck,
      description: "Delivery and pickup updates will appear here.",
      actionText: "View Artworks",
      actionHref: "/shop",
      note: "The gallery will update customers once artworks are packed and ready.",
    },
    rate: {
      title: "To Rate",
      icon: Star,
      description: "Completed purchases can be rated through the feedback page.",
      actionText: "Leave Feedback",
      actionHref: "/feedback",
      note: "Share your experience to help improve the gallery service.",
    },
    history: {
      title: "Purchase History",
      icon: Clock,
      description: "Your completed and active orders will be shown here once checkout is finished.",
      actionText: "Shop More Artworks",
      actionHref: "/shop",
      note: "This section works as your customer order summary area.",
    },
    notifications: {
      title: "Notifications",
      icon: Bell,
      description: "Gallery updates, order notices, and account reminders will appear here.",
      actionText: "Browse Sale Offers",
      actionHref: "/sale",
      note: "Check sale offers regularly for discounted artworks.",
    },
    account: {
      title: "Account Details",
      icon: Settings,
      description: "This account is connected using your saved login method.",
      actionText: "Back to Shop",
      actionHref: "/shop",
      note: `Login type: ${user.provider === "google" ? "Google Account" : "Galeria Email Account"}`,
    },
  };

  const currentPanel = panelContent[activePanel];
  const CurrentIcon = currentPanel.icon;

  return (
    <div className="min-h-screen bg-[#f8f3ea] text-[#2b1b10]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-[#dec9a7] bg-gradient-to-br from-[#6b3f1f] via-[#9a6430] to-[#d4a253] text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/25">
                <User className="h-10 w-10" />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/75">Customer Profile</p>
                <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">{user.name}</h1>
                <p className="mt-1 text-sm text-white/80">{user.email}</p>
                <p className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {user.provider === "google" ? "Google Account" : "Galeria Account"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/shop">
                <Button className="bg-white text-[#6b3f1f] hover:bg-white/90">Shop Now</Button>
              </Link>

              <Button
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Welcome back, {firstName}</h2>
              <p className="text-sm text-muted-foreground">
                Manage your purchases, cart, feedback, and gallery account in one place.
              </p>
            </div>

            <Link href="/feedback">
              <Button variant="outline">Share Feedback</Button>
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Purchases</h2>
            <button
              type="button"
              onClick={() => setActivePanel("history")}
              className="text-sm font-medium text-[#9a6430] hover:underline"
            >
              View Purchase History
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActivePanel("pay")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <CreditCard className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Pay</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("process")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <Package className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Process</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("receive")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <Truck className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Receive</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("rate")}
              className="rounded-2xl border border-[#eadcc5] p-5 text-center transition hover:bg-[#f8f3ea]"
            >
              <Star className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
              <p className="font-medium">To Rate</p>
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f3ea] text-[#9a6430]">
                <CurrentIcon className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">{currentPanel.title}</h2>
                <p className="text-sm text-muted-foreground">{currentPanel.description}</p>
                <p className="mt-1 text-xs text-[#9a6430]">{currentPanel.note}</p>
              </div>
            </div>

            <Link href={currentPanel.actionHref}>
              <Button>{currentPanel.actionText}</Button>
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">My Gallery Tools</h2>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/cart" className="rounded-2xl bg-[#f8f3ea] p-5 text-center transition hover:bg-[#efe0c8]">
                <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
                <p className="font-medium">Cart</p>
              </Link>

              <Link href="/shop" className="rounded-2xl bg-[#f8f3ea] p-5 text-center transition hover:bg-[#efe0c8]">
                <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
                <p className="font-medium">Shop</p>
              </Link>

              <Link href="/sale" className="rounded-2xl bg-[#f8f3ea] p-5 text-center transition hover:bg-[#efe0c8]">
                <Gift className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
                <p className="font-medium">Sale Offers</p>
              </Link>

              <Link href="/feedback" className="rounded-2xl bg-[#f8f3ea] p-5 text-center transition hover:bg-[#efe0c8]">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[#9a6430]" />
                <p className="font-medium">Feedback</p>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">Account</h2>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setActivePanel("account")}
                className="flex w-full items-center justify-between rounded-2xl bg-[#f8f3ea] px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-[#9a6430]" />
                  <span className="font-medium">Profile Name</span>
                </div>
                <span className="text-sm text-muted-foreground">{user.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePanel("notifications")}
                className="flex w-full items-center justify-between rounded-2xl bg-[#f8f3ea] px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-[#9a6430]" />
                  <span className="font-medium">Notifications</span>
                </div>
                <span className="text-sm text-muted-foreground">Order updates</span>
              </button>

              <div className="flex items-center justify-between rounded-2xl bg-[#f8f3ea] px-4 py-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#9a6430]" />
                  <span className="font-medium">Login Type</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {user.provider === "google" ? "Google" : "Email"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 font-semibold text-red-700 transition hover:bg-red-100"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#eadcc5] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold">Quick Links</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/" className="flex items-center gap-3 rounded-2xl border border-[#eadcc5] p-4 transition hover:bg-[#f8f3ea]">
              <Home className="h-5 w-5 text-[#9a6430]" />
              <span className="font-medium">Homepage</span>
            </Link>

            <Link href="/collections" className="flex items-center gap-3 rounded-2xl border border-[#eadcc5] p-4 transition hover:bg-[#f8f3ea]">
              <Heart className="h-5 w-5 text-[#9a6430]" />
              <span className="font-medium">Collections</span>
            </Link>

            <Link href="/about" className="flex items-center gap-3 rounded-2xl border border-[#eadcc5] p-4 transition hover:bg-[#f8f3ea]">
              <User className="h-5 w-5 text-[#9a6430]" />
              <span className="font-medium">About Gallery</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}