import { listStoreArtworks } from "@/lib/store";
import { jsonNoStore } from "@/lib/no-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const artworks = await listStoreArtworks();
    return jsonNoStore({ success: true, artworks });
  } catch (error) {
    return jsonNoStore(
      { success: false, error: error instanceof Error ? error.message : "Unable to load artworks." },
      { status: 500 },
    );
  }
}
