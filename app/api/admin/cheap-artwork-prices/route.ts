import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ArtworkRow = {
  artwork_id: number;
  title: string;
  medium: string | null;
  price: number | string;
};

const cheapPrices = [
  49, 59, 69, 79, 89, 99, 109, 119, 129, 139,
  149, 159, 169, 179, 189, 199, 209, 219, 229, 239,
  249, 259, 269, 279, 289, 299, 309, 319, 329, 339,
  349, 359, 369, 379, 389, 399,
];

const cheapMediums = [
  "Poster print",
  "Photo print",
  "Matte print",
  "Art print",
  "Canvas print",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!process.env.DB_ADMIN_TOKEN || token !== process.env.DB_ADMIN_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin token.",
        },
        { status: 401 }
      );
    }

    const pool = getPool();

    const [dbInfoRows] = await pool.query("SELECT DATABASE() AS db");
    const dbInfo = dbInfoRows as Array<{ db: string }>;

    const [artworkRows] = await pool.query(`
      SELECT artwork_id, title, medium, price
      FROM store_artworks
      ORDER BY artwork_id ASC
    `);

    const artworks = artworkRows as ArtworkRow[];

    if (artworks.length === 0) {
      return NextResponse.json({
        success: false,
        database: dbInfo[0]?.db,
        message: "No artworks found in store_artworks.",
      });
    }

    const updated: Array<{
      artwork_id: number;
      title: string;
      old_medium: string | null;
      old_price: number | string;
      new_medium: string;
      new_price: number;
    }> = [];

    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i];
      const newPrice = cheapPrices[i] || 399;
      const newMedium = cheapMediums[i % cheapMediums.length];

      await pool.query(
        `
        UPDATE store_artworks
        SET medium = ?, price = ?, updated_at = NOW()
        WHERE artwork_id = ?
        `,
        [newMedium, newPrice, artwork.artwork_id]
      );

      updated.push({
        artwork_id: artwork.artwork_id,
        title: artwork.title,
        old_medium: artwork.medium,
        old_price: artwork.price,
        new_medium: newMedium,
        new_price: newPrice,
      });
    }

    const [checkRows] = await pool.query(`
      SELECT artwork_id, title, medium, price
      FROM store_artworks
      ORDER BY artwork_id ASC
      LIMIT 15
    `);

    return NextResponse.json({
      success: true,
      database: dbInfo[0]?.db,
      totalUpdated: updated.length,
      message: "All artwork prices and mediums were changed to cheaper values.",
      sample: checkRows,
      updated,
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