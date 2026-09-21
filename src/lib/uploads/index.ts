import sharp from "sharp";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "gif"]);
export const ALLOWED_VIDEO_EXTS = new Set(["mp4", "webm", "mov", "m4v", "mkv"]);

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

export interface ProcessMediaOptions {
  folder: "hero" | "catelog" | "products" | (string & {});
  filename: string;
  buffer: Buffer;
  originalName: string;
  mimeType?: string;
  maxDimension?: number;
  quality?: number;
}

export async function processMediaUpload({
  folder,
  filename,
  buffer,
  originalName,
  mimeType,
  maxDimension = 2048,
  quality = 86,
}: ProcessMediaOptions): Promise<MediaItem> {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const uploadDir = join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(uploadDir, { recursive: true });

  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  const isVideo = mimeType?.startsWith("video/") || ALLOWED_VIDEO_EXTS.has(ext);

  const finalFilePath = join(uploadDir, filename);

  if (isVideo) {
    const tempInputPath = join(
      tmpdir(),
      `upload-temp-${Date.now()}-${randomBytes(4).toString("hex")}.${ext || "mp4"}`,
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
        "24",
        "-preset",
        "fast",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        `scale='min(${maxDimension},iw)':-2`,
        "-movflags",
        "+faststart",
        finalFilePath,
      ]);
    } catch (ffmpegErr) {
      console.warn(
        `[Upload:${folder}] ffmpeg optimization failed, saving raw buffer:`,
        ffmpegErr,
      );
      await writeFile(finalFilePath, buffer);
    } finally {
      try {
        await unlink(tempInputPath);
      } catch {}
    }

    return {
      url: `/uploads/${safeFolder}/${filename}`,
      type: "video",
    };
  } else {
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new UploadError("Invalid image file");
    }

    if (!metadata.format || !ALLOWED_IMAGE_FORMATS.has(metadata.format)) {
      throw new UploadError(
        `Unsupported image format (${metadata.format || "unknown"}). Allowed: JPEG, PNG, WebP, GIF.`,
      );
    }

    try {
      const compressedBuffer = await sharp(buffer)
        .rotate()
        .resize(maxDimension, maxDimension, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 6,
          smartSubsample: true,
        })
        .toBuffer();

      await writeFile(finalFilePath, compressedBuffer);
    } catch {
      throw new UploadError("Failed to process image");
    }

    return {
      url: `/uploads/${safeFolder}/${filename}`,
      type: "image",
    };
  }
}

export async function uploadCatelogMedia(
  buffer: Buffer,
  originalName: string,
  mimeType?: string,
  identifier?: string,
): Promise<MediaItem> {
  const cleanId =
    (identifier || "").trim().replace(/[^a-zA-Z0-9_-]/g, "_") ||
    `cat_${Date.now()}_${randomBytes(3).toString("hex")}`;

  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  const isVideo = mimeType?.startsWith("video/") || ALLOWED_VIDEO_EXTS.has(ext);
  const targetExt = isVideo ? "mp4" : "webp";
  const filename = `${cleanId}.${targetExt}`;

  const uploadDir = join(process.cwd(), "public", "uploads", "catelog");
  try {
    await unlink(join(uploadDir, `${cleanId}.${isVideo ? "webp" : "mp4"}`));
  } catch {}

  return processMediaUpload({
    folder: "catelog",
    filename,
    buffer,
    originalName,
    mimeType,
  });
}

export async function uploadProductMedia(
  buffer: Buffer,
  originalName: string,
  mimeType?: string,
  sku?: string,
  index?: number,
): Promise<MediaItem> {
  const cleanSku =
    (sku || "").trim().replace(/[^a-zA-Z0-9_-]/g, "_") ||
    `prod_${Date.now()}_${randomBytes(3).toString("hex")}`;

  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  const isVideo = mimeType?.startsWith("video/") || ALLOWED_VIDEO_EXTS.has(ext);
  const targetExt = isVideo ? "mp4" : "webp";

  const suffix = index !== undefined && index > 0 ? `-${index}` : "";
  const filename = `${cleanSku}${suffix}.${targetExt}`;

  return processMediaUpload({
    folder: "products",
    filename,
    buffer,
    originalName,
    mimeType,
  });
}
