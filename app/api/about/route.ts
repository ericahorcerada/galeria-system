import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const defaultAbout = {
  hero_title: "ABOUT GALERIA",
  hero_subtitle:
    "Celebrating Filipino artistic excellence in the heart of Butuan City",
  heritage_title: "BUTUAN CITY ART HERITAGE",
  hero_background_url: "",
  story_title: "Our Story",
  story_paragraph_1:
    "Founded in 2010, Galeria Butuan City emerged from a passionate vision to create a platform where Filipino contemporary art could thrive and be celebrated both locally and internationally.",
  story_paragraph_2:
    "What began as a small gallery space has grown into a vibrant cultural hub, representing over 50 artists and hosting numerous exhibitions that have shaped the Philippine art landscape.",
  story_paragraph_3:
    "Our commitment remains steadfast: to discover, nurture, and showcase exceptional Filipino artistic talent while making art accessible to everyone who appreciates beauty and creativity.",
  image_url: "",
  image_title: "GALLERY INTERIOR",
  image_subtitle: "VISIT US IN BUTUAN CITY",
};

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      "SELECT * FROM about_page_settings WHERE id = 1 LIMIT 1"
    );

    await connection.end();

    const about =
      Array.isArray(rows) && rows.length > 0
        ? {
            ...defaultAbout,
            ...rows[0],
          }
        : defaultAbout;

    return NextResponse.json({
      success: true,
      about,
    });
  } catch {
    return NextResponse.json({
      success: true,
      about: defaultAbout,
    });
  }
}