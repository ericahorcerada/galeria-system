import { jsonNoStore } from "@/lib/no-cache";
import { DEFAULT_HOMEPAGE_SETTINGS, getHomepageSettings, normalizeHomepageSettings } from "@/lib/homepage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getHomepageSettings();
    return jsonNoStore({ success: true, settings: normalizeHomepageSettings(settings as any) });
  } catch (error) {
    return jsonNoStore({ success: true, settings: DEFAULT_HOMEPAGE_SETTINGS, warning: error instanceof Error ? error.message : "Using default homepage settings." });
  }
}
