import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { jsonNoStore } from "@/lib/no-cache";
import { isNextResponse, requireAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024;

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "upload";
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isNextResponse(session)) return session;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderValue = String(formData.get("folder") || "artworks");
    const allowedFolders = new Set(["artworks", "artists", "homepage", "collections"]);
    const folder = allowedFolders.has(folderValue) ? folderValue : "artworks";

    if (!(file instanceof File)) {
      return jsonNoStore({ success: false, error: "Upload an image file." }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      return jsonNoStore({ success: false, error: "Only JPG, PNG, WebP, and GIF images are allowed." }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return jsonNoStore({ success: false, error: `Image must be between 1 byte and ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}-${safeFileName(file.name)}.${extension}`;
    await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

    return jsonNoStore({ success: true, url: `/uploads/${folder}/${filename}`, filename }, { status: 201 });
  } catch (error) {
    return jsonNoStore(
      { success: false, error: error instanceof Error ? error.message : "Unable to upload image." },
      { status: 500 },
    );
  }
}
