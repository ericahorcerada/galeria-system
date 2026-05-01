import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SHIPPING_FEE = 500;
const TAX_RATE = 0.12;
const PAYMENT_METHODS = new Set(["cod", "gcash", "maya", "bank_transfer"]);
type CheckoutItem = { id: string | number; quantity: number };
type ArtworkRow = RowDataPacket & { artwork_id: number; title: string; artist_name: string; price: number; stock_quantity: number };
function asText(value: unknown) { return String(value || "").trim(); }
function makeOrderNumber() { const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, ""); const random = Math.random().toString(36).slice(2, 8).toUpperCase(); return `GM-${stamp}-${random}`; }

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "customer") {
    return NextResponse.json({ success: false, error: "Please sign in with a customer account before checkout." }, { status: 401 });
  }
  const connection = await getConnection();
  try {
    const body = await request.json();
    const rawItems = Array.isArray(body.items) ? body.items as CheckoutItem[] : [];
    const firstName = asText(body.customer?.firstName);
    const lastName = asText(body.customer?.lastName);
    const email = asText(body.customer?.email).toLowerCase();
    const phone = asText(body.customer?.phone);
    const address = asText(body.shipping?.address);
    const city = asText(body.shipping?.city);
    const postalCode = asText(body.shipping?.postalCode);
    const country = asText(body.shipping?.country) || "Philippines";
    const paymentMethod = asText(body.paymentMethod) || "cod";
    if (rawItems.length === 0) return NextResponse.json({ success: false, error: "Your cart is empty." }, { status: 400 });
    if (!firstName || !lastName || !email || !phone || !address || !city || !postalCode) return NextResponse.json({ success: false, error: "Complete contact and shipping details are required." }, { status: 400 });
    if (!PAYMENT_METHODS.has(paymentMethod)) return NextResponse.json({ success: false, error: "Unsupported payment method." }, { status: 400 });
    const cartItems = rawItems.map((item) => ({ id: Number(item.id), quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))) }));
    if (cartItems.some((item) => !Number.isInteger(item.id) || item.id <= 0)) return NextResponse.json({ success: false, error: "Invalid cart item." }, { status: 400 });

    await connection.beginTransaction();
    const customerId = session.id;
    const fullName = `${firstName} ${lastName}`.trim();
    await connection.query("UPDATE customers SET full_name = ?, phone = ?, status = 'active' WHERE customer_id = ?", [fullName, phone, customerId]);
    let subtotal = 0;
    const orderItems: Array<{ artwork: ArtworkRow; quantity: number; lineTotal: number }> = [];
    for (const item of cartItems) {
      const [artworkRows] = await connection.query<ArtworkRow[]>(`SELECT artwork_id, title, artist_name, price, stock_quantity FROM store_artworks WHERE artwork_id = ? AND status = 'active' FOR UPDATE`, [item.id]);
      const artwork = artworkRows[0];
      if (!artwork) throw new Error(`Artwork #${item.id} is no longer available.`);
      if (Number(artwork.stock_quantity) < item.quantity) throw new Error(`${artwork.title} only has ${artwork.stock_quantity} item(s) left.`);
      const lineTotal = Number(artwork.price) * item.quantity;
      subtotal += lineTotal;
      orderItems.push({ artwork, quantity: item.quantity, lineTotal });
    }
    const shippingFee = orderItems.length > 0 ? SHIPPING_FEE : 0;
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + shippingFee + taxAmount;
    const orderNumber = makeOrderNumber();
    const [orderResult] = await connection.query<ResultSetHeader>(`INSERT INTO store_orders (order_number, customer_id, customer_name, email, phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, subtotal, shipping_fee, tax_amount, total_amount, payment_method, payment_status, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`, [orderNumber, customerId, fullName, email, phone, address, city, postalCode, country, subtotal, shippingFee, taxAmount, totalAmount, paymentMethod]);
    const orderId = orderResult.insertId;
    for (const item of orderItems) {
      await connection.query(`INSERT INTO store_order_items (order_id, artwork_id, title, artist_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`, [orderId, item.artwork.artwork_id, item.artwork.title, item.artwork.artist_name, item.quantity, item.artwork.price, item.lineTotal]);
      await connection.query("UPDATE store_artworks SET stock_quantity = GREATEST(stock_quantity - ?, 0), status = CASE WHEN GREATEST(stock_quantity - ?, 0) = 0 THEN 'sold_out' ELSE status END WHERE artwork_id = ?", [item.quantity, item.quantity, item.artwork.artwork_id]);
    }
    await connection.commit();
    return NextResponse.json({ success: true, order: { id: orderId, orderNumber, subtotal, shippingFee, taxAmount, totalAmount, paymentMethod, paymentStatus: "pending", orderStatus: "pending" }, message: paymentMethod === "cod" ? "Order placed. Payment will be collected on delivery." : "Order placed. Staff will confirm payment instructions before fulfillment." });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to place order." }, { status: 400 });
  } finally { await connection.end(); }
}
