import { NextResponse } from "next/server";
import { getCurrentSession, type SessionUser } from "@/lib/session";

export async function requireAdminSession(): Promise<SessionUser | NextResponse> {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export function cleanNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}
