import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ArtworkRow = RowDataPacket & {
  artwork_id: number;
  title: string;
  medium: string | null;
  price: number;
};

const cheapPrices = [
  49, 59, 69, 79, 89, 99, 109,
  119, 129, 139, 149, 159, 169, 179,
  189, 199, 209, 219, 229, 239, 249,
  259, 269, 279, 289, 299, 309, 319,
  329, 339, 349, 359, 369, 379, 389, 399
];

const cheapMediums = [
  "Poster print",
  "Photo print",
  "Matte print",
  "Art print",
  "Canvas print"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!process.env.DB_ADMIN_TOKEN || token !== process.env.DB_ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Invalid admin token." },
        { status: 401 }
      );
    }

    const pool = getPool();

    const [dbInfo] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS db");

    const [artworks] = await pool.query<ArtworkRow[]>(`
      SELECT artwork_id, title, medium, price
      FROM store_artworks
      ORDER BY created_at DESC, artwork_id DESC
    `);

    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i];
      const price = cheapPrices[i] || 399;
      const medium = cheapMediums[i % cheapMediums.length];

      await pool.query(
        `
        UPDATE store_artworks
        SET medium = ?, price = ?, updated_at = NOW()
        WHERE artwork_id = ?
        `,
        [medium, price, artwork.artwork_id]
      );
    }

    const [checkRows] = await pool.query<ArtworkRow[]>(`
      SELECT artwork_id, title, medium, price
      FROM store_artworks
      ORDER BY created_at DESC, artwork_id DESC
      LIMIT 15
    `);

    return NextResponse.json({
      success: true,
      database: dbInfo[0]?.db,
      updatedCount: artworks.length,
      message: "All live artwork prices and print mediums were updated.",
      sample: checkRows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Update failed.",
      },
      { status: 500 }
    );
  }
}