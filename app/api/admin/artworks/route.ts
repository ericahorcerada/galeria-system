import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cleanNumber, cleanText, isNextResponse, requireAdminSession } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARTWORK_STATUSES = new Set(["active", "inactive", "sold_out"]);

type ArtworkRow = RowDataPacket & {
  artwork_id: number;
  title: string;
  artist_name: string;
  description: string | null;
  category: string;
  medium: string | null;
  dimensions: string | null;
  image_url: string | null;
  price: number;
  stock_quantity: number;
  status: "active" | "inactive" | "sold_out";
  created_at: string;
};

type IdRow = RowDataPacket & { next_id: number | null };

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
      conditions.push("(LOWER(title) LIKE ? OR LOWER(artist_name) LIKE ? OR LOWER(category) LIKE ?)");
      const like = `%${q.toLowerCase()}%`;
      values.push(like, like, like);
    }
    if (status && ARTWORK_STATUSES.has(status)) {
      conditions.push("status = ?");
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [artworks] = await getPool().query<ArtworkRow[]>(
      `SELECT artwork_id, title, artist_name, description, category, medium, dimensions, image_url, price, stock_quantity, status, created_at
       FROM store_artworks
       ${where}
       ORDER BY created_at DESC, artwork_id DESC
       LIMIT 250`,
      values,
    );
    return NextResponse.json({ success: true, artworks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load artworks." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const title = cleanText(body.title);
    const artistName = cleanText(body.artistName || body.artist_name);
    const description = cleanText(body.description) || "";
    const category = cleanText(body.category) || "Uncategorized";
    const medium = cleanText(body.medium);
    const dimensions = cleanText(body.dimensions);
    const imageUrl = cleanText(body.imageUrl || body.image_url) || "/placeholder.jpg";
    const price = Math.max(0, cleanNumber(body.price, 0));
    const stockQuantity = Math.max(0, Math.floor(cleanNumber(body.stockQuantity ?? body.stock_quantity, 0)));
    const status = cleanText(body.status) || "active";

    if (!title) return NextResponse.json({ success: false, error: "Artwork title is required." }, { status: 400 });
    if (!artistName) return NextResponse.json({ success: false, error: "Artist name is required." }, { status: 400 });
    if (!ARTWORK_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid artwork status." }, { status: 400 });

    const pool = getPool();
    const [idRows] = await pool.query<IdRow[]>("SELECT COALESCE(MAX(artwork_id), 0) + 1 AS next_id FROM store_artworks");
    const artworkId = Number(idRows[0]?.next_id || 1);
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO store_artworks (artwork_id, title, artist_name, description, category, medium, dimensions, image_url, price, stock_quantity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [artworkId, title, artistName, description, category, medium, dimensions, imageUrl, price, stockQuantity, status],
    );
    return NextResponse.json({ success: true, artworkId: result.insertId || artworkId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create artwork." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json();
    const artworkId = Math.floor(cleanNumber(body.artworkId ?? body.artwork_id, 0));
    const title = cleanText(body.title);
    const artistName = cleanText(body.artistName || body.artist_name);
    const description = cleanText(body.description) || "";
    const category = cleanText(body.category) || "Uncategorized";
    const medium = cleanText(body.medium);
    const dimensions = cleanText(body.dimensions);
    const imageUrl = cleanText(body.imageUrl || body.image_url) || "/placeholder.jpg";
    const price = Math.max(0, cleanNumber(body.price, 0));
    const stockQuantity = Math.max(0, Math.floor(cleanNumber(body.stockQuantity ?? body.stock_quantity, 0)));
    const status = cleanText(body.status) || "active";

    if (!artworkId) return NextResponse.json({ success: false, error: "Artwork ID is required." }, { status: 400 });
    if (!title) return NextResponse.json({ success: false, error: "Artwork title is required." }, { status: 400 });
    if (!artistName) return NextResponse.json({ success: false, error: "Artist name is required." }, { status: 400 });
    if (!ARTWORK_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid artwork status." }, { status: 400 });

    const [result] = await getPool().query<ResultSetHeader>(
      `UPDATE store_artworks SET title = ?, artist_name = ?, description = ?, category = ?, medium = ?, dimensions = ?, image_url = ?, price = ?, stock_quantity = ?, status = ? WHERE artwork_id = ?`,
      [title, artistName, description, category, medium, dimensions, imageUrl, price, stockQuantity, status, artworkId],
    );
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Artwork not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update artwork." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const artworkId = Math.floor(cleanNumber(searchParams.get("artworkId"), 0));
    if (!artworkId) return NextResponse.json({ success: false, error: "Artwork ID is required." }, { status: 400 });
    const [result] = await getPool().query<ResultSetHeader>("DELETE FROM store_artworks WHERE artwork_id = ?", [artworkId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Artwork not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete artwork." }, { status: 500 });
  }
}
