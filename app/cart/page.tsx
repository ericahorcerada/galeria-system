"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/cart-context";

type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: "cod" | "gcash" | "maya" | "bank_transfer";
};

type SafeCartItem = {
  id?: string | number;
  artwork_id?: string | number;
  artworkId?: string | number;
  title?: string;
  name?: string;
  artist?: string;
  artist_name?: string;
  artistName?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  category?: string;
  medium?: string;
  dimensions?: string;
  price?: number | string;
  quantity?: number | string;
};

const SHIPPING_FEE = 50;
const TAX_RATE = 0.12;

const initialCheckoutForm: CheckoutFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Philippines",
  paymentMethod: "cod",
};

function formatPeso(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function splitName(fullName: string | null | undefined) {
  const clean = (fullName || "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function getItemId(item: SafeCartItem) {
  return String(item.id || item.artwork_id || item.artworkId || "");
}

function getItemTitle(item: SafeCartItem) {
  return String(item.title || item.name || "Untitled Artwork");
}

function getItemArtist(item: SafeCartItem) {
  return String(item.artist || item.artist_name || item.artistName || "Gallery Artist");
}

function getItemImage(item: SafeCartItem) {
  return String(item.image || item.image_url || item.imageUrl || "/placeholder.jpg");
}

function getItemPrice(item: SafeCartItem) {
  return Number(item.price || 0);
}

function getItemQuantity(item: SafeCartItem) {
  return Number(item.quantity || 1);
}

export default function CartPage() {
  const router = useRouter();

  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  const cartItems = items as SafeCartItem[];

  const [showBilling, setShowBilling] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormData>(initialCheckoutForm);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const subtotal = Number(getTotalPrice() || 0);
  const shipping = cartItems.length > 0 ? SHIPPING_FEE : 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;

  const orderSummary = useMemo(
    () => ({
      subtotal,
      shipping,
      tax,
      total,
    }),
    [subtotal, shipping, tax, total]
  );

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        setIsCheckingAuth(true);

        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        const result = await response.json().catch(() => ({ user: null }));

        if (response.ok && result.user?.role === "customer") {
          if (!mounted) return;

          const nameParts = splitName(result.user.name);

          setIsLoggedIn(true);
          setCheckoutForm((currentForm) => ({
            ...currentForm,
            firstName: currentForm.firstName || nameParts.firstName,
            lastName: currentForm.lastName || nameParts.lastName,
            email: currentForm.email || result.user.email || result.user.identifier || "",
          }));

          return;
        }

        const googleSession = await getSession();
        const googleUser = googleSession?.user;
        const googleEmail = googleUser?.email || "";
        const googleName = googleUser?.name || "";

        if (googleEmail) {
          if (!mounted) return;

          const nameParts = splitName(googleName);

          setIsLoggedIn(true);
          setCheckoutForm((currentForm) => ({
            ...currentForm,
            firstName: currentForm.firstName || nameParts.firstName,
            lastName: currentForm.lastName || nameParts.lastName,
            email: currentForm.email || googleEmail,
          }));

  return;
}

        if (mounted) {
          setIsLoggedIn(false);
        }
      } catch {
        if (mounted) {
          setIsLoggedIn(false);
        }
      } finally {
        if (mounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkAuth();
    window.addEventListener("focus", checkAuth);

    return () => {
      mounted = false;
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  const handleQuantityChange = (item: SafeCartItem, change: number) => {
    const id = getItemId(item);
    const currentQuantity = getItemQuantity(item);

    if (!id) return;

    updateQuantity(id as never, currentQuantity + change);
  };

  const handleCheckoutSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cartItems.length === 0) return;

    if (!isLoggedIn) {
      router.push("/login?next=/cart");
      return;
    }

    setCheckoutError("");
    setSuccessMessage("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            id: getItemId(item),
            quantity: getItemQuantity(item),
          })),
          customer: {
            firstName: checkoutForm.firstName,
            lastName: checkoutForm.lastName,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
          },
          shipping: {
            address: checkoutForm.address,
            city: checkoutForm.city,
            postalCode: checkoutForm.postalCode,
            country: checkoutForm.country,
          },
          paymentMethod: checkoutForm.paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setCheckoutError(result.error || "Unable to place order.");
        return;
      }

      clearCart();
      setCheckoutForm(initialCheckoutForm);
      setShowBilling(false);

      setSuccessMessage(
        `${result.message} Order number: ${result.order.orderNumber}. Total: ${formatPeso(
          result.order.totalAmount
        )}.`
      );
    } catch {
      setCheckoutError("Unable to reach checkout server. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setCheckoutForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {successMessage && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          {checkoutError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {checkoutError}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Shopping Cart ({getTotalItems()})
                  </CardTitle>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    disabled={cartItems.length === 0}
                  >
                    Clear Cart
                  </Button>
                </CardHeader>

                <CardContent>
                  {cartItems.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Your cart is empty</p>

                      <Button asChild className="mt-4">
                        <Link href="/shop">Continue Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map((item, index) => {
                        const id = getItemId(item);
                        const title = getItemTitle(item);
                        const artist = getItemArtist(item);
                        const image = getItemImage(item);
                        const price = getItemPrice(item);
                        const quantity = getItemQuantity(item);

                        return (
                          <div key={`${id}-${index}`} className="flex gap-4 rounded-lg border p-4">
                            <img
                              src={image}
                              alt={title}
                              className="h-20 w-20 rounded object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                <div>
                                  <h3 className="font-medium text-foreground">{title}</h3>
                                  <p className="text-sm text-muted-foreground">{artist}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.category ? String(item.category) : "Artwork"}
                                    {item.medium ? ` • ${String(item.medium)}` : ""}
                                    {item.dimensions ? ` • ${String(item.dimensions)}` : ""}
                                  </p>
                                </div>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeItem(id as never)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove {title}</span>
                                </Button>
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleQuantityChange(item, -1)}
                                    disabled={quantity <= 1}
                                  >
                                    <Minus className="h-4 w-4" />
                                    <span className="sr-only">Decrease quantity</span>
                                  </Button>

                                  <span className="w-12 text-center font-medium">{quantity}</span>

                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleQuantityChange(item, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">Increase quantity</span>
                                  </Button>
                                </div>

                                <p className="font-medium text-foreground">
                                  {formatPeso(price * quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPeso(orderSummary.subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatPeso(orderSummary.shipping)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPeso(orderSummary.tax)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPeso(orderSummary.total)}</span>
                  </div>

                  {!isCheckingAuth && !isLoggedIn && cartItems.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                      Please sign in or create a customer account before checkout.
                    </div>
                  )}

                  <Button
                    className="mt-4 w-full"
                    onClick={() => {
                      if (isCheckingAuth) return;

                      if (!isLoggedIn) {
                        router.push("/login?next=/cart");
                        return;
                      }

                      setShowBilling((value) => !value);
                    }}
                    disabled={cartItems.length === 0 || isCheckingAuth}
                  >
                    {isCheckingAuth
                      ? "Checking account..."
                      : isLoggedIn
                        ? "Proceed to Checkout"
                        : "Sign in to Checkout"}
                  </Button>
                </CardContent>
              </Card>

              {showBilling && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Secure Checkout
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                        <div className="space-y-4">
                          <h3 className="font-medium text-foreground">Contact Information</h3>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                name="firstName"
                                value={checkoutForm.firstName}
                                onChange={handleInputChange}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                name="lastName"
                                value={checkoutForm.lastName}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={checkoutForm.email}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={checkoutForm.phone}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-medium text-foreground">Shipping Address</h3>

                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              name="address"
                              value={checkoutForm.address}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                name="city"
                                value={checkoutForm.city}
                                onChange={handleInputChange}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="postalCode">Postal Code</Label>
                              <Input
                                id="postalCode"
                                name="postalCode"
                                value={checkoutForm.postalCode}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
  <Label htmlFor="paymentMethod">Preferred Payment Method</Label>

  <select
    id="paymentMethod"
    name="paymentMethod"
    value={checkoutForm.paymentMethod}
    onChange={handleInputChange}
    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <option value="cod">COD / Pay on Pickup</option>
    <option value="gcash">GCash</option>
    <option value="maya">Maya</option>
    <option value="bank_transfer">Bank Transfer</option>
  </select>

  {checkoutForm.paymentMethod === "cod" && (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
      <p className="font-semibold">COD / Pay on Pickup</p>
      <p>Pay when your artwork is delivered or picked up. Staff will confirm your order first.</p>
    </div>
  )}

  {checkoutForm.paymentMethod === "gcash" && (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-800 dark:text-blue-200">
      <p className="font-semibold">GCash Payment</p>
      <p>After placing your order, send payment to the gallery GCash number. Staff will verify before processing.</p>
      <p className="mt-2 font-semibold">GCash Name: GALERIA</p>
      <p className="font-semibold">GCash Number: 09XX XXX XXXX</p>
    </div>
  )}

  {checkoutForm.paymentMethod === "maya" && (
    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-800 dark:text-green-200">
      <p className="font-semibold">Maya Payment</p>
      <p>After placing your order, send payment to the gallery Maya account. Staff will verify before processing.</p>
      <p className="mt-2 font-semibold">Maya Name: GALERIA</p>
      <p className="font-semibold">Maya Number: 09XX XXX XXXX</p>
    </div>
  )}

  {checkoutForm.paymentMethod === "bank_transfer" && (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-800 dark:text-purple-200">
      <p className="font-semibold">Bank Transfer</p>
      <p>After placing your order, transfer the total amount to the gallery bank account. Staff will verify before processing.</p>
      <p className="mt-2 font-semibold">Bank: BDO / BPI / LandBank</p>
      <p className="font-semibold">Account Name: GALERIA</p>
      <p className="font-semibold">Account Number: 0000-0000-0000</p>
    </div>
  )}
</div>

                        <Button type="submit" className="w-full" disabled={isProcessing}>
                          {isProcessing ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Place Order
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}