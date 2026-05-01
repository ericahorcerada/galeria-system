import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";

export type HomepageSettings = {
  id: number;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  primary_button_text: string;
  primary_button_href: string;
  secondary_button_text: string;
  secondary_button_href: string;
  background_image_url: string;
  featured_image_url: string;
  featured_title: string;
  featured_subtitle: string;
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  id: 1,
  eyebrow: "Live Filipino Art Store",
  title: "Curated art for",
  highlight: "modern Filipino spaces.",
  subtitle: "Browse photo-backed, MySQL-powered artwork listings. Update titles, prices, stock, and images in admin, then see the storefront change live.",
  primary_button_text: "Shop Live Collection",
  primary_button_href: "/shop",
  secondary_button_text: "Create Customer Account",
  secondary_button_href: "/login",
  background_image_url: "/artworks/aznar-manilabay.jpg",
  featured_image_url: "/artworks/bencab-sabel.jpg",
  featured_title: "Sabel in Motion",
  featured_subtitle: "Photo-backed seed artwork",
};

const STRING_COLUMNS = [
  "eyebrow",
  "title",
  "highlight",
  "subtitle",
  "primary_button_text",
  "primary_button_href",
  "secondary_button_text",
  "secondary_button_href",
  "background_image_url",
  "featured_image_url",
  "featured_title",
  "featured_subtitle",
] as const;

