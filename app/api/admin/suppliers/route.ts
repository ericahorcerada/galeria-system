import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cleanText, isNextResponse, requireAdminSession } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupplierRow = RowDataPacket & { supplier_id: number; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null; created_at: string };

export async function GET() {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;
  try {
    const [suppliers] = await getPool().query<SupplierRow[]>("SELECT supplier_id, name, contact_person, phone, email, address, created_at FROM suppliers ORDER BY name ASC");
    return NextResponse.json({ success: true, suppliers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load suppliers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;
  try {
    const body = await request.json();
    const name = cleanText(body.name);
    const contactPerson = cleanText(body.contactPerson ?? body.contact_person);
    const phone = cleanText(body.phone);
    const email = (cleanText(body.email) || "").toLowerCase();
    const address = cleanText(body.address);
    if (!name) return NextResponse.json({ success: false, error: "Supplier name is required." }, { status: 400 });
    const [result] = await getPool().query<ResultSetHeader>("INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)", [name, contactPerson, phone, email, address]);
    return NextResponse.json({ success: true, supplierId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create supplier." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;
  try {
    const body = await request.json();
    const supplierId = Number((body.supplierId ?? body.supplier_id) || 0);
    const name = cleanText(body.name);
    const contactPerson = cleanText(body.contactPerson ?? body.contact_person);
    const phone = cleanText(body.phone);
    const email = (cleanText(body.email) || "").toLowerCase();
    const address = cleanText(body.address);
    if (!supplierId) return NextResponse.json({ success: false, error: "Supplier ID is required." }, { status: 400 });
    if (!name) return NextResponse.json({ success: false, error: "Supplier name is required." }, { status: 400 });
    const [result] = await getPool().query<ResultSetHeader>("UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE supplier_id = ?", [name, contactPerson, phone, email, address, supplierId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Supplier not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update supplier." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = Number(searchParams.get("supplierId") || 0);
    if (!supplierId) return NextResponse.json({ success: false, error: "Supplier ID is required." }, { status: 400 });
    const [result] = await getPool().query<ResultSetHeader>("DELETE FROM suppliers WHERE supplier_id = ?", [supplierId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Supplier not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete supplier." }, { status: 500 });
  }
}
