import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const defaultSettings = {
  hero_title: "FEATURED ARTISTS",
  main_title: "ARTISTS",
  hero_subtitle:
    "Meet the visionaries behind our curated collection of contemporary Filipino art",
  heritage_title: "CONTEMPORARY FILIPINO ART",
  hero_background_url: "",
  section_title: "Featured Artists",
  section_subtitle:
    "Our gallery represents a diverse group of established and emerging artists.",
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

async function ensureArtistsPageTable() {
  const connection = await getConnection();

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS artists_page_settings (
      id INT PRIMARY KEY DEFAULT 1,
      hero_title VARCHAR(255) NOT NULL DEFAULT 'FEATURED ARTISTS',
      main_title VARCHAR(255) NOT NULL DEFAULT 'ARTISTS',
      hero_subtitle VARCHAR(255) NOT NULL DEFAULT 'Meet the visionaries behind our curated collection of contemporary Filipino art',
      heritage_title VARCHAR(255) NOT NULL DEFAULT 'CONTEMPORARY FILIPINO ART',
      hero_background_url TEXT,
      section_title VARCHAR(255) NOT NULL DEFAULT 'Featured Artists',
      section_subtitle TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  try {
    await connection.execute(`
      ALTER TABLE artists_page_settings
      ADD COLUMN hero_background_url TEXT
    `);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code !== "ER_DUP_FIELDNAME") {
      console.error("hero_background_url column check:", error);
    }
  }

  await connection.execute(`
    INSERT IGNORE INTO artists_page_settings (
      id,
      hero_title,
      main_title,
      hero_subtitle,
      heritage_title,
      hero_background_url,
      section_title,
      section_subtitle
    ) VALUES (
      1,
      'FEATURED ARTISTS',
      'ARTISTS',
      'Meet the visionaries behind our curated collection of contemporary Filipino art',
      'CONTEMPORARY FILIPINO ART',
      '',
      'Featured Artists',
      'Our gallery represents a diverse group of established and emerging artists.'
    )
  `);

  await connection.end();
}

export async function GET() {
  try {
    await ensureArtistsPageTable();

    const connection = await getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM artists_page_settings WHERE id = 1 LIMIT 1"
    );

    await connection.end();

    const settings =
      Array.isArray(rows) && rows.length > 0
        ? {
            ...defaultSettings,
            ...(rows[0] as typeof defaultSettings),
          }
        : defaultSettings;

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET /api/artists-page error:", error);

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    });
  }
}