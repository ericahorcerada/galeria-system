import { DEFAULT_COLLECTIONS, listCollections } from "@/lib/collections";
import { jsonNoStore } from "@/lib/no-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const collections = await listCollections(false);
    return jsonNoStore({ success: true, collections });
  } catch {
    // Keep the public homepage working when local MySQL is not running yet.
    // Admin edits will automatically appear here once MySQL is available.
    return jsonNoStore({ success: true, collections: DEFAULT_COLLECTIONS, fallback: true });
  }
}
