import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
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
      'Our gallery represents a diverse group of established and emerging artists. Edits saved in the admin Artists page are shown here automatically.'
    )
  `);

  await connection.end();
}

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

export async function GET() {
  try {
    await ensureArtistsPageTable();

    const connection = await getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM artists_page_settings WHERE id = 1 LIMIT 1"
    );

    await connection.end();

    const settings = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET /api/admin/artists-page error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load Artists page settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureArtistsPageTable();

    const body = await request.json();

    const heroTitle = cleanText(body.hero_title, "FEATURED ARTISTS");
    const mainTitle = cleanText(body.main_title, "ARTISTS");
    const heroSubtitle = cleanText(
      body.hero_subtitle,
      "Meet the visionaries behind our curated collection of contemporary Filipino art"
    );
    const heritageTitle = cleanText(
      body.heritage_title,
      "CONTEMPORARY FILIPINO ART"
    );
    const heroBackgroundUrl = cleanText(body.hero_background_url, "");
    const sectionTitle = cleanText(body.section_title, "Featured Artists");
    const sectionSubtitle = cleanText(
      body.section_subtitle,
      "Our gallery represents a diverse group of established and emerging artists. Edits saved in the admin Artists page are shown here automatically."
    );

    const connection = await getConnection();

    await connection.execute(
      `
      UPDATE artists_page_settings
      SET
        hero_title = ?,
        main_title = ?,
        hero_subtitle = ?,
        heritage_title = ?,
        hero_background_url = ?,
        section_title = ?,
        section_subtitle = ?
      WHERE id = 1
      `,
      [
        heroTitle,
        mainTitle,
        heroSubtitle,
        heritageTitle,
        heroBackgroundUrl,
        sectionTitle,
        sectionSubtitle,
      ]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "Artists page updated successfully.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/artists-page error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update Artists page.",
      },
      { status: 500 }
    );
  }
}