import type { RowDataPacket } from "mysql2";
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = RowDataPacket & {
  order_id: number;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  city: string | null;
  payment_method: string | null;
  payment_status: string | null;
  status: string | null;
  notes: string | null;
  total_amount: number | string | null;
  created_at: string | null;
};

type OrderItemRow = RowDataPacket & {
  order_item_id: number;
  order_id: number;
  artwork_id: number;
  title: string | null;
  price: number | string | null;
  quantity: number | string | null;
  subtotal: number | string | null;
};

function toNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

async function ensureOrderTables() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(100) NULL,
      customer_name VARCHAR(255) NULL,
      customer_email VARCHAR(255) NULL,
      customer_phone VARCHAR(100) NULL,
      delivery_address TEXT NULL,
      city VARCHAR(255) NULL,
      payment_method VARCHAR(100) NULL,
      payment_status VARCHAR(100) DEFAULT 'unpaid',
      status VARCHAR(100) DEFAULT 'pending',
      notes TEXT NULL,
      total_amount DECIMAL(12, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_orders_customer_email (customer_email),
      INDEX idx_orders_order_number (order_number)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NULL,
      artwork_id INT NULL,
      title VARCHAR(255) NULL,
      price DECIMAL(12, 2) DEFAULT 0,
      quantity INT DEFAULT 1,
      subtotal DECIMAL(12, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_items_order_id (order_id),
      INDEX idx_order_items_artwork_id (artwork_id)
    )
  `);
}

function normalizeOrder(order: OrderRow, items: OrderItemRow[]) {
  const orderItems = items
    .filter((item) => Number(item.order_id) === Number(order.order_id))
    .map((item) => ({
      order_item_id: item.order_item_id,
      id: item.order_item_id,
      order_id: item.order_id,
      artwork_id: item.artwork_id,
      title: item.title || `Artwork #${item.artwork_id}`,
      artwork_title: item.title || `Artwork #${item.artwork_id}`,
      price: toNumber(item.price),
      quantity: toNumber(item.quantity) || 1,
      subtotal: toNumber(item.subtotal),
    }));

  return {
    order_id: order.order_id,
    id: order.order_id,
    order_number: order.order_number || `GM-${order.order_id}`,
    reference: order.order_number || `GM-${order.order_id}`,

    customer_name: order.customer_name || "Customer",
    customer_email: order.customer_email || "",
    customer_phone: order.customer_phone || "",

    delivery_address: order.delivery_address || "",
    shipping_address: order.delivery_address || "",
    address: order.delivery_address || "",
    city: order.city || "",

    payment_method: order.payment_method || "cash_on_delivery",
    payment_status: order.payment_status || "pending",
    status: order.status || "pending",

    notes: order.notes || "",
    total_amount: toNumber(order.total_amount),
    total: toNumber(order.total_amount),
    created_at: order.created_at,

    items: orderItems,
    order_items: orderItems,
  };
}

async function getSessionEmail(request: NextRequest) {
  const url = new URL(request.url);
  const queryEmail = url.searchParams.get("email");

  if (queryEmail) {
    return queryEmail.toLowerCase();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (typeof token?.email === "string") {
      return token.email.toLowerCase();
    }
  } catch {
    // Continue without token.
  }

  return "";
}

export async function GET(request: NextRequest) {
  try {
    await ensureOrderTables();

    const email = await getSessionEmail(request);

    let orders: OrderRow[] = [];

    if (email) {
      const [filteredOrders] = await getPool().query<OrderRow[]>(
        `
        SELECT
          order_id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          city,
          payment_method,
          payment_status,
          status,
          notes,
          total_amount,
          created_at
        FROM orders
        WHERE LOWER(customer_email) = ?
        ORDER BY created_at DESC, order_id DESC
        `,
        [email]
      );

      orders = filteredOrders;
    } else {
      const [allOrders] = await getPool().query<OrderRow[]>(`
        SELECT
          order_id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          city,
          payment_method,
          payment_status,
          status,
          notes,
          total_amount,
          created_at
        FROM orders
        ORDER BY created_at DESC, order_id DESC
        LIMIT 25
      `);

      orders = allOrders;
    }

    const [items] = await getPool().query<OrderItemRow[]>(`
      SELECT
        order_item_id,
        order_id,
        artwork_id,
        title,
        price,
        quantity,
        subtotal
      FROM order_items
      ORDER BY order_item_id ASC
    `);

    const normalizedOrders = orders.map((order) => normalizeOrder(order, items));

    return NextResponse.json({
      success: true,
      orders: normalizedOrders,
      data: normalizedOrders,
    });
  } catch (error) {
    console.error("Customer orders GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer orders.",
        orders: [],
        data: [],
      },
      { status: 500 }
    );
  }
}