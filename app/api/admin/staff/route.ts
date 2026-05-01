import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cleanNumber, cleanText, isNextResponse, requireAdminSession } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF_ROLES = new Set(["cashier", "supervisor", "admin"]);
const STAFF_STATUSES = new Set(["active", "inactive", "on_leave"]);

type StaffRow = RowDataPacket & {
  cashier_id: number;
  full_name: string;
  username: string;
  role: "cashier" | "supervisor" | "admin";
  status: "active" | "inactive" | "on_leave";
  created_at: string;
};

type CountRow = RowDataPacket & { count: number };
type RoleRow = RowDataPacket & { role: string; status: string };

function normalizeUsername(value: unknown) {
  return cleanText(value)?.toLowerCase() ?? null;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const q = cleanText(searchParams.get("q"));
    const status = cleanText(searchParams.get("status"));
    const role = cleanText(searchParams.get("role"));
    const conditions: string[] = [];
    const values: string[] = [];

    if (q) {
      conditions.push("(LOWER(full_name) LIKE ? OR LOWER(username) LIKE ?)");
      const like = `%${q.toLowerCase()}%`;
      values.push(like, like);
    }
    if (status && STAFF_STATUSES.has(status)) {
      conditions.push("status = ?");
      values.push(status);
    }
    if (role && STAFF_ROLES.has(role)) {
      conditions.push("role = ?");
      values.push(role);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [staff] = await getPool().query<StaffRow[]>(
      `SELECT cashier_id, full_name, username, role, status, created_at FROM cashiers ${where} ORDER BY created_at DESC LIMIT 250`,
      values,
    );
    return NextResponse.json({ success: true, staff });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load staff." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const fullName = cleanText(body.fullName || body.full_name);
    const username = normalizeUsername(body.username);
    const role = cleanText(body.role) || "cashier";
    const status = cleanText(body.status) || "active";
    const password = cleanText(body.password);

    if (!fullName) return NextResponse.json({ success: false, error: "Staff name is required." }, { status: 400 });
    if (!username) return NextResponse.json({ success: false, error: "Username is required." }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
    if (!STAFF_ROLES.has(role)) return NextResponse.json({ success: false, error: "Invalid staff role." }, { status: 400 });
    if (!STAFF_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid staff status." }, { status: 400 });

    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO cashiers (full_name, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
      [fullName, username, await hashPassword(password), role, status],
    );
    return NextResponse.json({ success: true, staffId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create staff account." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const cashierId = Math.floor(cleanNumber(body.cashierId ?? body.cashier_id, 0));
    const fullName = cleanText(body.fullName || body.full_name);
    const username = normalizeUsername(body.username);
    const role = cleanText(body.role);
    const status = cleanText(body.status);
    const password = cleanText(body.password);

    if (!cashierId) return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    if (!fullName) return NextResponse.json({ success: false, error: "Staff name is required." }, { status: 400 });
    if (!username) return NextResponse.json({ success: false, error: "Username is required." }, { status: 400 });
    if (role && !STAFF_ROLES.has(role)) return NextResponse.json({ success: false, error: "Invalid staff role." }, { status: 400 });
    if (status && !STAFF_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid staff status." }, { status: 400 });
    if (password && password.length < 8) return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });

    if (cashierId === session.id && status && status !== "active") {
      return NextResponse.json({ success: false, error: "You cannot deactivate your own admin account while signed in." }, { status: 400 });
    }

    const fields = ["full_name = ?", "username = ?", "role = ?", "status = ?"];
    const values: Array<string | number> = [fullName, username, role || "cashier", status || "active"];
    if (password) {
      fields.push("password_hash = ?");
      values.push(await hashPassword(password));
    }

    const [result] = await getPool().query<ResultSetHeader>(`UPDATE cashiers SET ${fields.join(", ")} WHERE cashier_id = ?`, [...values, cashierId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Staff account not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update staff account." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const cashierId = Math.floor(cleanNumber(searchParams.get("cashierId"), 0));
    if (!cashierId) return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    if (cashierId === session.id) return NextResponse.json({ success: false, error: "You cannot delete your own signed-in admin account." }, { status: 400 });

    const [targetRows] = await getPool().query<RoleRow[]>("SELECT role, status FROM cashiers WHERE cashier_id = ? LIMIT 1", [cashierId]);
    const target = targetRows[0];
    if (!target) return NextResponse.json({ success: false, error: "Staff account not found." }, { status: 404 });

    if (target.role === "admin" && target.status === "active") {
      const [countRows] = await getPool().query<CountRow[]>("SELECT COUNT(*) AS count FROM cashiers WHERE role = 'admin' AND status = 'active'");
      if (Number(countRows[0]?.count || 0) <= 1) {
        return NextResponse.json({ success: false, error: "At least one active admin must remain." }, { status: 400 });
      }
    }

    const [result] = await getPool().query<ResultSetHeader>("DELETE FROM cashiers WHERE cashier_id = ?", [cashierId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Staff account not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete staff account." }, { status: 500 });
  }
}
