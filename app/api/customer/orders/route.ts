import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getPool } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = RowDataPacket & {
  order_id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string;
  email: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string | null;
};

type ItemRow = RowDataPacket & {
  order_id: number;
  title: string;
  artist_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

async function getCustomerIdentity() {
  const localSession = await getCurrentSession();

  if (localSession?.role === "customer") {
    return {
      customerId: Number(localSession.id),
      email: localSession.identifier?.toLowerCase() || "",
      name: localSession.name,
      provider: "local" as const,
    };
  }

  const googleSession = await getServerSession(authOptions);

  if (googleSession?.user?.email) {
    return {
      customerId: null,
      email: googleSession.user.email.toLowerCase(),
      name: googleSession.user.name || googleSession.user.email,
      provider: "google" as const,
    };
  }

  return null;
}

export async function GET() {
  const customer = await getCustomerIdentity();

  if (!customer) {
    return NextResponse.json(
      {
        success: false,
        error: "Please sign in first.",
      },
      { status: 401 }
    );
  }

  try {
    const pool = getPool();

    const values: Array<string | number> = [];
    let whereClause = "";

    if (customer.customerId) {
      whereClause = "(customer_id = ? OR LOWER(email) = ?)";
      values.push(customer.customerId, customer.email);
    } else {
      whereClause = "LOWER(email) = ?";
      values.push(customer.email);
    }

    const [orders] = await pool.query<OrderRow[]>(
      `
      SELECT
        order_id,
        order_number,
        customer_id,
        customer_name,
        email,
        phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        subtotal,
        shipping_fee,
        tax_amount,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at,
        updated_at
      FROM store_orders
      WHERE ${whereClause}
      ORDER BY created_at DESC
      `,
      values
    );

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        customer,
        orders: [],
      });
    }

    const orderIds = orders.map((order) => order.order_id);

    const [items] = await pool.query<ItemRow[]>(
      `
      SELECT
        order_id,
        title,
        artist_name,
        quantity,
        unit_price,
        line_total
      FROM store_order_items
      WHERE order_id IN (?)
      ORDER BY order_item_id ASC
      `,
      [orderIds]
    );

    const itemsByOrder = new Map<number, ItemRow[]>();

    for (const item of items) {
      itemsByOrder.set(item.order_id, [
        ...(itemsByOrder.get(item.order_id) || []),
        item,
      ]);
    }

    return NextResponse.json({
      success: true,
      customer,
      orders: orders.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.order_id) || [],
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load customer orders.",
      },
      { status: 500 }
    );
  }
}