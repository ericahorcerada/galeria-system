import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";

export type StoreArtwork = {
  id: number;
  title: string;
  artist: string;
  description: string;
  category: string;
  medium: string;
  dimensions: string;
  image: string;
  price: number;
  stock: number;
  status: "active" | "sold_out";
};

type StoreArtworkRow = RowDataPacket & {
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
};

function mapArtworkRow(row: StoreArtworkRow): StoreArtwork {
  const isSoldOut = row.status === "sold_out" || Number(row.stock_quantity) <= 0;
  return {
    id: row.artwork_id,
    title: row.title,
    artist: row.artist_name,
    description: row.description || "",
    category: row.category,
    medium: row.medium || "",
    dimensions: row.dimensions || "",
    image: row.image_url || "/placeholder.jpg",
    price: Number(row.price),
    stock: isSoldOut ? 0 : Number(row.stock_quantity),
    status: isSoldOut ? "sold_out" : "active",
  };
}

export async function listStoreArtworks() {
  const [rows] = await getPool().query<StoreArtworkRow[]>(
    `SELECT artwork_id, title, artist_name, description, category, medium, dimensions, image_url, price, stock_quantity, status
     FROM store_artworks
     WHERE status IN ('active', 'sold_out')
     ORDER BY updated_at DESC, artwork_id DESC`,
  );
  return rows.map(mapArtworkRow);
}

export async function getStoreArtwork(id: number) {
  const [rows] = await getPool().query<StoreArtworkRow[]>(
    `SELECT artwork_id, title, artist_name, description, category, medium, dimensions, image_url, price, stock_quantity, status
     FROM store_artworks
     WHERE artwork_id = ? AND status IN ('active', 'sold_out')
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapArtworkRow(rows[0]) : null;
}
