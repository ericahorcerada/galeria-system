import { isNextResponse, requireAdminSession } from "@/lib/admin-auth";
import { cleanHomepageText, getHomepageSettings, normalizeHomepageSettings } from "@/lib/homepage";
import { getPool } from "@/lib/db";
import { jsonNoStore } from "@/lib/no-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanHref(value: unknown, fallback: string) {
  const text = cleanHomepageText(value, fallback);
  if (text.startsWith("/") || text.startsWith("http://") || text.startsWith("https://")) return text;
  return fallback;
}

export async function GET() {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const settings = await getHomepageSettings();
    return jsonNoStore({ success: true, settings: normalizeHomepageSettings(settings as any) });
  } catch (error) {
    return jsonNoStore({ success: false, error: error instanceof Error ? error.message : "Unable to load homepage settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const current = await getHomepageSettings();
    const body = await request.json();

    const settings = {
      eyebrow: cleanHomepageText(body.eyebrow, current.eyebrow),
      title: cleanHomepageText(body.title, current.title),
      highlight: cleanHomepageText(body.highlight, current.highlight),
      subtitle: cleanHomepageText(body.subtitle, current.subtitle),
      primary_button_text: cleanHomepageText(body.primary_button_text ?? body.primaryButtonText, current.primary_button_text),
      primary_button_href: cleanHref(body.primary_button_href ?? body.primaryButtonHref, current.primary_button_href),
      secondary_button_text: cleanHomepageText(body.secondary_button_text ?? body.secondaryButtonText, current.secondary_button_text),
      secondary_button_href: cleanHref(body.secondary_button_href ?? body.secondaryButtonHref, current.secondary_button_href),
      background_image_url: cleanHomepageText(body.background_image_url ?? body.backgroundImageUrl, current.background_image_url),
      featured_image_url: cleanHomepageText(body.featured_image_url ?? body.featuredImageUrl, current.featured_image_url),
      featured_title: cleanHomepageText(body.featured_title ?? body.featuredTitle, current.featured_title),
      featured_subtitle: cleanHomepageText(body.featured_subtitle ?? body.featuredSubtitle, current.featured_subtitle),
    };

    await getPool().query(
      `UPDATE homepage_settings
       SET eyebrow = ?, title = ?, highlight = ?, subtitle = ?, primary_button_text = ?, primary_button_href = ?, secondary_button_text = ?, secondary_button_href = ?, background_image_url = ?, featured_image_url = ?, featured_title = ?, featured_subtitle = ?
       WHERE id = 1`,
      [settings.eyebrow, settings.title, settings.highlight, settings.subtitle, settings.primary_button_text, settings.primary_button_href, settings.secondary_button_text, settings.secondary_button_href, settings.background_image_url, settings.featured_image_url, settings.featured_title, settings.featured_subtitle],
    );

    return jsonNoStore({ success: true, settings: normalizeHomepageSettings((await getHomepageSettings()) as any) });
  } catch (error) {
    return jsonNoStore({ success: false, error: error instanceof Error ? error.message : "Unable to save homepage settings." }, { status: 500 });
  }
}
