import { getStoreArtwork } from "@/lib/store";
import { jsonNoStore } from "@/lib/no-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const artworkId = Number(id);
    if (!Number.isInteger(artworkId) || artworkId <= 0) {
      return jsonNoStore({ success: false, error: "Invalid artwork ID." }, { status: 400 });
    }

    const artwork = await getStoreArtwork(artworkId);
    if (!artwork) {
      return jsonNoStore({ success: false, error: "Artwork not found." }, { status: 404 });
    }

    return jsonNoStore({ success: true, artwork });
  } catch (error) {
    return jsonNoStore(
      { success: false, error: error instanceof Error ? error.message : "Unable to load artwork." },
      { status: 500 },
    );
  }
}
