import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import { cleanNumber, cleanText, isNextResponse, requireAdminSession } from "@/lib/admin-auth";
import { ensureDefaultArtists, getNextArtistId, listArtists } from "@/lib/artists";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARTIST_STATUSES = new Set(["active", "inactive"]);

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const q = cleanText(searchParams.get("q"));
    const status = cleanText(searchParams.get("status"));

    await ensureDefaultArtists();

    const conditions: string[] = [];
    const values: string[] = [];

    if (q) {
      conditions.push("(LOWER(name) LIKE ? OR LOWER(alias) LIKE ? OR LOWER(bio) LIKE ?)");
      const like = `%${q.toLowerCase()}%`;
      values.push(like, like, like);
    }

    if (status && ARTIST_STATUSES.has(status)) {
      conditions.push("status = ?");
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [artists] = await getPool().query(
      `SELECT artist_id, name, alias, bio, image_url, status, artworks, total_sales, featured_work, created_at, updated_at
       FROM artists
       ${where}
       ORDER BY artist_id ASC
       LIMIT 250`,
      values,
    );

    return NextResponse.json({ success: true, artists });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load artists." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    await ensureDefaultArtists();
    const body = await request.json();
    const name = cleanText(body.name);
    const alias = cleanText(body.alias) || "";
    const bio = cleanText(body.bio) || "";
    const imageUrl = cleanText(body.imageUrl || body.image_url) || "/placeholder-user.jpg";
    const status = cleanText(body.status) || "active";
    const artworks = Math.max(0, Math.floor(cleanNumber(body.artworks, 0)));
    const totalSales = Math.max(0, cleanNumber(body.totalSales ?? body.total_sales, 0));
    const featuredWork = cleanText(body.featuredWork || body.featured_work) || "";

    if (!name) return NextResponse.json({ success: false, error: "Artist name is required." }, { status: 400 });
    if (!ARTIST_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid artist status." }, { status: 400 });

    const artistId = await getNextArtistId();
    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO artists (artist_id, name, alias, bio, image_url, status, artworks, total_sales, featured_work)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [artistId, name, alias, bio, imageUrl, status, artworks, totalSales, featuredWork],
    );

    return NextResponse.json({ success: true, artistId: result.insertId || artistId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create artist." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    await ensureDefaultArtists();
    const body = await request.json();
    const artistId = Math.floor(cleanNumber(body.artistId ?? body.artist_id, 0));
    const name = cleanText(body.name);
    const alias = cleanText(body.alias) || "";
    const bio = cleanText(body.bio) || "";
    const imageUrl = cleanText(body.imageUrl || body.image_url) || "/placeholder-user.jpg";
    const status = cleanText(body.status) || "active";
    const artworks = Math.max(0, Math.floor(cleanNumber(body.artworks, 0)));
    const totalSales = Math.max(0, cleanNumber(body.totalSales ?? body.total_sales, 0));
    const featuredWork = cleanText(body.featuredWork || body.featured_work) || "";

    if (!artistId) return NextResponse.json({ success: false, error: "Artist ID is required." }, { status: 400 });
    if (!name) return NextResponse.json({ success: false, error: "Artist name is required." }, { status: 400 });
    if (!ARTIST_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid artist status." }, { status: 400 });

    const [result] = await getPool().query<ResultSetHeader>(
      `UPDATE artists
       SET name = ?, alias = ?, bio = ?, image_url = ?, status = ?, artworks = ?, total_sales = ?, featured_work = ?
       WHERE artist_id = ?`,
      [name, alias, bio, imageUrl, status, artworks, totalSales, featuredWork, artistId],
    );

    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Artist not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update artist." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    await ensureDefaultArtists();
    const { searchParams } = new URL(request.url);
    const artistId = Math.floor(cleanNumber(searchParams.get("artistId"), 0));
    if (!artistId) return NextResponse.json({ success: false, error: "Artist ID is required." }, { status: 400 });

    const [result] = await getPool().query<ResultSetHeader>("DELETE FROM artists WHERE artist_id = ?", [artistId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Artist not found." }, { status: 404 });

    const remaining = await listArtists();
    if (remaining.length === 0) await ensureDefaultArtists();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete artist." }, { status: 500 });
  }
}
