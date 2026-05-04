import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutItem = {
  artwork_id?: number;
  artworkId?: number;
  product_id?: number;
  productId?: number;
  id?: number;
  title?: string;
  name?: string;
  artwork_title?: string;
  price?: number;
  unit_price?: number;
  unitPrice?: number;
  quantity?: number;
  qty?: number;
  subtotal?: number;
  line_total?: number;
  lineTotal?: number;
};

type ColumnRow = RowDataPacket & {
  COLUMN_NAME: string;
};

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);

    if (cleaned) {
      return cleaned;
    }
  }

  return "";
}

function getPaymentMethod(rawValue: unknown) {
  const rawPaymentMethod = cleanString(rawValue).toLowerCase();

  const paymentMethodMap: Record<string, string> = {
    "cash on delivery": "cash_on_delivery",
    cash_on_delivery: "cash_on_delivery",
    cod: "cash_on_delivery",

    gcash: "gcash",
    "g-cash": "gcash",
    "g cash": "gcash",

    "bank transfer": "bank_transfer",
    bank_transfer: "bank_transfer",
    bank: "bank_transfer",

    "pay at gallery": "pay_at_gallery",
    pay_at_gallery: "pay_at_gallery",
    gallery: "pay_at_gallery",
  };

  return paymentMethodMap[rawPaymentMethod] || "";
}

function getPaymentLabel(paymentMethod: string) {
  const labels: Record<string, string> = {
    cash_on_delivery: "Cash on Delivery",
    gcash: "GCash",
    bank_transfer: "Bank Transfer",
    pay_at_gallery: "Pay at Gallery",
  };

  return labels[paymentMethod] || paymentMethod;
}

function normalizeItems(rawItems: unknown) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => {
      const cartItem = item as CheckoutItem;

      const artworkId = cleanNumber(
        cartItem.artwork_id ||
          cartItem.artworkId ||
          cartItem.product_id ||
          cartItem.productId ||
          cartItem.id
      );

      const title = getFirstString(
        cartItem.title,
        cartItem.name,
        cartItem.artwork_title,
        `Artwork #${artworkId}`
      );

      const price = cleanNumber(
        cartItem.price || cartItem.unit_price || cartItem.unitPrice
      );

      const quantity = Math.max(
        1,
        cleanNumber(cartItem.quantity || cartItem.qty || 1)
      );

      const subtotal = cleanNumber(
        cartItem.subtotal || cartItem.line_total || cartItem.lineTotal
      );

      return {
        artwork_id: artworkId,
        title,
        price,
        quantity,
        subtotal: subtotal > 0 ? subtotal : price * quantity,
      };
    })
    .filter((item) => item.artwork_id > 0 && item.quantity > 0);
}

async function tableHasColumn(tableName: string, columnName: string) {
  const pool = getPool();

  const [rows] = await pool.query<ColumnRow[]>(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );

  return rows.length > 0;
}

async function addColumnIfMissing(
  tableName: string,
  columnName: string,
  columnDefinition: string
) {
  const exists = await tableHasColumn(tableName, columnName);

  if (!exists) {
    await getPool().query(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
    );
  }
}

