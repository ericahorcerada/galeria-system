import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cleanNumber, cleanText, isNextResponse, requireAdminSession } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCT_STATUSES = new Set(["active", "inactive", "discontinued"]);

type ProductRow = RowDataPacket & {
  product_id: number;
  category_id: number | null;
  category_name: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  name: string;
  sku: string;
  barcode: string | null;
  cost_price: number;
  selling_price: number;
  stock_qty: number;
  reorder_level: number;
  unit: string;
  status: "active" | "inactive" | "discontinued";
  created_at: string;
};

type CategoryRow = RowDataPacket & { category_id: number; name: string };
type SupplierRow = RowDataPacket & { supplier_id: number; name: string };

async function getLookups() {
  const pool = getPool();
  const [categories] = await pool.query<CategoryRow[]>("SELECT category_id, name FROM categories ORDER BY name ASC");
  const [suppliers] = await pool.query<SupplierRow[]>("SELECT supplier_id, name FROM suppliers ORDER BY name ASC");
  return { categories, suppliers };
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const q = cleanText(searchParams.get("q"));
    const status = cleanText(searchParams.get("status"));
    const conditions: string[] = [];
    const values: string[] = [];

    if (q) {
      conditions.push("(LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ? OR LOWER(COALESCE(p.barcode, '')) LIKE ?)");
      const like = `%${q.toLowerCase()}%`;
      values.push(like, like, like);
    }
    if (status && PRODUCT_STATUSES.has(status)) {
      conditions.push("p.status = ?");
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [products] = await getPool().query<ProductRow[]>(
      `SELECT p.product_id, p.category_id, c.name AS category_name, p.supplier_id, s.name AS supplier_name, p.name, p.sku, p.barcode,
              p.cost_price, p.selling_price, p.stock_qty, p.reorder_level, p.unit, p.status, p.created_at
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT 250`,
      values,
    );

    return NextResponse.json({ success: true, products, ...(await getLookups()) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const name = cleanText(body.name);
    const sku = cleanText(body.sku)?.toUpperCase();
    const barcode = cleanText(body.barcode);
    const categoryId = cleanNumber(body.categoryId ?? body.category_id, 0) || null;
    const supplierId = cleanNumber(body.supplierId ?? body.supplier_id, 0) || null;
    const costPrice = Math.max(0, cleanNumber(body.costPrice ?? body.cost_price, 0));
    const sellingPrice = Math.max(0, cleanNumber(body.sellingPrice ?? body.selling_price, 0));
    const stockQty = Math.max(0, Math.floor(cleanNumber(body.stockQty ?? body.stock_qty, 0)));
    const reorderLevel = Math.max(0, Math.floor(cleanNumber(body.reorderLevel ?? body.reorder_level, 10)));
    const unit = cleanText(body.unit) || "piece";
    const status = cleanText(body.status) || "active";

    if (!name) return NextResponse.json({ success: false, error: "Product name is required." }, { status: 400 });
    if (!sku) return NextResponse.json({ success: false, error: "SKU is required." }, { status: 400 });
    if (!PRODUCT_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid product status." }, { status: 400 });

    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO products (category_id, supplier_id, name, sku, barcode, cost_price, selling_price, stock_qty, reorder_level, unit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, supplierId, name, sku, barcode, costPrice, sellingPrice, stockQty, reorderLevel, unit, status],
    );
    return NextResponse.json({ success: true, productId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create product." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const productId = Math.floor(cleanNumber(body.productId ?? body.product_id, 0));
    const name = cleanText(body.name);
    const sku = cleanText(body.sku)?.toUpperCase();
    const barcode = cleanText(body.barcode);
    const categoryId = cleanNumber(body.categoryId ?? body.category_id, 0) || null;
    const supplierId = cleanNumber(body.supplierId ?? body.supplier_id, 0) || null;
    const costPrice = Math.max(0, cleanNumber(body.costPrice ?? body.cost_price, 0));
    const sellingPrice = Math.max(0, cleanNumber(body.sellingPrice ?? body.selling_price, 0));
    const stockQty = Math.max(0, Math.floor(cleanNumber(body.stockQty ?? body.stock_qty, 0)));
    const reorderLevel = Math.max(0, Math.floor(cleanNumber(body.reorderLevel ?? body.reorder_level, 10)));
    const unit = cleanText(body.unit) || "piece";
    const status = cleanText(body.status) || "active";

    if (!productId) return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    if (!name) return NextResponse.json({ success: false, error: "Product name is required." }, { status: 400 });
    if (!sku) return NextResponse.json({ success: false, error: "SKU is required." }, { status: 400 });
    if (!PRODUCT_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid product status." }, { status: 400 });

    const [result] = await getPool().query<ResultSetHeader>(
      `UPDATE products SET category_id = ?, supplier_id = ?, name = ?, sku = ?, barcode = ?, cost_price = ?, selling_price = ?, stock_qty = ?, reorder_level = ?, unit = ?, status = ? WHERE product_id = ?`,
      [categoryId, supplierId, name, sku, barcode, costPrice, sellingPrice, stockQty, reorderLevel, unit, status, productId],
    );
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update product." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const productId = Math.floor(cleanNumber(searchParams.get("productId"), 0));
    if (!productId) return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    const [result] = await getPool().query<ResultSetHeader>("DELETE FROM products WHERE product_id = ?", [productId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete product." }, { status: 500 });
  }
}