function safeString(value: unknown, fallback: string) {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function normalizeHomepageSettings(row?: RowDataPacket | Record<string, unknown> | null): HomepageSettings {
  const source = row || {};
  return {
    id: Number(source.id || DEFAULT_HOMEPAGE_SETTINGS.id),
    eyebrow: safeString(source.eyebrow, DEFAULT_HOMEPAGE_SETTINGS.eyebrow),
    title: safeString(source.title, DEFAULT_HOMEPAGE_SETTINGS.title),
    highlight: safeString(source.highlight, DEFAULT_HOMEPAGE_SETTINGS.highlight),
    subtitle: safeString(source.subtitle, DEFAULT_HOMEPAGE_SETTINGS.subtitle),
    primary_button_text: safeString(source.primary_button_text, DEFAULT_HOMEPAGE_SETTINGS.primary_button_text),
    primary_button_href: safeString(source.primary_button_href, DEFAULT_HOMEPAGE_SETTINGS.primary_button_href),
    secondary_button_text: safeString(source.secondary_button_text, DEFAULT_HOMEPAGE_SETTINGS.secondary_button_text),
    secondary_button_href: safeString(source.secondary_button_href, DEFAULT_HOMEPAGE_SETTINGS.secondary_button_href),
    background_image_url: safeString(source.background_image_url, DEFAULT_HOMEPAGE_SETTINGS.background_image_url),
    featured_image_url: safeString(source.featured_image_url, DEFAULT_HOMEPAGE_SETTINGS.featured_image_url),
    featured_title: safeString(source.featured_title, DEFAULT_HOMEPAGE_SETTINGS.featured_title),
    featured_subtitle: safeString(source.featured_subtitle, DEFAULT_HOMEPAGE_SETTINGS.featured_subtitle),
  };
}

export async function ensureHomepageSettingsTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS homepage_settings (
      id INT PRIMARY KEY DEFAULT 1,
      eyebrow VARCHAR(200) NOT NULL DEFAULT 'Live Filipino Art Store',
      title VARCHAR(255) NOT NULL DEFAULT 'Curated art for',
      highlight VARCHAR(255) NOT NULL DEFAULT 'modern Filipino spaces.',
      subtitle TEXT NULL,
      primary_button_text VARCHAR(120) NOT NULL DEFAULT 'Shop Live Collection',
      primary_button_href VARCHAR(255) NOT NULL DEFAULT '/shop',
      secondary_button_text VARCHAR(120) NOT NULL DEFAULT 'Create Customer Account',
      secondary_button_href VARCHAR(255) NOT NULL DEFAULT '/login',
      background_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/aznar-manilabay.jpg',
      featured_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/bencab-sabel.jpg',
      featured_title VARCHAR(200) NOT NULL DEFAULT 'Sabel in Motion',
      featured_subtitle VARCHAR(200) NOT NULL DEFAULT 'Photo-backed seed artwork',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const columns = [
    ["eyebrow", "eyebrow VARCHAR(200) NOT NULL DEFAULT 'Live Filipino Art Store'"],
    ["title", "title VARCHAR(255) NOT NULL DEFAULT 'Curated art for'"],
    ["highlight", "highlight VARCHAR(255) NOT NULL DEFAULT 'modern Filipino spaces.'"],
    ["subtitle", "subtitle TEXT NULL"],
    ["primary_button_text", "primary_button_text VARCHAR(120) NOT NULL DEFAULT 'Shop Live Collection'"],
    ["primary_button_href", "primary_button_href VARCHAR(255) NOT NULL DEFAULT '/shop'"],
    ["secondary_button_text", "secondary_button_text VARCHAR(120) NOT NULL DEFAULT 'Create Customer Account'"],
    ["secondary_button_href", "secondary_button_href VARCHAR(255) NOT NULL DEFAULT '/login'"],
    ["background_image_url", "background_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/aznar-manilabay.jpg'"],
    ["featured_image_url", "featured_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/bencab-sabel.jpg'"],
    ["featured_title", "featured_title VARCHAR(200) NOT NULL DEFAULT 'Sabel in Motion'"],
    ["featured_subtitle", "featured_subtitle VARCHAR(200) NOT NULL DEFAULT 'Photo-backed seed artwork'"],
  ] as const;

  for (const [column, definition] of columns) {
    const [existing] = await getPool().query<RowDataPacket[]>("SHOW COLUMNS FROM homepage_settings LIKE ?", [column]);
    if (existing.length === 0) await getPool().query(`ALTER TABLE homepage_settings ADD COLUMN ${definition}`);
  }

  await getPool().query(
    `INSERT IGNORE INTO homepage_settings (id, eyebrow, title, highlight, subtitle, primary_button_text, primary_button_href, secondary_button_text, secondary_button_href, background_image_url, featured_image_url, featured_title, featured_subtitle)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      DEFAULT_HOMEPAGE_SETTINGS.id,
      DEFAULT_HOMEPAGE_SETTINGS.eyebrow,
      DEFAULT_HOMEPAGE_SETTINGS.title,
      DEFAULT_HOMEPAGE_SETTINGS.highlight,
      DEFAULT_HOMEPAGE_SETTINGS.subtitle,
      DEFAULT_HOMEPAGE_SETTINGS.primary_button_text,
      DEFAULT_HOMEPAGE_SETTINGS.primary_button_href,
      DEFAULT_HOMEPAGE_SETTINGS.secondary_button_text,
      DEFAULT_HOMEPAGE_SETTINGS.secondary_button_href,
      DEFAULT_HOMEPAGE_SETTINGS.background_image_url,
      DEFAULT_HOMEPAGE_SETTINGS.featured_image_url,
      DEFAULT_HOMEPAGE_SETTINGS.featured_title,
      DEFAULT_HOMEPAGE_SETTINGS.featured_subtitle,
    ],
  );

  for (const column of STRING_COLUMNS) {
    const fallback = DEFAULT_HOMEPAGE_SETTINGS[column];
    await getPool().query(`UPDATE homepage_settings SET ${column} = ? WHERE id = 1 AND ${column} IS NULL`, [fallback]);
  }
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  await ensureHomepageSettingsTable();
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT id, eyebrow, title, highlight, subtitle, primary_button_text, primary_button_href, secondary_button_text, secondary_button_href, background_image_url, featured_image_url, featured_title, featured_subtitle
     FROM homepage_settings
     WHERE id = 1
     LIMIT 1`,
  );
  return normalizeHomepageSettings(rows[0]);
}

export function cleanHomepageText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}
