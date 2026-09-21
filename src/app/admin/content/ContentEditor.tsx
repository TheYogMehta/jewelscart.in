"use client";

import { useState, useEffect, useRef } from "react";
import { PageContent } from "@/lib/content";
import { isVideoMedia } from "@/lib/media";

interface Props {
  initialContent: {
    home: PageContent;
    about: PageContent;
    contact: PageContent;
    discover: PageContent;
  };
}

const MAX_SUBTITLE_WORDS = 150;
const MAX_SUBTITLE_CHARS = 1000;
const MAX_TITLE_CHARS = 150;
const MAX_BADGE_CHARS = 80;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function ContentEditor({ initialContent }: Props) {
  const [activeTab, setActiveTab] = useState<
    "home" | "about" | "contact" | "discover"
  >("home");
  const [contentMap, setContentMap] = useState(initialContent);

  const current = contentMap[activeTab];

  const [title, setTitle] = useState(current.title);
  const [subtitle, setSubtitle] = useState(current.subtitle);
  const [badgeText, setBadgeText] = useState(current.badge_text || "");
  const [bgType, setBgType] = useState<"image" | "video" | "color">(
    current.bg_type || "image",
  );
  const [bgUrl, setBgUrl] = useState(current.bg_url || "");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const previewUrlRef = useRef<string | null>(null);
  const badgeRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const subtitleRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resizeTextarea(badgeRef.current);
    resizeTextarea(titleRef.current);
    resizeTextarea(subtitleRef.current);
  }, [activeTab, badgeText, title, subtitle]);

  useEffect(() => {
    const handleResize = () => {
      resizeTextarea(badgeRef.current);
      resizeTextarea(titleRef.current);
      resizeTextarea(subtitleRef.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(
        "File size exceeds 100MB (Cloudflare maximum upload limit). Please choose a smaller file.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setErrorMsg(null);

    if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setFileToUpload(file);
    const isVid =
      file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
    setBgType(isVid ? "video" : "image");

    if (isVid) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setFilePreviewUrl(url);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result;
        if (typeof res === "string") {
          previewUrlRef.current = res;
          setFilePreviewUrl(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setFileToUpload(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTabChange = (tab: "home" | "about" | "contact" | "discover") => {
    if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setActiveTab(tab);
    const next = contentMap[tab];
    setTitle(next.title);
    setSubtitle(next.subtitle);
    setBadgeText(next.badge_text || "");
    setBgType(next.bg_type || "image");
    setBgUrl(next.bg_url || "");
    setFileToUpload(null);
    setFilePreviewUrl(null);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (countWords(subtitle) > MAX_SUBTITLE_WORDS) {
      setErrorMsg(
        `Hero subtitle cannot exceed ${MAX_SUBTITLE_WORDS} words (currently ${countWords(subtitle)} words).`,
      );
      return;
    }
    if (subtitle.length > MAX_SUBTITLE_CHARS) {
      setErrorMsg(
        `Hero subtitle cannot exceed ${MAX_SUBTITLE_CHARS} characters (currently ${subtitle.length} characters).`,
      );
      return;
    }
    if (title.length > MAX_TITLE_CHARS) {
      setErrorMsg(`Main title cannot exceed ${MAX_TITLE_CHARS} characters.`);
      return;
    }
    if (badgeText.length > MAX_BADGE_CHARS) {
      setErrorMsg(
        `Small badge header cannot exceed ${MAX_BADGE_CHARS} characters.`,
      );
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("page_key", activeTab);
      formData.append("title", title);
      formData.append("subtitle", subtitle);
      formData.append("badge_text", badgeText);
      formData.append("bg_type", bgType);
      if (fileToUpload) {
        formData.append("media_file", fileToUpload);
      } else if (bgUrl) {
        formData.append("bg_url", bgUrl);
      }

      const res = await fetch("/api/admin/content", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update content");
      }

      const updated = await res.json();
      setContentMap((prev) => ({
        ...prev,
        [activeTab]: updated,
      }));

      if (updated.bg_url) {
        setBgUrl(updated.bg_url);
      }

      if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setFileToUpload(null);
      setFilePreviewUrl(null);
      setSuccessMsg(
        `${activeTab.toUpperCase()} Hero Section updated successfully!`,
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to save content",
      );
    } finally {
      setLoading(false);
    }
  };

  const previewBgUrl = filePreviewUrl || bgUrl;
  const previewBgType = fileToUpload
    ? fileToUpload.type.startsWith("video/") ||
      /\.(mp4|webm|mov)$/i.test(fileToUpload.name)
      ? "video"
      : "image"
    : bgType;

  return (
    <div className="space-y-8 w-full max-w-full min-w-0">
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
          Site Content & Hero Editor
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Customize hero headings, subtitles, and background visuals across your
          storefront.
        </p>
      </div>

      {/* Page Tabs */}
      <div className="w-full max-w-full overflow-x-auto scrollbar-none border-b border-stone-200">
        <div className="flex w-max gap-1 pb-px">
          <button
            type="button"
            onClick={() => handleTabChange("home")}
            className={`whitespace-nowrap px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm font-medium border-b-2 transition ${
              activeTab === "home"
                ? "border-gold text-gold"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            Home Page Hero
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("about")}
            className={`whitespace-nowrap px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm font-medium border-b-2 transition ${
              activeTab === "about"
                ? "border-gold text-gold"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            About Page Hero
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("contact")}
            className={`whitespace-nowrap px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm font-medium border-b-2 transition ${
              activeTab === "contact"
                ? "border-gold text-gold"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            Contact Page Hero
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("discover")}
            className={`whitespace-nowrap px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm font-medium border-b-2 transition ${
              activeTab === "discover"
                ? "border-gold text-gold"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            Discover Page Hero
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 w-full max-w-full min-w-0">
        {/* Editor Form */}
        <div className="lg:col-span-7 w-full max-w-full min-w-0">
          <form
            onSubmit={handleSave}
            className="w-full max-w-full min-w-0 rounded-2xl border border-stone-200 bg-white p-4 sm:p-8 space-y-6 shadow-xs"
          >
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-display text-lg font-semibold text-stone-900 capitalize">
                {activeTab} Hero Configuration
              </h2>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-700">
                  Small Badge Header
                </label>
                <span className="text-[11px] text-stone-400 font-mono">
                  {badgeText.length}/{MAX_BADGE_CHARS}
                </span>
              </div>
              <textarea
                ref={badgeRef}
                rows={1}
                maxLength={MAX_BADGE_CHARS}
                value={badgeText}
                onChange={(e) => {
                  setBadgeText(e.target.value);
                  resizeTextarea(e.target);
                }}
                placeholder='e.g. "Handcrafted in India" or "Our Heritage"'
                className="mt-1 w-full resize-none overflow-hidden rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none transition-[height] duration-75"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-700">
                  Main Title *
                </label>
                <span className="text-[11px] text-stone-400 font-mono">
                  {title.length}/{MAX_TITLE_CHARS}
                </span>
              </div>
              <textarea
                ref={titleRef}
                rows={1}
                required
                maxLength={MAX_TITLE_CHARS}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  resizeTextarea(e.target);
                }}
                placeholder='e.g. "Handcrafted in India"'
                className="mt-1 w-full resize-none overflow-hidden rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-gold focus:outline-none transition-[height] duration-75"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-700">
                  Hero Subtitle
                </label>
                <div className="text-[11px] font-mono">
                  <span
                    className={
                      countWords(subtitle) > MAX_SUBTITLE_WORDS
                        ? "text-red-500 font-semibold"
                        : countWords(subtitle) >= MAX_SUBTITLE_WORDS * 0.9
                          ? "text-amber-500 font-medium"
                          : "text-stone-400"
                    }
                  >
                    {countWords(subtitle)} / {MAX_SUBTITLE_WORDS} words
                  </span>
                </div>
              </div>
              <textarea
                ref={subtitleRef}
                rows={3}
                maxLength={MAX_SUBTITLE_CHARS}
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  resizeTextarea(e.target);
                }}
                placeholder='e.g. "Where elegance meets craftsmanship. Discover handcrafted fine jewellery..."'
                className="mt-1 w-full resize-none overflow-hidden rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none transition-[height] duration-75"
              />
              {countWords(subtitle) > MAX_SUBTITLE_WORDS && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  Subtitle exceeds the maximum limit of {MAX_SUBTITLE_WORDS}{" "}
                  words.
                </p>
              )}
            </div>

            {/* Hero Background Media Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Hero Background Media
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-gold bg-amber-50/40"
                    : fileToUpload
                      ? "border-amber-300/80 bg-amber-50/20"
                      : "border-stone-200 bg-stone-50/40 hover:border-gold/60 hover:bg-stone-50"
                }`}
              >
                {fileToUpload ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/80 text-gold">
                      {fileToUpload.type.startsWith("video/") ||
                      /\.(mp4|webm|mov)$/i.test(fileToUpload.name) ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="max-w-55 truncate text-xs font-semibold text-stone-900 sm:max-w-sm">
                        {fileToUpload.name}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
                        {fileToUpload.type.startsWith("video/") ||
                        /\.(mp4|webm|mov)$/i.test(fileToUpload.name)
                          ? "Video"
                          : "Image"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      {formatFileSize(fileToUpload.size)} • Click or drop
                      another file to replace
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      className="mt-1 text-xs font-medium text-red-500 hover:text-red-700 hover:underline"
                    >
                      Remove selected file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-400 group-hover:bg-amber-50 group-hover:text-gold transition">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-800 group-hover:text-gold transition">
                        {bgUrl
                          ? "Click or drag to replace background media"
                          : "Click or drag to upload media"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-stone-400">
                        Max 100MB file limit
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gold py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-gold-light disabled:opacity-50 transition shadow-xs"
              >
                {loading
                  ? "Saving & Publishing..."
                  : "Save & Publish Hero Content"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Live Preview
            </h3>

            <div className="mt-4 relative aspect-16/10 w-full overflow-hidden rounded-xl bg-stone-900 text-white flex items-center justify-center p-6 text-center shadow-inner">
              {isVideoMedia(previewBgUrl, previewBgType) && previewBgUrl ? (
                <video
                  key={previewBgUrl}
                  ref={(el) => {
                    if (el) {
                      el.muted = true;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                  src={previewBgUrl}
                />
              ) : previewBgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={previewBgUrl}
                  src={previewBgUrl}
                  alt="Preview"
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#b8860b33,transparent_60%)]" />
              )}

              <div className="relative z-10 space-y-2">
                {badgeText && (
                  <p className="text-[9px] tracking-[0.2em] text-gold uppercase font-medium">
                    {badgeText}
                  </p>
                )}
                <h4 className="font-display text-xl font-semibold leading-tight text-white sm:text-2xl">
                  {title || "Hero Title"}
                </h4>
                <p className="line-clamp-2 text-xs font-light text-stone-300">
                  {subtitle || "Hero subtitle text goes here."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
