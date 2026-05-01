import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { getPool } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ORDER_STATUSES = new Set(["pending", "processing", "shipped", "completed", "cancelled"]);
const PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded"]);
type OrderRow = RowDataPacket & { order_id: number; order_number: string; customer_name: string; email: string; phone: string; shipping_address: string; shipping_city: string; shipping_postal_code: string; shipping_country: string; subtotal: number; shipping_fee: number; tax_amount: number; total_amount: number; payment_method: string; payment_status: string; order_status: string; created_at: string };
type ItemRow = RowDataPacket & { order_id: number; title: string; artist_name: string; quantity: number; unit_price: number; line_total: number };
async function requireStaffOrAdmin() { const session = await getCurrentSession(); return session && (session.role === "admin" || session.role === "staff") ? session : null; }
export async function GET() {
  const session = await requireStaffOrAdmin(); if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const pool = getPool();
    const [orders] = await pool.query<OrderRow[]>(`SELECT order_id, order_number, customer_name, email, phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, subtotal, shipping_fee, tax_amount, total_amount, payment_method, payment_status, order_status, created_at FROM store_orders ORDER BY created_at DESC LIMIT 100`);
    if (orders.length === 0) return NextResponse.json({ success: true, orders: [] });
    const [items] = await pool.query<ItemRow[]>(`SELECT order_id, title, artist_name, quantity, unit_price, line_total FROM store_order_items WHERE order_id IN (?) ORDER BY order_item_id ASC`, [orders.map((order) => order.order_id)]);
    const itemsByOrder = new Map<number, ItemRow[]>(); for (const item of items) itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) || []), item]);
    return NextResponse.json({ success: true, orders: orders.map((order) => ({ ...order, items: itemsByOrder.get(order.order_id) || [] })) });
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load orders." }, { status: 500 }); }
}
export async function PATCH(request: Request) {
  const session = await requireStaffOrAdmin(); if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json(); const orderNumber = String(body.orderNumber || "").trim(); const orderStatus = body.orderStatus ? String(body.orderStatus) : null; const paymentStatus = body.paymentStatus ? String(body.paymentStatus) : null;
    if (!orderNumber) return NextResponse.json({ success: false, error: "Order number is required." }, { status: 400 });
    if (orderStatus && !ORDER_STATUSES.has(orderStatus)) return NextResponse.json({ success: false, error: "Invalid order status." }, { status: 400 });
    if (paymentStatus && !PAYMENT_STATUSES.has(paymentStatus)) return NextResponse.json({ success: false, error: "Invalid payment status." }, { status: 400 });
    if (!orderStatus && !paymentStatus) return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });
    const fields: string[] = []; const values: string[] = [];
    if (orderStatus) { fields.push("order_status = ?"); values.push(orderStatus); }
    if (paymentStatus) { fields.push("payment_status = ?"); values.push(paymentStatus); }
    const [result] = await getPool().query<ResultSetHeader>(`UPDATE store_orders SET ${fields.join(", ")} WHERE order_number = ?`, [...values, orderNumber]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update order." }, { status: 500 }); }
}
