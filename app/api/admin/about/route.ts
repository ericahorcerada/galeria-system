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

  await connection.execute(`
    INSERT IGNORE INTO about_page_settings (
      id,
      hero_title,
      hero_subtitle,
      heritage_title,
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

export async function GET() {
  try {
    await ensureAboutTable();

    const connection = await getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM about_page_settings WHERE id = 1 LIMIT 1"
    );

    await connection.end();

    const about = Array.isArray(rows) ? rows[0] : null;

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

    const {
      hero_title,
      hero_subtitle,
      heritage_title,
      story_title,
      story_paragraph_1,
      story_paragraph_2,
      story_paragraph_3,
      image_url,
      image_title,
      image_subtitle,
    } = body;

    const connection = await getConnection();

    await connection.execute(
      `
      UPDATE about_page_settings
      SET
        hero_title = ?,
        hero_subtitle = ?,
        heritage_title = ?,
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
        hero_title || "ABOUT GALERIA",
        hero_subtitle ||
          "Celebrating Filipino artistic excellence in the heart of Butuan City",
        heritage_title || "BUTUAN CITY ART HERITAGE",
        story_title || "Our Story",
        story_paragraph_1 || "",
        story_paragraph_2 || "",
        story_paragraph_3 || "",
        image_url || "",
        image_title || "GALLERY INTERIOR",
        image_subtitle || "VISIT US IN BUTUAN CITY",
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