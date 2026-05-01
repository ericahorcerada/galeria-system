import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { cleanNumber, cleanText, isNextResponse, requireAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_STATUSES = new Set(["active", "inactive"]);

type CustomerRow = RowDataPacket & {
  customer_id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  loyalty_points: number;
  status: "active" | "inactive" | null;
  created_at: string;
  total_orders: number;
  total_spent: number | null;
};

function normalizeEmail(value: unknown) {
  const email = cleanText(value)?.toLowerCase() ?? null;
  return email;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const q = cleanText(searchParams.get("q"));
    const status = cleanText(searchParams.get("status"));
    const conditions: string[] = [];
    const values: Array<string> = [];

    if (q) {
      conditions.push("(LOWER(c.full_name) LIKE ? OR LOWER(c.email) LIKE ? OR c.phone LIKE ?)");
      const like = `%${q.toLowerCase()}%`;
      values.push(like, like, `%${q}%`);
    }
    if (status && CUSTOMER_STATUSES.has(status)) {
      conditions.push("c.status = ?");
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [customers] = await getPool().query<CustomerRow[]>(
      `SELECT c.customer_id, c.full_name, c.email, c.phone, c.loyalty_points, COALESCE(c.status, 'active') AS status, c.created_at,
              COUNT(o.order_id) AS total_orders,
              COALESCE(SUM(CASE WHEN o.order_status <> 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent
       FROM customers c
       LEFT JOIN store_orders o ON o.customer_id = c.customer_id
       ${where}
       GROUP BY c.customer_id, c.full_name, c.email, c.phone, c.loyalty_points, c.status, c.created_at
       ORDER BY c.created_at DESC
       LIMIT 250`,
      values,
    );

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load customers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const fullName = cleanText(body.fullName || body.full_name);
    const email = normalizeEmail(body.email);
    const phone = cleanText(body.phone);
    const status = cleanText(body.status) || "active";
    const loyaltyPoints = Math.max(0, Math.floor(cleanNumber(body.loyaltyPoints ?? body.loyalty_points, 0)));
    const password = cleanText(body.password);

    if (!fullName) return NextResponse.json({ success: false, error: "Customer name is required." }, { status: 400 });
    if (email && !email.includes("@")) return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
    if (!CUSTOMER_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid customer status." }, { status: 400 });
    if (password && password.length < 8) return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });

    const passwordHash = password ? await hashPassword(password) : null;
    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO customers (full_name, phone, email, password_hash, status, loyalty_points) VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, phone, email, passwordHash, status, loyaltyPoints],
    );

    return NextResponse.json({ success: true, customerId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create customer." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const customerId = Math.floor(cleanNumber(body.customerId ?? body.customer_id, 0));
    if (!customerId) return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });

    const fullName = cleanText(body.fullName || body.full_name);
    const email = normalizeEmail(body.email);
    const phone = cleanText(body.phone);
    const status = cleanText(body.status);
    const loyaltyPointsRaw = body.loyaltyPoints ?? body.loyalty_points;
    const password = cleanText(body.password);

    if (!fullName) return NextResponse.json({ success: false, error: "Customer name is required." }, { status: 400 });
    if (email && !email.includes("@")) return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
    if (status && !CUSTOMER_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid customer status." }, { status: 400 });
    if (password && password.length < 8) return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });

    const fields = ["full_name = ?", "phone = ?", "email = ?", "status = ?", "loyalty_points = ?"];
    const values: Array<string | number | null> = [fullName, phone, email, status || "active", Math.max(0, Math.floor(cleanNumber(loyaltyPointsRaw, 0)))];
    if (password) {
      fields.push("password_hash = ?");
      values.push(await hashPassword(password));
    }

    const [result] = await getPool().query<ResultSetHeader>(`UPDATE customers SET ${fields.join(", ")} WHERE customer_id = ?`, [...values, customerId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update customer." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const customerId = Math.floor(cleanNumber(searchParams.get("customerId"), 0));
    if (!customerId) return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });
    const [result] = await getPool().query<ResultSetHeader>("DELETE FROM customers WHERE customer_id = ?", [customerId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete customer." }, { status: 500 });
  }
}
