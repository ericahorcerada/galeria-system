import { NextResponse } from "next/server";
import { DEFAULT_ARTISTS, listArtists } from "@/lib/artists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const artists = await listArtists({ activeOnly: true });
    return NextResponse.json({ success: true, artists });
  } catch {
    return NextResponse.json({ success: true, artists: DEFAULT_ARTISTS });
  }
}
