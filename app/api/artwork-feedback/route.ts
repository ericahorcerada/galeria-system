import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackRow = RowDataPacket & {
  feedback_id: number;
  artwork_id: number;
  customer_name: string | null;
  email: string | null;
  rating: number;
  message: string;
  created_at: string;
  subject: string;
  status: string;
};

async function ensureArtworkFeedbackTable() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS artwork_feedback (
      feedback_id INT AUTO_INCREMENT PRIMARY KEY,
      artwork_id INT NOT NULL,
      customer_name VARCHAR(255) NULL,
      customer_email VARCHAR(255) NULL,
      rating INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_artwork_feedback_artwork_id (artwork_id),
      INDEX idx_artwork_feedback_customer_email (customer_email)
    )
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureArtworkFeedbackTable();

    const { searchParams } = new URL(request.url);
    const artworkId = searchParams.get("artworkId");
    const email = searchParams.get("email");

    const whereParts: string[] = [];
    const values: Array<string | number> = [];

    if (artworkId && Number.isFinite(Number(artworkId))) {
      whereParts.push("artwork_id = ?");
      values.push(Number(artworkId));
    }

    if (email) {
      whereParts.push("LOWER(customer_email) = ?");
      values.push(email.toLowerCase());
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const [rows] = await getPool().query<FeedbackRow[]>(
      `
      SELECT
        feedback_id,
        artwork_id,
        customer_name,
        customer_email AS email,
        rating,
        message,
        created_at,
        CONCAT('Artwork #', artwork_id) AS subject,
        'submitted' AS status
      FROM artwork_feedback
      ${whereSql}
      ORDER BY created_at DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      feedbacks: rows,
      feedback: rows,
    });
  } catch (error) {
    console.error("Artwork feedback GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load artwork feedback.",
        feedbacks: [],
        feedback: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureArtworkFeedbackTable();

    const body = await request.json();

    const artworkId = Number(body.artworkId || body.artwork_id);
    const rating = Number(body.rating);
    const message = String(body.message || "").trim();
    const customerName = String(body.customerName || body.customer_name || "Customer").trim();
    const customerEmail = String(body.customerEmail || body.email || "").trim().toLowerCase();

    if (!Number.isFinite(artworkId) || artworkId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Artwork ID is required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating must be from 1 to 5 stars.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Feedback message is required.",
        },
        { status: 400 }
      );
    }

    const [result] = await getPool().query<ResultSetHeader>(
      `
      INSERT INTO artwork_feedback (
        artwork_id,
        customer_name,
        customer_email,
        rating,
        message
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [artworkId, customerName, customerEmail || null, rating, message]
    );

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback: {
        feedback_id: result.insertId,
        artwork_id: artworkId,
        customer_name: customerName,
        email: customerEmail,
        rating,
        message,
      },
    });
  } catch (error) {
    console.error("Artwork feedback POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to submit artwork feedback.",
      },
      { status: 500 }
    );
  }
}