async function ensureCheckoutTables() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(100) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(100) NOT NULL,
      delivery_address TEXT NOT NULL,
      city VARCHAR(255) NULL,
      payment_method VARCHAR(100) NOT NULL,
      payment_status VARCHAR(100) DEFAULT 'unpaid',
      status VARCHAR(100) DEFAULT 'pending',
      notes TEXT NULL,
      total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_orders_customer_email (customer_email),
      INDEX idx_orders_order_number (order_number)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      artwork_id INT NOT NULL,
      title VARCHAR(255) NULL,
      price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      quantity INT NOT NULL DEFAULT 1,
      subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_items_order_id (order_id),
      INDEX idx_order_items_artwork_id (artwork_id)
    )
  `);

  await addColumnIfMissing("orders", "order_number", "VARCHAR(100) NULL");
  await addColumnIfMissing("orders", "customer_name", "VARCHAR(255) NULL");
  await addColumnIfMissing("orders", "customer_email", "VARCHAR(255) NULL");
  await addColumnIfMissing("orders", "customer_phone", "VARCHAR(100) NULL");
  await addColumnIfMissing("orders", "delivery_address", "TEXT NULL");
  await addColumnIfMissing("orders", "city", "VARCHAR(255) NULL");
  await addColumnIfMissing("orders", "payment_method", "VARCHAR(100) NULL");
  await addColumnIfMissing("orders", "payment_status", "VARCHAR(100) DEFAULT 'unpaid'");
  await addColumnIfMissing("orders", "status", "VARCHAR(100) DEFAULT 'pending'");
  await addColumnIfMissing("orders", "notes", "TEXT NULL");
  await addColumnIfMissing("orders", "total_amount", "DECIMAL(12, 2) DEFAULT 0");
  await addColumnIfMissing(
    "orders",
    "created_at",
    "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  );
  await addColumnIfMissing(
    "orders",
    "updated_at",
    "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  );

  await addColumnIfMissing("order_items", "order_id", "INT NULL");
  await addColumnIfMissing("order_items", "artwork_id", "INT NULL");
  await addColumnIfMissing("order_items", "title", "VARCHAR(255) NULL");
  await addColumnIfMissing("order_items", "price", "DECIMAL(12, 2) DEFAULT 0");
  await addColumnIfMissing("order_items", "quantity", "INT DEFAULT 1");
  await addColumnIfMissing("order_items", "subtotal", "DECIMAL(12, 2) DEFAULT 0");
  await addColumnIfMissing(
    "order_items",
    "created_at",
    "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  );
}

export async function POST(request: NextRequest) {
  try {
    await ensureCheckoutTables();

    const body = await request.json();

    const customerName = getFirstString(
      body.customer_name,
      body.customerName,
      body.full_name,
      body.fullName,
      body.name,
      body.customer?.name,
      body.customer?.fullName,
      body.customer?.full_name,
      body.contact?.name
    );

    const customerEmail = getFirstString(
      body.customer_email,
      body.customerEmail,
      body.email,
      body.customer?.email,
      body.contact?.email
    );

    const customerPhone = getFirstString(
      body.customer_phone,
      body.customerPhone,
      body.phone,
      body.phone_number,
      body.phoneNumber,
      body.contact_number,
      body.contactNumber,
      body.customer?.phone,
      body.customer?.phoneNumber,
      body.customer?.phone_number,
      body.contact?.phone
    );

    const deliveryAddress = getFirstString(
      body.delivery_address,
      body.deliveryAddress,
      body.shipping_address,
      body.shippingAddress,
      body.address,
      body.shipping?.address,
      body.shipping?.deliveryAddress,
      body.shipping?.delivery_address,
      body.shipping?.shippingAddress,
      body.shipping?.shipping_address
    );

    const city = getFirstString(
      body.city,
      body.shipping_city,
      body.shippingCity,
      body.shipping?.city
    );

    const notes = getFirstString(body.notes, body.order_notes, body.orderNotes);

    const paymentMethod = getPaymentMethod(
      body.payment_method ||
        body.paymentMethod ||
        body.payment_label ||
        body.paymentLabel
    );

    const items = normalizeItems(
      body.items || body.order_items || body.orderItems
    );

    const totalAmount =
      cleanNumber(body.total_amount || body.totalAmount || body.total) ||
      items.reduce((sum, item) => sum + item.subtotal, 0);

    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Complete contact and shipping details are required.",
        },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment method.",
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    const orderNumber =
      getFirstString(body.order_number, body.orderNumber) ||
      `GM-${Date.now()}`;

    const orderStatus = getFirstString(
      body.status,
      body.order_status,
      body.orderStatus,
      "pending"
    );

    const paymentStatus = getFirstString(
      body.payment_status,
      body.paymentStatus,
      "unpaid"
    );

    const [orderResult] = await getPool().query<ResultSetHeader>(
      `
      INSERT INTO orders (
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
        total_amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        city || "Butuan City",
        paymentMethod,
        paymentStatus,
        orderStatus,
        notes,
        totalAmount,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await getPool().query(
        `
        INSERT INTO order_items (
          order_id,
          artwork_id,
          title,
          price,
          quantity,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.artwork_id,
          item.title,
          item.price,
          item.quantity,
          item.subtotal,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully.",
      order_id: orderId,
      orderId,
      order_number: orderNumber,
      orderNumber,
      payment_method: paymentMethod,
      payment_label: getPaymentLabel(paymentMethod),
      total_amount: totalAmount,
    });
  } catch (error) {
    console.error("Checkout POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to place order.",
      },
      { status: 500 }
    );
  }
}