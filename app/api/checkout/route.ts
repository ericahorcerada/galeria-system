import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getPool } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHIPPING_FEE = 50;
const TAX_RATE = 0.12;
const PAYMENT_METHODS = new Set(["cod", "gcash", "maya", "bank_transfer"]);

function getPaymentLabel(method: string) {
  const labels: Record<string, string> = {
    cod: "COD / Pay on Pickup",
    gcash: "GCash",
    maya: "Maya",
    bank_transfer: "Bank Transfer",
  };

  return labels[method] || "COD / Pay on Pickup";
}

function getPaymentMessage(method: string) {
  if (method === "cod") {
    return "Order placed successfully. Please prepare payment upon delivery or pickup.";
  }

  if (method === "gcash") {
    return "Order placed successfully. Please send your GCash payment and wait for staff verification.";
  }

  if (method === "maya") {
    return "Order placed successfully. Please send your Maya payment and wait for staff verification.";
  }

  if (method === "bank_transfer") {
    return "Order placed successfully. Please complete your bank transfer and wait for staff verification.";
  }

  return "Order placed successfully.";
}

type CheckoutItem = {
  id: string | number;
  quantity: number;
};

type CustomerRow = RowDataPacket & {
  customer_id: number;
  full_name: string;
  email: string;
};

type ArtworkRow = RowDataPacket & {
  artwork_id: number;
  title: string;
  artist_name: string;
  price: number | string;
  stock_quantity: number;
};

function asText(value: unknown) {
  return String(value || "").trim();
}

function makeOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GM-${stamp}-${random}`;
}

async function getCheckoutCustomer() {
  const localSession = await getCurrentSession();

  if (localSession?.role === "customer") {
    return {
      customerId: Number(localSession.id),
      name: localSession.name,
      email: String(localSession.identifier || "").toLowerCase(),
      provider: "local" as const,
    };
  }

  const googleSession = await getServerSession(authOptions);
  const googleEmail = googleSession?.user?.email?.toLowerCase();

  if (!googleEmail) {
    return null;
  }

  const fullName = googleSession?.user?.name || "Google Customer";
  const pool = getPool();

  const [existingRows] = await pool.query<CustomerRow[]>(
    `
    SELECT customer_id, full_name, email
    FROM customers
    WHERE LOWER(email) = ?
    LIMIT 1
    `,
    [googleEmail]
  );

  if (existingRows[0]) {
    return {
      customerId: existingRows[0].customer_id,
      name: existingRows[0].full_name || fullName,
      email: googleEmail,
      provider: "google" as const,
    };
  }

  const [insertResult] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO customers (
      full_name,
      phone,
      email,
      password_hash,
      loyalty_points,
      status
    )
    VALUES (?, '', ?, 'GOOGLE_ACCOUNT', 0, 'active')
    `,
    [fullName, googleEmail]
  );

  return {
    customerId: insertResult.insertId,
    name: fullName,
    email: googleEmail,
    provider: "google" as const,
  };
}

export async function POST(request: Request) {
  const checkoutCustomer = await getCheckoutCustomer();

  if (!checkoutCustomer) {
    return NextResponse.json(
      {
        success: false,
        error: "Please sign in with a customer account before checkout.",
      },
      { status: 401 }
    );
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const body = await request.json();

    const rawItems = Array.isArray(body.items) ? (body.items as CheckoutItem[]) : [];

    const firstName = asText(body.customer?.firstName);
    const lastName = asText(body.customer?.lastName);
    const email = asText(body.customer?.email || checkoutCustomer.email).toLowerCase();
    const phone = asText(body.customer?.phone);
    const address = asText(body.shipping?.address);
    const city = asText(body.shipping?.city);
    const postalCode = asText(body.shipping?.postalCode);
    const country = asText(body.shipping?.country) || "Philippines";
    const paymentMethod = asText(body.paymentMethod) || "cod";

if (!PAYMENT_METHODS.has(paymentMethod)) {
  return NextResponse.json(
    {
      success: false,
      error: "Invalid payment method.",
    },
    { status: 400 }
  );
}

    if (!firstName || !lastName || !email || !phone || !address || !city || !postalCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Complete contact and shipping details are required.",
        },
        { status: 400 }
      );
    }

    const cartItems = rawItems.map((item) => ({
      id: Number(item.id),
      quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
    }));

    if (cartItems.some((item) => !Number.isInteger(item.id) || item.id <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cart item.",
        },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const customerId = checkoutCustomer.customerId;
    const fullName = `${firstName} ${lastName}`.trim();

    await connection.query(
      `
      UPDATE customers
      SET
        full_name = ?,
        phone = ?,
        email = ?,
        status = 'active'
      WHERE customer_id = ?
      `,
      [fullName, phone, email, customerId]
    );

    let subtotal = 0;

    const orderItems: Array<{
      artwork: ArtworkRow;
      quantity: number;
      lineTotal: number;
    }> = [];

    for (const item of cartItems) {
      const [artworkRows] = await connection.query<ArtworkRow[]>(
        `
        SELECT
          artwork_id,
          title,
          artist_name,
          price,
          stock_quantity
        FROM store_artworks
        WHERE artwork_id = ?
        LIMIT 1
        `,
        [item.id]
      );

      const artwork = artworkRows[0];

      if (!artwork) {
        throw new Error(`Artwork #${item.id} was not found.`);
      }

      if (Number(artwork.stock_quantity) < item.quantity) {
        throw new Error(`${artwork.title} only has ${artwork.stock_quantity} item(s) left.`);
      }

      const lineTotal = Number(artwork.price) * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        artwork,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const shippingFee = orderItems.length > 0 ? SHIPPING_FEE : 0;
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + shippingFee + taxAmount;
    const orderNumber = makeOrderNumber();

    const [orderResult] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO store_orders (
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
        order_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
      `,
      [
        orderNumber,
        customerId,
        fullName,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        subtotal,
        shippingFee,
        taxAmount,
        totalAmount,
        paymentMethod,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        `
        INSERT INTO store_order_items (
          order_id,
          artwork_id,
          title,
          artist_name,
          quantity,
          unit_price,
          line_total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.artwork.artwork_id,
          item.artwork.title,
          item.artwork.artist_name,
          item.quantity,
          Number(item.artwork.price),
          item.lineTotal,
        ]
      );

      await connection.query(
        `
        UPDATE store_artworks
        SET stock_quantity = GREATEST(stock_quantity - ?, 0)
        WHERE artwork_id = ?
        `,
        [item.quantity, item.artwork.artwork_id]
      );
    }

    await connection.commit();

    return NextResponse.json({
  success: true,
  order: {
    id: orderId,
    orderNumber,
    subtotal,
    shippingFee,
    taxAmount,
    totalAmount,
    paymentMethod,
    paymentMethodLabel: getPaymentLabel(paymentMethod),
    paymentStatus: "pending",
    orderStatus: "pending",
  },
  message: getPaymentMessage(paymentMethod),
});
  } catch (error) {
    await connection.rollback();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to place order.",
      },
      { status: 400 }
    );
  } finally {
    connection.release();
  }
}