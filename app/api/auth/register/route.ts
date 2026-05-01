import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ExistingCustomerRow = RowDataPacket & { customer_id: number };

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return response;
}

async function ensureCustomerAuthColumns() {
  const pool = getPool();
  const [passwordColumns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM customers LIKE 'password_hash'");
  if (passwordColumns.length === 0) {
    await pool.query("ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255) NULL AFTER email");
  }
  const [statusColumns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM customers LIKE 'status'");
  if (statusColumns.length === 0) {
    await pool.query("ALTER TABLE customers ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER loyalty_points");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const phone = String(body.phone || "").trim() || null;

    if (!firstName || !lastName || !email || !password || !confirmPassword) return jsonNoStore({ success: false, error: "First name, last name, email, password, and password confirmation are required." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return jsonNoStore({ success: false, error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return jsonNoStore({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
    if (password !== confirmPassword) return jsonNoStore({ success: false, error: "Passwords do not match." }, { status: 400 });

    await ensureCustomerAuthColumns();

    const pool = getPool();
    const [existingRows] = await pool.query<ExistingCustomerRow[]>("SELECT customer_id FROM customers WHERE LOWER(email) = ? LIMIT 1", [email]);
    if (existingRows.length > 0) return jsonNoStore({ success: false, error: "An account with that email already exists. Please sign in instead." }, { status: 409 });

    const fullName = `${firstName} ${lastName}`.trim();
    const passwordHash = await hashPassword(password);
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO customers (full_name, phone, email, password_hash, loyalty_points, status) VALUES (?, ?, ?, ?, 0, 'active')`,
      [fullName, phone, email, passwordHash],
    );

    const token = createSessionToken({ id: result.insertId, role: "customer", name: fullName, identifier: email });
    await setSessionCookie(token);

    return jsonNoStore({ success: true, role: "customer", redirectTo: "/shop" }, { status: 201 });
  } catch (error) {
    return jsonNoStore({ success: false, error: error instanceof Error ? error.message : "Unable to create account." }, { status: 500 });
  }
}
