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

async function ensureAboutTable() {
  const connection = await getConnection();

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS about_page_settings (
      id INT PRIMARY KEY DEFAULT 1,
      hero_title VARCHAR(255) NOT NULL DEFAULT 'ABOUT GALERIA',
      hero_subtitle VARCHAR(255) NOT NULL DEFAULT 'Celebrating Filipino artistic excellence in the heart of Butuan City',
      heritage_title VARCHAR(255) NOT NULL DEFAULT 'BUTUAN CITY ART HERITAGE',
      hero_background_url TEXT,
      story_title VARCHAR(255) NOT NULL DEFAULT 'Our Story',
      story_paragraph_1 TEXT,
      story_paragraph_2 TEXT,
      story_paragraph_3 TEXT,
      image_url TEXT,
      image_title VARCHAR(255) NOT NULL DEFAULT 'GALLERY INTERIOR',
      image_subtitle VARCHAR(255) NOT NULL DEFAULT 'VISIT US IN BUTUAN CITY',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  try {
    await connection.execute(`
      ALTER TABLE about_page_settings
      ADD COLUMN hero_background_url TEXT
    `);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code !== "ER_DUP_FIELDNAME") {
      console.error("hero_background_url column check:", error);
    }
  }

  await connection.execute(`
    INSERT IGNORE INTO about_page_settings (
      id,
      hero_title,
      hero_subtitle,
      heritage_title,
      hero_background_url,
      story_title,
      story_paragraph_1,
      story_paragraph_2,
      story_paragraph_3,
      image_url,
      image_title,
      image_subtitle
    ) VALUES (
      1,
      'ABOUT GALERIA',
      'Celebrating Filipino artistic excellence in the heart of Butuan City',
      'BUTUAN CITY ART HERITAGE',
      '',
      'Our Story',
      'Founded in 2010, Galeria Butuan City emerged from a passionate vision to create a platform where Filipino contemporary art could thrive and be celebrated both locally and internationally.',
      'What began as a small gallery space has grown into a vibrant cultural hub, representing over 50 artists and hosting numerous exhibitions that have shaped the Philippine art landscape.',
      'Our commitment remains steadfast: to discover, nurture, and showcase exceptional Filipino artistic talent while making art accessible to everyone who appreciates beauty and creativity.',
      '',
      'GALLERY INTERIOR',
      'VISIT US IN BUTUAN CITY'
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
    await ensureAboutTable();

    const connection = await getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM about_page_settings WHERE id = 1 LIMIT 1"
    );

    await connection.end();

    const about = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    return NextResponse.json({
      success: true,
      about,
    });
  } catch (error) {
    console.error("GET /api/admin/about error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load About page settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureAboutTable();

    const body = await request.json();

    const heroTitle = cleanText(body.hero_title, "ABOUT GALERIA");
    const heroSubtitle = cleanText(
      body.hero_subtitle,
      "Celebrating Filipino artistic excellence in the heart of Butuan City"
    );
    const heritageTitle = cleanText(
      body.heritage_title,
      "BUTUAN CITY ART HERITAGE"
    );
    const heroBackgroundUrl = cleanText(body.hero_background_url, "");
    const storyTitle = cleanText(body.story_title, "Our Story");
    const storyParagraph1 = cleanText(body.story_paragraph_1, "");
    const storyParagraph2 = cleanText(body.story_paragraph_2, "");
    const storyParagraph3 = cleanText(body.story_paragraph_3, "");
    const imageUrl = cleanText(body.image_url, "");
    const imageTitle = cleanText(body.image_title, "GALLERY INTERIOR");
    const imageSubtitle = cleanText(
      body.image_subtitle,
      "VISIT US IN BUTUAN CITY"
    );

    const connection = await getConnection();

    await connection.execute(
      `
      UPDATE about_page_settings
      SET
        hero_title = ?,
        hero_subtitle = ?,
        heritage_title = ?,
        hero_background_url = ?,
        story_title = ?,
        story_paragraph_1 = ?,
        story_paragraph_2 = ?,
        story_paragraph_3 = ?,
        image_url = ?,
        image_title = ?,
        image_subtitle = ?
      WHERE id = 1
      `,
      [
        heroTitle,
        heroSubtitle,
        heritageTitle,
        heroBackgroundUrl,
        storyTitle,
        storyParagraph1,
        storyParagraph2,
        storyParagraph3,
        imageUrl,
        imageTitle,
        imageSubtitle,
      ]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "About page updated successfully.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/about error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update About page.",
      },
      { status: 500 }
    );
  }
}