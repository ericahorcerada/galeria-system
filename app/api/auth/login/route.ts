import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie, type SessionRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRole = "customer" | "staff" | "admin";

type CashierLoginRow = RowDataPacket & {
  cashier_id: number;
  full_name: string;
  username: string;
  password_hash: string | null;
  role: "cashier" | "supervisor" | "admin";
  status: "active" | "inactive" | "on_leave";
};

type CustomerLoginRow = RowDataPacket & {
  customer_id: number;
  full_name: string;
  email: string;
  password_hash: string | null;
  status: "active" | "inactive";
};

const ADMIN_IDENTIFIER = "admin";
const ADMIN_PASSWORD = "artspace2024";

function roleRedirect(role: SessionRole) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/customer/dashboard";
}

function normalizeRole(value: unknown, identifier: string): LoginRole {
  if (value === "admin" || identifier === ADMIN_IDENTIFIER) return "admin";
  if (value === "staff") return "staff";
  return "customer";
}

async function ensureCustomerAuthColumns() {
  const pool = getPool();
  const [passwordColumns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM customers LIKE 'password_hash'");
  if (passwordColumns.length === 0) await pool.query("ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255) NULL AFTER email");
  const [statusColumns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM customers LIKE 'status'");
  if (statusColumns.length === 0) await pool.query("ALTER TABLE customers ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER loyalty_points");
}

async function findCashierByUsername(username: string) {
  const [rows] = await getPool().query<CashierLoginRow[]>(
    "SELECT cashier_id, full_name, username, password_hash, role, status FROM cashiers WHERE LOWER(username) = ? LIMIT 1",
    [username.toLowerCase()],
  );
  return rows[0] ?? null;
}

async function findCustomerByEmail(email: string) {
  await ensureCustomerAuthColumns();
  const [rows] = await getPool().query<CustomerLoginRow[]>(
    "SELECT customer_id, full_name, email, password_hash, status FROM customers WHERE LOWER(email) = ? LIMIT 1",
    [email.toLowerCase()],
  );
  return rows[0] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const selectedRole = normalizeRole(body.role, identifier);

    if (!identifier || !password) return NextResponse.json({ success: false, error: "Username/email and password are required." }, { status: 400 });

    if (selectedRole === "admin" || selectedRole === "staff") {
      let account: CashierLoginRow | null = null;

      try {
        account = await findCashierByUsername(identifier);
      } catch (error) {
        if (selectedRole === "admin" && identifier === ADMIN_IDENTIFIER && password === ADMIN_PASSWORD) {
          const token = createSessionToken({ id: 1, role: "admin", name: "Admin User", identifier: ADMIN_IDENTIFIER });
          await setSessionCookie(token);
          return NextResponse.json({ success: true, role: "admin", redirectTo: roleRedirect("admin") });
        }
        throw error;
      }

      if (!account || !(await verifyPassword(password, account.password_hash))) {
        return NextResponse.json({ success: false, error: selectedRole === "admin" ? "Invalid admin username or password." : "Invalid staff username or password." }, { status: 401 });
      }
      if (account.status !== "active") return NextResponse.json({ success: false, error: "This account is not active. Ask an admin to activate it in Admin > Staff." }, { status: 403 });
      if (selectedRole === "admin" && account.role !== "admin") return NextResponse.json({ success: false, error: "This account is not an admin account." }, { status: 403 });
      if (selectedRole === "staff" && account.role === "admin") return NextResponse.json({ success: false, error: "Use the Admin role to sign in with an admin account." }, { status: 403 });

      const sessionRole: SessionRole = account.role === "admin" ? "admin" : "staff";
      const token = createSessionToken({ id: account.cashier_id, role: sessionRole, name: account.full_name, identifier: account.username });
      await setSessionCookie(token);
      return NextResponse.json({ success: true, role: sessionRole, redirectTo: roleRedirect(sessionRole) });
    }

    if (!/^\S+@\S+\.\S+$/.test(identifier)) return NextResponse.json({ success: false, error: "Use the Gmail or email address you registered with." }, { status: 400 });
    const customer = await findCustomerByEmail(identifier);
    if (!customer || !(await verifyPassword(password, customer.password_hash))) {
      return NextResponse.json({ success: false, error: "Invalid customer email or password. Create an account first if you are new." }, { status: 401 });
    }
    if (customer.status !== "active") return NextResponse.json({ success: false, error: "This customer account is inactive. Please contact the gallery." }, { status: 403 });

    const token = createSessionToken({ id: customer.customer_id, role: "customer", name: customer.full_name, identifier: customer.email });
    await setSessionCookie(token);
    return NextResponse.json({ success: true, role: "customer", redirectTo: roleRedirect("customer") });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 500 });
  }
}
