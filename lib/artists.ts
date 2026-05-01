import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";

export type ArtistStatus = "active" | "inactive";

export type Artist = {
  artist_id: number;
  name: string;
  alias: string;
  bio: string;
  image_url: string;
  status: ArtistStatus;
  artworks: number;
  total_sales: number;
  featured_work: string;
  created_at?: string;
  updated_at?: string;
};

type CountRow = RowDataPacket & { count: number };
type IdRow = RowDataPacket & { next_id: number | null };

type ArtistRow = RowDataPacket & Artist;

export const DEFAULT_ARTISTS: Omit<Artist, "created_at" | "updated_at">[] = [
  {
    artist_id: 1,
    name: "Benedicto Cabrera",
    alias: "BenCab",
    bio: "National Artist of the Philippines, known for his iconic Sabel series and depictions of Filipino life and culture.",
    image_url: "/images/artists/artist-1.svg",
    status: "active",
    artworks: 45,
    total_sales: 2340000,
    featured_work: "Sabel in the Wind",
  },
  {
    artist_id: 2,
    name: "Fernando Amorsolo",
    alias: "Grand Old Man of Philippine Art",
    bio: "First National Artist, celebrated for his mastery of light and romanticized depictions of Philippine rural life.",
    image_url: "/images/artists/artist-2.svg",
    status: "active",
    artworks: 38,
    total_sales: 3150000,
    featured_work: "Rice Planting",
  },
  {
    artist_id: 3,
    name: "Ronald Ventura",
    alias: "Master of Hyperrealism",
    bio: "Contemporary artist known for layered imagery combining hyperrealism with pop culture and religious iconography.",
    image_url: "/images/artists/artist-3.svg",
    status: "active",
    artworks: 32,
    total_sales: 4200000,
    featured_work: "Grayground",
  },
  {
    artist_id: 4,
    name: "Ang Kiukok",
    alias: "Master of Philippine Expressionism",
    bio: "Known for his powerful visual imagery, angular forms, and emotionally charged paintings.",
    image_url: "/images/artists/artist-4.svg",
    status: "active",
    artworks: 28,
    total_sales: 1890000,
    featured_work: "Fishermen of Batangas",
  },
  {
    artist_id: 5,
    name: "Juan Luna",
    alias: "Filipino Master",
    bio: "One of the first Filipino artists to gain international recognition, known for historical and allegorical works.",
    image_url: "/images/artists/artist-5.svg",
    status: "active",
    artworks: 15,
    total_sales: 5600000,
    featured_work: "Portrait of a Filipina",
  },
  {
    artist_id: 6,
    name: "Vicente Manansala",
    alias: "Transparent Cubism Pioneer",
    bio: "National Artist known for developing transparent cubism and interpreting Filipino life through layered forms.",
    image_url: "/images/artists/artist-6.svg",
    status: "active",
    artworks: 22,
    total_sales: 1450000,
    featured_work: "Chocolate Hills of Bohol",
  },
  {
    artist_id: 7,
    name: "Arturo Luz",
    alias: "Modernist Master",
    bio: "National Artist recognized for elegant minimalist compositions, linear forms, and geometric abstraction.",
    image_url: "/images/artists/artist-7.svg",
    status: "active",
    artworks: 18,
    total_sales: 2100000,
    featured_work: "Archipelago Dreams",
  },
  {
    artist_id: 8,
    name: "Juvenal Sanso",
    alias: "Poet of Forms",
    bio: "Known for dreamlike landscapes and expressive compositions inspired by nature and memory.",
    image_url: "/images/artists/artist-8.svg",
    status: "active",
    artworks: 20,
    total_sales: 1750000,
    featured_work: "Palawan Underground River",
  },
];

async function addColumnIfMissing(table: string, column: string, definition: string) {
  const [columns] = await getPool().query<RowDataPacket[]>(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  if (Array.isArray(columns) && columns.length === 0) {
    await getPool().query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

export async function ensureArtistsTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS artists (
      artist_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      alias VARCHAR(150) NOT NULL DEFAULT '',
      bio TEXT,
      image_url VARCHAR(700) DEFAULT '/placeholder-user.jpg',
      status ENUM('active', 'inactive') DEFAULT 'active',
      artworks INT NOT NULL DEFAULT 0,
      total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
      featured_work VARCHAR(200) NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Repair older existing MySQL tables instead of only creating new ones.
  // This fixes errors like: Unknown column 'artworks' in 'SET'.
  await addColumnIfMissing("artists", "alias", "alias VARCHAR(150) NOT NULL DEFAULT '' AFTER name");
  await addColumnIfMissing("artists", "bio", "bio TEXT AFTER alias");
  await addColumnIfMissing("artists", "image_url", "image_url VARCHAR(700) DEFAULT '/placeholder-user.jpg' AFTER bio");
  await addColumnIfMissing("artists", "status", "status ENUM('active', 'inactive') DEFAULT 'active' AFTER image_url");
  await addColumnIfMissing("artists", "artworks", "artworks INT NOT NULL DEFAULT 0 AFTER status");
  await addColumnIfMissing("artists", "total_sales", "total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER artworks");
  await addColumnIfMissing("artists", "featured_work", "featured_work VARCHAR(200) NOT NULL DEFAULT '' AFTER total_sales");
  await addColumnIfMissing("artists", "created_at", "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER featured_work");
  await addColumnIfMissing("artists", "updated_at", "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
}

export async function ensureDefaultArtists() {
  await ensureArtistsTable();

  // Always make sure the full starter set of 8 artists exists.
  // INSERT IGNORE preserves any edits already made in admin for existing artists.
  await getPool().query<ResultSetHeader>(
    `INSERT IGNORE INTO artists (artist_id, name, alias, bio, image_url, status, artworks, total_sales, featured_work)
     VALUES ?`,
    [DEFAULT_ARTISTS.map((artist) => [
      artist.artist_id,
      artist.name,
      artist.alias,
      artist.bio,
      artist.image_url,
      artist.status,
      artist.artworks,
      artist.total_sales,
      artist.featured_work,
    ])],
  );
}

export async function getNextArtistId() {
  const [rows] = await getPool().query<IdRow[]>("SELECT COALESCE(MAX(artist_id), 0) + 1 AS next_id FROM artists");
  return Number(rows[0]?.next_id || 1);
}

export async function listArtists({ activeOnly = false } = {}) {
  await ensureDefaultArtists();
  const where = activeOnly ? "WHERE status = 'active'" : "";
  const [rows] = await getPool().query<ArtistRow[]>(
    `SELECT artist_id, name, alias, bio, image_url, status, artworks, total_sales, featured_work, created_at, updated_at
     FROM artists
     ${where}
     ORDER BY artist_id ASC`,
  );
  return rows;
}
