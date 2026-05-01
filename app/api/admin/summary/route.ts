import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type CountRow = RowDataPacket & { count: number };
type MoneyRow = RowDataPacket & { total: number | null };
type OrderRow = RowDataPacket & { order_number: string; customer_name: string; total_amount: number; payment_method: string; payment_status: string; order_status: string; created_at: string };
type StockRow = RowDataPacket & { title: string; artist_name: string; stock_quantity: number };
async function count(query: string) { const [rows] = await getPool().query<CountRow[]>(query); return Number(rows[0]?.count || 0); }
export async function GET() {
  const session = await getCurrentSession();
  if (!session || !["admin", "staff"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const pool = getPool();
    const [revenueRows] = await pool.query<MoneyRow[]>("SELECT SUM(total_amount) AS total FROM store_orders WHERE order_status <> 'cancelled'");
    const [recentOrders] = await pool.query<OrderRow[]>(`SELECT order_number, customer_name, total_amount, payment_method, payment_status, order_status, created_at FROM store_orders ORDER BY created_at DESC LIMIT 10`);
    const [lowStock] = await pool.query<StockRow[]>(`SELECT title, artist_name, stock_quantity FROM store_artworks WHERE stock_quantity <= 2 AND status = 'active' ORDER BY stock_quantity ASC, title ASC LIMIT 10`);
    const [orders, pendingOrders, customers, artworks] = await Promise.all([count("SELECT COUNT(*) AS count FROM store_orders"), count("SELECT COUNT(*) AS count FROM store_orders WHERE order_status = 'pending'"), count("SELECT COUNT(*) AS count FROM customers"), count("SELECT COUNT(*) AS count FROM store_artworks WHERE status = 'active'")]);
    return NextResponse.json({ success: true, user: { name: session.name, role: session.role, identifier: session.identifier }, stats: { orders, pendingOrders, customers, artworks, revenue: Number(revenueRows[0]?.total || 0), lowStock: lowStock.length }, recentOrders, lowStock });
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load summary." }, { status: 500 }); }
}
