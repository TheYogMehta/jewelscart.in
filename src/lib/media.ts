const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "mkv", "ogg"]);

/**
 * Checks whether a given media URL or declared type represents a video.
 */
export function isVideoMedia(
  url?: string | null,
  type?: string | null,
): boolean {
  if (type === "video") return true;
  if (!url) return false;
  const cleanUrl = url.split("?")[0].split("#")[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase();
  return Boolean(ext && VIDEO_EXTENSIONS.has(ext));
}
