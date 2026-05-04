import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = RowDataPacket & {
  order_id: number;
  id?: number;
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

export async function GET() {
  try {
    await ensureOrderTables();

    const [orders] = await getPool().query<OrderRow[]>(`
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
    `);

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
    console.error("Admin orders GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load orders.",
        orders: [],
        data: [],
      },
      { status: 500 }
    );
  }
}

async function updateOrder(request: NextRequest) {
  try {
    await ensureOrderTables();

    const body = await request.json();

    const orderId = Number(body.order_id || body.orderId || body.id);
    const status = String(body.status || body.order_status || body.orderStatus || "").trim();
    const paymentStatus = String(
      body.payment_status || body.paymentStatus || body.payment || ""
    ).trim();

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: string[] = [];

    if (status) {
      fields.push("status = ?");
      values.push(status);
    }

    if (paymentStatus) {
      fields.push("payment_status = ?");
      values.push(paymentStatus);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No order update provided.",
        },
        { status: 400 }
      );
    }

    await getPool().query<ResultSetHeader>(
      `
      UPDATE orders
      SET ${fields.join(", ")}
      WHERE order_id = ?
      `,
      [...values, orderId]
    );

    return NextResponse.json({
      success: true,
      message: "Order updated successfully.",
    });
  } catch (error) {
    console.error("Admin orders update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update order.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return updateOrder(request);
}

export async function PUT(request: NextRequest) {
  return updateOrder(request);
}

export async function POST(request: NextRequest) {
  return updateOrder(request);
}