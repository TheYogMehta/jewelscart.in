import { unstable_cache, revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { connectDB } from "@/lib/db";

const execFileAsync = promisify(execFile);

export interface PageContent {
  id: number;
  page_key: string;
  title: string;
  subtitle: string;
  badge_text?: string | null;
  bg_type: "image" | "video" | "color";
  bg_url?: string | null;
  updated_at: Date;
}

async function getPageContentFromDb(pageKey: string): Promise<PageContent> {
  const pool = await connectDB();
  const res = await pool.query(
    "SELECT id, page_key, title, subtitle, badge_text, bg_type, bg_url, updated_at FROM site_content WHERE page_key = $1 LIMIT 1",
    [pageKey],
  );

  if (res.rows.length === 0) {
    const defaultTitle = pageKey.charAt(0).toUpperCase() + pageKey.slice(1);
    const insertRes = await pool.query(
      `INSERT INTO site_content (page_key, title, subtitle, bg_type)
       VALUES ($1, $2, '', 'image')
       ON CONFLICT (page_key) DO UPDATE SET updated_at = NOW()
       RETURNING id, page_key, title, subtitle, badge_text, bg_type, bg_url, updated_at`,
      [pageKey, defaultTitle],
    );
    const row = insertRes.rows[0];
    return {
      id: row.id,
      page_key: row.page_key,
      title: row.title,
      subtitle: row.subtitle,
      badge_text: row.badge_text,
      bg_type: row.bg_type || "image",
      bg_url: row.bg_url,
      updated_at: row.updated_at,
    };
  }

  const row = res.rows[0];
  return {
    id: row.id,
    page_key: row.page_key,
    title: row.title,
    subtitle: row.subtitle,
    badge_text: row.badge_text,
    bg_type: row.bg_type || "image",
    bg_url: row.bg_url,
    updated_at: row.updated_at,
  };
}

const getCachedPageContent = unstable_cache(
  async (pageKey: string) => getPageContentFromDb(pageKey),
  ["page-content"],
  { revalidate: 300, tags: ["site_content"] },
);

export async function getPageContent(
  pageKey: "home" | "about" | "contact" | "discover",
  options?: { fresh?: boolean },
): Promise<PageContent> {
  if (options?.fresh) {
    return getPageContentFromDb(pageKey);
  }
  return getCachedPageContent(pageKey);
}

export async function updatePageContent(
  pageKey: string,
  data: Partial<{
    title: string;
    subtitle: string;
    badge_text: string;
    bg_type: "image" | "video" | "color";
    bg_url: string;
  }>,
): Promise<PageContent> {
  const pool = await connectDB();

  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    values.push(data.title.trim());
    sets.push(`title = $${values.length}`);
  }
  if (data.subtitle !== undefined) {
    values.push(data.subtitle.trim());
    sets.push(`subtitle = $${values.length}`);
  }
  if (data.badge_text !== undefined) {
    values.push(data.badge_text.trim() || null);
    sets.push(`badge_text = $${values.length}`);
  }
  if (data.bg_type !== undefined) {
    values.push(data.bg_type);
    sets.push(`bg_type = $${values.length}`);
  }
  if (data.bg_url !== undefined) {
    values.push(data.bg_url || null);
    sets.push(`bg_url = $${values.length}`);
  }

  sets.push(`updated_at = NOW()`);
  values.push(pageKey);

  const updateQuery = `
    UPDATE site_content SET ${sets.join(", ")} WHERE page_key = $${values.length} RETURNING *
  `;

  const res = await pool.query(updateQuery, values);
  if (res.rows.length === 0) {
    await pool.query(
      `INSERT INTO site_content (page_key, title, subtitle, badge_text, bg_type, bg_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (page_key) DO NOTHING`,
      [
        pageKey,
        data.title || pageKey.charAt(0).toUpperCase() + pageKey.slice(1),
        data.subtitle || "",
        data.badge_text || null,
        data.bg_type || "image",
        data.bg_url || null,
      ],
    );
    revalidateContentCache();
    return getPageContentFromDb(pageKey);
  }

  revalidateContentCache();
  return getPageContentFromDb(pageKey);
}

export async function uploadHeroMedia(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  pageKey: string = "home",
): Promise<string> {
  const uploadDir = join(process.cwd(), "public", "uploads", "hero");
  await mkdir(uploadDir, { recursive: true });

  const safePageKey = ["home", "about", "contact", "discover"].includes(pageKey)
    ? pageKey
    : "home";
  const isVideo =
    mimeType.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(originalName);

  const knownExtensions = ["webp", "mp4", "webm", "mov", "jpg", "jpeg", "png"];
  for (const ext of knownExtensions) {
    try {
      await unlink(join(uploadDir, `${safePageKey}-hero.${ext}`));
    } catch {}
  }

  if (isVideo) {
    const filename = `${safePageKey}-hero.mp4`;
    const finalFilePath = join(uploadDir, filename);
    const tempInputPath = join(
      tmpdir(),
      `hero-input-${Date.now()}-${randomBytes(6).toString("hex")}.${originalName.split(".").pop()?.toLowerCase() || "mp4"}`,
    );

    try {
      await writeFile(tempInputPath, buffer);
      await execFileAsync(ffmpegPath || "ffmpeg", [
        "-y",
        "-i",
        tempInputPath,
        "-an",
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "fast",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale='min(1920,iw)':-2",
        "-movflags",
        "+faststart",
        finalFilePath,
      ]);
    } catch (ffmpegErr) {
      console.warn(
        "[MediaUpload] ffmpeg optimization failed, falling back to raw buffer:",
        ffmpegErr,
      );
      await writeFile(finalFilePath, buffer);
    } finally {
      try {
        await unlink(tempInputPath);
      } catch {}
    }

    return `/uploads/hero/${filename}`;
  } else {
    const filename = `${safePageKey}-hero.webp`;
    const filePath = join(uploadDir, filename);
    const optimized = await sharp(buffer)
      .rotate()
      .resize(2560, 1440, { fit: "inside", withoutEnlargement: true })
      .webp({
        quality: 88,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();
    await writeFile(filePath, optimized);
    return `/uploads/hero/${filename}`;
  }
}

export function revalidateContentCache() {
  try {
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/discover");
    revalidatePath("/admin/content");
  } catch (err) {
    console.error("[SiteContent] Revalidation error:", err);
  }
}
