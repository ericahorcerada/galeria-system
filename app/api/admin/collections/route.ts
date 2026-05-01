import { NextResponse } from "next/server";
import { cleanNumber, cleanText, isNextResponse, requireAdminSession } from "@/lib/admin-auth";
import { createCollection, deleteCollection, listCollections, updateCollection, type CollectionInput } from "@/lib/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["active", "inactive"]);

function parseCsv(value: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArtworkIds(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => Math.floor(Number(item)))
      .filter((item) => Number.isFinite(item) && item > 0);
  }
  return parseCsv(value)
    .map((item) => Math.floor(Number(item)))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function readInput(body: Record<string, unknown>): CollectionInput {
  const name = cleanText(body.name);
  const description = cleanText(body.description) || "";
  const imageUrl = cleanText(body.imageUrl || body.image_url) || "/placeholder.jpg";
  const heroImageUrl = cleanText(body.heroImageUrl || body.hero_image_url) || imageUrl;
  const artworkCount = Math.max(0, Math.floor(cleanNumber(body.artworkCount ?? body.artwork_count, 0)));
  const year = Math.max(1900, Math.floor(cleanNumber(body.year ?? body.collection_year, new Date().getFullYear())));
  const curator = cleanText(body.curator) || "Galeria Butuan City Curatorial Team";
  const exploreButtonText = cleanText(body.exploreButtonText || body.explore_button_text) || "Explore Collection";
  const status = cleanText(body.status) || "active";
  const sortOrder = Math.max(0, Math.floor(cleanNumber(body.sortOrder ?? body.sort_order, 0)));
  const featuredArtists = Array.isArray(body.featuredArtists)
    ? body.featuredArtists.map(String).map((item) => item.trim()).filter(Boolean)
    : parseCsv(body.featuredArtists || body.featured_artists);
  const artworkIds = parseArtworkIds(body.artworkIds || body.artwork_ids);

  if (!name) throw new Error("Collection name is required.");
  if (!STATUSES.has(status)) throw new Error("Invalid collection status.");

  return {
    name,
    description,
    imageUrl,
    heroImageUrl,
    artworkCount,
    featuredArtists,
    year,
    curator,
    exploreButtonText,
    artworkIds,
    status: status as "active" | "inactive",
    sortOrder,
  };
}

export async function GET() {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const collections = await listCollections(true);
    return NextResponse.json({ success: true, collections });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load collections." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json() as Record<string, unknown>;
    const input = readInput(body);
    const collectionId = await createCollection(input);
    return NextResponse.json({ success: true, collectionId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create collection." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const body = await request.json() as Record<string, unknown>;
    const collectionId = Math.floor(cleanNumber(body.collectionId ?? body.collection_id, 0));
    if (!collectionId) return NextResponse.json({ success: false, error: "Collection ID is required." }, { status: 400 });
    const input = readInput(body);
    const affectedRows = await updateCollection({ ...input, collectionId });
    if (!affectedRows) return NextResponse.json({ success: false, error: "Collection not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update collection." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const collectionId = Math.floor(cleanNumber(searchParams.get("collectionId"), 0));
    if (!collectionId) return NextResponse.json({ success: false, error: "Collection ID is required." }, { status: 400 });
    const affectedRows = await deleteCollection(collectionId);
    if (!affectedRows) return NextResponse.json({ success: false, error: "Collection not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete collection." }, { status: 500 });
  }
}
