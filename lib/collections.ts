import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";
import { getStoreArtwork, type StoreArtwork } from "@/lib/store";

export type ArtCollection = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  heroImageUrl: string;
  artworkCount: number;
  featuredArtists: string[];
  year: number;
  curator: string;
  exploreButtonText: string;
  artworkIds: number[];
  status: "active" | "inactive";
  sortOrder: number;
};

export type ArtCollectionWithArtworks = ArtCollection & {
  artworks: StoreArtwork[];
};

type CollectionRow = RowDataPacket & {
  collection_id: number;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  artwork_count: number | null;
  featured_artists: string | null;
  collection_year: number | null;
  curator: string | null;
  explore_button_text: string | null;
  artwork_ids: string | null;
  status: "active" | "inactive" | null;
  sort_order: number | null;
};

type CountRow = RowDataPacket & { total: number };
type MaxRow = RowDataPacket & { next_id: number | null };

export const DEFAULT_COLLECTIONS: ArtCollection[] = [
  {
    id: 1,
    name: "Contemporary Masters",
    slug: "contemporary-masters",
    description: "Featuring works by renowned contemporary Filipino artists",
    imageUrl: "/artworks/bencab-sabel.jpg",
    heroImageUrl: "/artworks/bencab-sabel.jpg",
    artworkCount: 24,
    featuredArtists: ["BenCab", "Ronald Ventura", "Elmer Borlongan"],
    year: 2024,
    curator: "Galeria Butuan City Curatorial Team",
    exploreButtonText: "Explore Collection",
    artworkIds: [5, 26, 27],
    status: "active",
    sortOrder: 1,
  },
  {
    id: 2,
    name: "Classical Heritage",
    slug: "classical-heritage",
    description: "Timeless pieces from the masters of Filipino classical art",
    imageUrl: "/artworks/amorsolo-mayon.jpg",
    heroImageUrl: "/artworks/amorsolo-mayon.jpg",
    artworkCount: 18,
    featuredArtists: ["Fernando Amorsolo", "Juan Luna", "Felix Resurreccion Hidalgo"],
    year: 2024,
    curator: "Dr. Maria Rodriguez",
    exploreButtonText: "Explore Collection",
    artworkIds: [3, 4, 6, 21, 22],
    status: "active",
    sortOrder: 2,
  },
  {
    id: 3,
    name: "Modern Expressions",
    slug: "modern-expressions",
    description: "Bold, contemporary works pushing artistic boundaries",
    imageUrl: "/artworks/deejae-jeepney.jpg",
    heroImageUrl: "/artworks/deejae-jeepney.jpg",
    artworkCount: 32,
    featuredArtists: ["Ang Kiukok", "Vicente Manansala", "Hernando Ocampo"],
    year: 2024,
    curator: "Prof. Carlos Mendoza",
    exploreButtonText: "Explore Collection",
    artworkIds: [7, 8, 9, 15, 24, 25],
    status: "active",
    sortOrder: 3,
  },
  {
    id: 4,
    name: "Emerging Artists",
    slug: "emerging-artists",
    description: "Discover new talents and fresh perspectives in Philippine art",
    imageUrl: "/artworks/ventura-terraces.jpg",
    heroImageUrl: "/artworks/ventura-terraces.jpg",
    artworkCount: 15,
    featuredArtists: ["Ronald Ventura", "Jomike Tejido", "Dee Jae Paeste"],
    year: 2024,
    curator: "Galeria Butuan City New Voices Program",
    exploreButtonText: "Explore Collection",
    artworkIds: [10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 28, 29, 30],
    status: "active",
    sortOrder: 4,
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "collection";
}

function parseList(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {
    // Fall back to comma-separated text below.
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseIds(value: string | null | undefined) {
  return parseList(value)
    .map((item) => Number.parseInt(item, 10))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function stringifyList(values: string[]) {
  return JSON.stringify(values.map((value) => value.trim()).filter(Boolean));
}

function stringifyIds(values: number[]) {
  return JSON.stringify(values.filter((value) => Number.isFinite(value) && value > 0));
}

function mapCollectionRow(row: CollectionRow): ArtCollection {
  return {
    id: Number(row.collection_id),
    name: row.name || "Untitled Collection",
    slug: row.slug || slugify(row.name || "collection"),
    description: row.description || "",
    imageUrl: row.image_url && !row.image_url.includes("/images/products/") ? row.image_url : "/placeholder.jpg",
    heroImageUrl: row.hero_image_url && !row.hero_image_url.includes("/images/products/") ? row.hero_image_url : (row.image_url && !row.image_url.includes("/images/products/") ? row.image_url : "/images/collection-hero.svg"),
    artworkCount: Number(row.artwork_count || 0),
    featuredArtists: parseList(row.featured_artists),
    year: Number(row.collection_year || new Date().getFullYear()),
    curator: row.curator || "Galeria Butuan City Curatorial Team",
    exploreButtonText: row.explore_button_text || "Explore Collection",
    artworkIds: parseIds(row.artwork_ids),
    status: row.status === "inactive" ? "inactive" : "active",
    sortOrder: Number(row.sort_order || 0),
  };
}

export async function ensureCollectionsTable() {
  const pool = getPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS art_collections (
    collection_id INT NOT NULL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    hero_image_url VARCHAR(500) NULL,
    artwork_count INT NOT NULL DEFAULT 0,
    featured_artists TEXT NULL,
    collection_year INT NOT NULL DEFAULT 2024,
    curator VARCHAR(200) NULL,
    explore_button_text VARCHAR(120) NOT NULL DEFAULT 'Explore Collection',
    artwork_ids TEXT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Make sure older databases have the columns needed by the editable collections admin.
  // Each ALTER is safe to ignore when the column already exists.
  const migrations = [
    "ALTER TABLE art_collections ADD COLUMN slug VARCHAR(180) NULL AFTER name",
    "ALTER TABLE art_collections ADD COLUMN image_url VARCHAR(500) NULL AFTER description",
    "ALTER TABLE art_collections ADD COLUMN hero_image_url VARCHAR(500) NULL AFTER image_url",
    "ALTER TABLE art_collections ADD COLUMN artwork_count INT NOT NULL DEFAULT 0 AFTER hero_image_url",
    "ALTER TABLE art_collections ADD COLUMN featured_artists TEXT NULL AFTER artwork_count",
    "ALTER TABLE art_collections ADD COLUMN collection_year INT NOT NULL DEFAULT 2024 AFTER featured_artists",
    "ALTER TABLE art_collections ADD COLUMN curator VARCHAR(200) NULL AFTER collection_year",
    "ALTER TABLE art_collections ADD COLUMN explore_button_text VARCHAR(120) NOT NULL DEFAULT 'Explore Collection' AFTER curator",
    "ALTER TABLE art_collections ADD COLUMN artwork_ids TEXT NULL AFTER explore_button_text",
    "ALTER TABLE art_collections ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER artwork_ids",
    "ALTER TABLE art_collections ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER status",
  ];

  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch {
      // Column already exists, or MySQL version cannot position it. Existing data is kept.
    }
  }

  // Seed only missing default collections. This prevents Duplicate entry errors
  // when two pages call setup at the same time, and it never overwrites images
  // or text already edited in the admin account.
  for (const collection of DEFAULT_COLLECTIONS) {
    await pool.query(
      `INSERT IGNORE INTO art_collections
       (collection_id, name, slug, description, image_url, hero_image_url, artwork_count, featured_artists, collection_year, curator, explore_button_text, artwork_ids, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        collection.id,
        collection.name,
        collection.slug,
        collection.description,
        collection.imageUrl,
        collection.heroImageUrl,
        collection.artworkCount,
        stringifyList(collection.featuredArtists),
        collection.year,
        collection.curator,
        collection.exploreButtonText,
        stringifyIds(collection.artworkIds),
        collection.status,
        collection.sortOrder,
      ],
    );
  }

}

export async function listCollections(includeInactive = false) {
  await ensureCollectionsTable();
  const where = includeInactive ? "" : "WHERE status = 'active'";
  const [rows] = await getPool().query<CollectionRow[]>(
    `SELECT collection_id, name, slug, description, image_url, hero_image_url, artwork_count, featured_artists, collection_year, curator, explore_button_text, artwork_ids, status, sort_order
     FROM art_collections
     ${where}
     ORDER BY sort_order ASC, collection_id ASC`,
  );
  return rows.map(mapCollectionRow);
}

export async function getCollection(collectionId: number) {
  await ensureCollectionsTable();
  const [rows] = await getPool().query<CollectionRow[]>(
    `SELECT collection_id, name, slug, description, image_url, hero_image_url, artwork_count, featured_artists, collection_year, curator, explore_button_text, artwork_ids, status, sort_order
     FROM art_collections
     WHERE collection_id = ?
     LIMIT 1`,
    [collectionId],
  );
  return rows[0] ? mapCollectionRow(rows[0]) : null;
}

export async function getCollectionWithArtworks(collectionId: number): Promise<ArtCollectionWithArtworks | null> {
  const collection = await getCollection(collectionId);
  if (!collection || collection.status !== "active") return null;

  const artworks: StoreArtwork[] = [];
  for (const artworkId of collection.artworkIds) {
    try {
      const artwork = await getStoreArtwork(artworkId);
      if (artwork) artworks.push(artwork);
    } catch {
      // Keep the collection page available even if artwork rows cannot load.
    }
  }

  return { ...collection, artworks };
}

export type CollectionInput = {
  collectionId?: number;
  name: string;
  description: string;
  imageUrl: string;
  heroImageUrl: string;
  artworkCount: number;
  featuredArtists: string[];
  year: number;
  curator: string;
  exploreButtonText: string;
  artworkIds: number[];
  status: "active" | "inactive";
  sortOrder: number;
};

export async function createCollection(input: CollectionInput) {
  await ensureCollectionsTable();
  const pool = getPool();
  const [idRows] = await pool.query<MaxRow[]>("SELECT COALESCE(MAX(collection_id), 0) + 1 AS next_id FROM art_collections");
  const collectionId = Number(idRows[0]?.next_id || 1);
  await pool.query<ResultSetHeader>(
    `INSERT INTO art_collections
     (collection_id, name, slug, description, image_url, hero_image_url, artwork_count, featured_artists, collection_year, curator, explore_button_text, artwork_ids, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      collectionId,
      input.name,
      slugify(input.name),
      input.description,
      input.imageUrl,
      input.heroImageUrl || input.imageUrl,
      input.artworkCount,
      stringifyList(input.featuredArtists),
      input.year,
      input.curator,
      input.exploreButtonText,
      stringifyIds(input.artworkIds),
      input.status,
      input.sortOrder,
    ],
  );
  return collectionId;
}

export async function updateCollection(input: CollectionInput & { collectionId: number }) {
  await ensureCollectionsTable();
  const [result] = await getPool().query<ResultSetHeader>(
    `UPDATE art_collections
     SET name = ?, slug = ?, description = ?, image_url = ?, hero_image_url = ?, artwork_count = ?, featured_artists = ?, collection_year = ?, curator = ?, explore_button_text = ?, artwork_ids = ?, status = ?, sort_order = ?
     WHERE collection_id = ?`,
    [
      input.name,
      slugify(input.name),
      input.description,
      input.imageUrl,
      input.heroImageUrl || input.imageUrl,
      input.artworkCount,
      stringifyList(input.featuredArtists),
      input.year,
      input.curator,
      input.exploreButtonText,
      stringifyIds(input.artworkIds),
      input.status,
      input.sortOrder,
      input.collectionId,
    ],
  );
  return result.affectedRows;
}

export async function deleteCollection(collectionId: number) {
  await ensureCollectionsTable();
  const [result] = await getPool().query<ResultSetHeader>("DELETE FROM art_collections WHERE collection_id = ?", [collectionId]);
  return result.affectedRows;
}
