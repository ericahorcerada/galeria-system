import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackRow = RowDataPacket & {
  feedback_id: number;
  name: string;
  email: string;
  rating: number;
  subject: string;
  message: string;
  status: "new" | "reviewed" | "archived";
  created_at: string;
};

async function ensureFeedbackTable() {
  await getPool().query(`CREATE TABLE IF NOT EXISTS feedbacks (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    rating INT NOT NULL DEFAULT 5,
    subject VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new','reviewed','archived') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

function clean(value: unknown) { return String(value || "").trim(); }

export async function GET() {
  try {
    await ensureFeedbackTable();
    const [feedbacks] = await getPool().query<FeedbackRow[]>("SELECT feedback_id, name, email, rating, subject, message, status, created_at FROM feedbacks ORDER BY created_at DESC LIMIT 100");
    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load feedback." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureFeedbackTable();
    const body = await request.json();
    const name = clean(body.name);
    const email = clean(body.email).toLowerCase();
    const subject = clean(body.subject);
    const message = clean(body.message);
    const rating = Math.max(1, Math.min(5, Math.floor(Number(body.rating) || 5)));

    if (!name || !email || !subject || !message) return NextResponse.json({ success: false, error: "Name, email, subject, and message are required." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });

    const [result] = await getPool().query<ResultSetHeader>(
      "INSERT INTO feedbacks (name, email, rating, subject, message, status) VALUES (?, ?, ?, ?, ?, 'new')",
      [name, email, rating, subject, message],
    );
    return NextResponse.json({ success: true, feedbackId: result.insertId, message: "Thank you. Your feedback was submitted." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to submit feedback." }, { status: 500 });
  }
}
