"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryDocument } from "@/lib/categories";
import { isVideoMedia } from "@/lib/media";

interface Props {
  initialCategory?: CategoryDocument;
  isEdit?: boolean;
}

const MAX_CATEGORY_WORDS = 5000;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function CategoryForm({ initialCategory, isEdit = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(initialCategory?.name || "");
  const [slug, setSlug] = useState(initialCategory?.slug || "");
  const [slugCustomized, setSlugCustomized] = useState(
    Boolean(initialCategory?.slug),
  );
  const [description, setDescription] = useState(
    initialCategory?.description || "",
  );
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 88)}px`;
  };

  useEffect(() => {
    resizeTextarea(descriptionRef.current);
  }, [description]);

  useEffect(() => {
    const handleResize = () => {
      resizeTextarea(descriptionRef.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const initialParentId =
    initialCategory?.parent_id ??
    (searchParams.get("parent_id")
      ? parseInt(searchParams.get("parent_id")!, 10)
      : null);
  const [parentId, setParentId] = useState<number | null>(initialParentId);
  const [parentSearchQuery, setParentSearchQuery] = useState<string>(
    initialParentId === null ? "None" : "",
  );
  const [parentSearchError, setParentSearchError] = useState<string | null>(
    null,
  );
  const [availableParents, setAvailableParents] = useState<CategoryDocument[]>(
    [],
  );
  const [loadingParents, setLoadingParents] = useState(true);
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const parentDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        parentDropdownRef.current &&
        !parentDropdownRef.current.contains(event.target as Node)
      ) {
        setParentDropdownOpen(false);

        const trimmed = parentSearchQuery.trim();
        if (!trimmed || trimmed.toLowerCase() === "none") {
          setParentId(null);
          setParentSearchQuery("None");
          setParentSearchError(null);
        } else {
          const match = availableParents.find(
            (p) =>
              (p.path && p.path.toLowerCase() === trimmed.toLowerCase()) ||
              (p.name && p.name.toLowerCase() === trimmed.toLowerCase()),
          );
          if (match) {
            setParentId(match.id);
            setParentSearchQuery(match.path || match.name);
            setParentSearchError(null);
          } else {
            setParentId(null);
            setParentSearchError(
              `Category "${trimmed}" does not exist. Please select a valid category from the list.`,
            );
          }
        }
      }
    }
    if (parentDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [parentDropdownOpen, parentSearchQuery, availableParents]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/categories?all=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CategoryDocument[]) => {
        if (isMounted && Array.isArray(data)) {
          let filtered = data;
          if (isEdit && initialCategory?.id) {
            const selfId = initialCategory.id;
            const isDescendant = (c: CategoryDocument): boolean => {
              if (c.id === selfId) return true;
              if (!c.parent_id) return false;
              if (c.parent_id === selfId) return true;
              const parent = data.find((p) => p.id === c.parent_id);
              return parent ? isDescendant(parent) : false;
            };
            filtered = data.filter((c) => !isDescendant(c));
          }
          setAvailableParents(filtered);
          if (initialParentId !== null) {
            const match = filtered.find((p) => p.id === initialParentId);
            if (match) {
              setParentSearchQuery(match.path || match.name);
            }
          } else {
            setParentSearchQuery("None");
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingParents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, initialCategory?.id, initialParentId]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugCustomized) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      );
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    if (val.trim() === "") {
      setSlugCustomized(false);
    } else {
      setSlugCustomized(true);
    }
  };

  const handleParentInputChange = (val: string) => {
    setParentSearchQuery(val);
    setParentDropdownOpen(true);

    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === "none") {
      setParentId(null);
      setParentSearchError(null);
      return;
    }

    const exactMatch = availableParents.find(
      (p) =>
        (p.path && p.path.toLowerCase() === trimmed.toLowerCase()) ||
        (p.name && p.name.toLowerCase() === trimmed.toLowerCase()),
    );

    if (exactMatch) {
      setParentId(exactMatch.id);
      setParentSearchError(null);
      return;
    }

    const hasPartial = availableParents.some((p) => {
      const q = trimmed.toLowerCase();
      return (
        (p.path && p.path.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q))
      );
    });

    if (!hasPartial) {
      setParentId(null);
      setParentSearchError(
        `Category "${trimmed}" does not exist. Please select a valid category from the list.`,
      );
    } else {
      setParentId(null);
      setParentSearchError(null);
    }
  };

  const handleSelectParent = (category: CategoryDocument | null) => {
    if (!category) {
      setParentId(null);
      setParentSearchQuery("None");
      setParentSearchError(null);
      setParentDropdownOpen(false);
    } else {
      setParentId(category.id);
      setParentSearchQuery(category.path || category.name);
      setParentSearchError(null);
      setParentDropdownOpen(false);
    }
  };

  const handleClearParentSearch = () => {
    setParentId(null);
    setParentSearchQuery("");
    setParentSearchError(null);
    setParentDropdownOpen(true);
  };

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string>("");
  const [pendingType, setPendingType] = useState<"image" | "video">("image");

  const [bannerType, setBannerType] = useState<"image" | "video">(
    initialCategory?.banner_type || "image",
  );
  const [bannerUrl, setBannerUrl] = useState(initialCategory?.banner_url || "");
  const [imageError, setImageError] = useState(false);
  const [showInHeader, setShowInHeader] = useState<boolean>(
    initialCategory?.show_in_header ?? true,
  );

  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverMain, setDragOverMain] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      setError("File must be under 100MB.");
      return;
    }
    setError(null);
    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov|m4v|mkv|ogv)$/i.test(file.name);
    setPendingFile(file);
    setPendingType(isVideo ? "video" : "image");
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(URL.createObjectURL(file));
  };

  const handleClearPending = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview("");
  };

  const uploadPendingFile = async (
    id: string,
  ): Promise<{ url: string; type: "image" | "video" } | null> => {
    if (!pendingFile) return null;
    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("id", id);
    const res = await fetch("/api/categories/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (countWords(description) > MAX_CATEGORY_WORDS) {
      setError(
        `Description cannot exceed ${MAX_CATEGORY_WORDS} words (currently ${countWords(description)} words).`,
      );
      return;
    }

    if (parentSearchError) {
      setError(parentSearchError);
      return;
    }

    const trimmedParent = parentSearchQuery.trim();
    if (
      trimmedParent &&
      trimmedParent.toLowerCase() !== "none" &&
      parentId === null
    ) {
      setError(
        `Category "${trimmedParent}" does not exist. Please select a valid category from the list or choose None.`,
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/categories/${initialCategory?.id}`
        : "/api/categories";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        parent_id: parentId,
        description: description.trim() || null,
        banner_type: bannerType,
        banner_url: bannerUrl.trim() || null,
        show_in_header: showInHeader,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save category.");
      }

      const saved = await res.json();
      const categoryId = String(saved.id || initialCategory?.id || slug.trim());

      if (pendingFile && categoryId) {
        setUploadingMedia(true);
        try {
          const uploaded = await uploadPendingFile(categoryId);
          if (uploaded) {
            await fetch(`/api/categories/${categoryId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                banner_url: uploaded.url,
                banner_type: uploaded.type,
              }),
            });
          }
        } finally {
          setUploadingMedia(false);
        }
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while saving the category.";
      setError(message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialCategory?.id) return;
    if (
      !confirm(
        `Are you sure you want to delete category "${initialCategory.name}"? Products in this category may become unlisted.`,
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${initialCategory.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      router.push("/admin/categories");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete category";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Top Header & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <Link
                href="/admin/categories"
                className="hover:text-gold transition"
              >
                Categories
              </Link>
              <span>/</span>
              <span className="text-stone-800 font-medium">
                {isEdit ? "Edit Category" : "New Category"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
                {isEdit
                  ? `Edit "${initialCategory?.name}"`
                  : "Add New Category"}
              </h1>
              {!showInHeader && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                  Hidden
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Configure category metadata, sub-categories, and media banners.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/categories"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-2xs"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setShowInHeader((prev) => !prev)}
              disabled={loading}
              title={
                showInHeader
                  ? "Category is visible. Click to hide."
                  : "Category is hidden. Click to show."
              }
              aria-label={showInHeader ? "Hide category" : "Show category"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition shadow-2xs cursor-pointer ${
                showInHeader
                  ? "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              {showInHeader ? (
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              )}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                title="Delete Category"
                aria-label="Delete Category"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50/60 text-red-600 hover:bg-red-100 hover:border-red-300 transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            )}
            <button
              type="submit"
              disabled={loading || uploadingMedia}
              title={
                uploadingMedia
                  ? "Uploading media..."
                  : loading
                    ? "Saving..."
                    : isEdit
                      ? "Save Changes"
                      : "Create Category"
              }
              aria-label={
                uploadingMedia
                  ? "Uploading media..."
                  : loading
                    ? "Saving..."
                    : isEdit
                      ? "Save Changes"
                      : "Create Category"
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-white shadow-xs hover:bg-gold-light disabled:opacity-50 transition cursor-pointer"
            >
              {loading || uploadingMedia ? (
                <svg
                  className="h-4.5 w-4.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21h10.5A2.25 2.25 0 0021 18.75V6.75L17.25 3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 21v-7.5H7.5V21"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 3v4.5h7.5V3"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
            <svg
              className="h-5 w-5 text-red-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <div className="w-full space-y-8">
          {/* Section 1: Category Details & Parent */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Category Details
            </h2>

            {/* Parent Category Field */}
            <div>
              <label className="block text-xs font-medium text-stone-700">
                Parent Category
              </label>
              {loadingParents ? (
                <div className="mt-1.5 h-10 w-full animate-pulse rounded-xl bg-stone-100" />
              ) : (
                <div className="relative mt-1.5" ref={parentDropdownRef}>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={parentSearchQuery}
                      onChange={(e) => handleParentInputChange(e.target.value)}
                      onFocus={(e) => {
                        setParentDropdownOpen(true);
                        e.target.select();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const trimmed = parentSearchQuery
                            .trim()
                            .toLowerCase();
                          if (trimmed === "none" || !trimmed) {
                            handleSelectParent(null);
                          } else {
                            const query = parentSearchQuery
                              .trim()
                              .toLowerCase();
                            const matches = availableParents.filter((p) => {
                              const path = (p.path || "").toLowerCase();
                              const name = (p.name || "").toLowerCase();
                              return (
                                path.includes(query) || name.includes(query)
                              );
                            });
                            if (matches.length === 1) {
                              handleSelectParent(matches[0]);
                            } else {
                              const exact = availableParents.find(
                                (p) =>
                                  (p.path &&
                                    p.path.toLowerCase() === trimmed) ||
                                  (p.name && p.name.toLowerCase() === trimmed),
                              );
                              if (exact) {
                                handleSelectParent(exact);
                              } else {
                                setParentId(null);
                                setParentSearchError(
                                  `Category "${parentSearchQuery.trim()}" does not exist. Please select a valid category from the list.`,
                                );
                                setParentDropdownOpen(false);
                              }
                            }
                          }
                        } else if (e.key === "Escape") {
                          setParentDropdownOpen(false);
                        }
                      }}
                      placeholder="Type category name or 'None'..."
                      className={`min-h-10.5 w-full rounded-xl border bg-white/80 backdrop-blur-xs pl-3.5 pr-16 text-sm text-stone-900 transition focus:outline-none focus:ring-1 ${
                        parentSearchError
                          ? "border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-500 focus:ring-red-500"
                          : parentDropdownOpen
                            ? "border-gold ring-1 ring-gold"
                            : "border-stone-200/90 hover:border-stone-300"
                      }`}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      {parentSearchQuery && (
                        <button
                          type="button"
                          onClick={handleClearParentSearch}
                          aria-label="Clear parent category search"
                          className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setParentDropdownOpen((prev) => !prev)}
                        aria-label="Toggle categories list"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 transition"
                      >
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${
                            parentDropdownOpen ? "rotate-180 text-gold" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {parentDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-full max-h-60 overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                      {(() => {
                        const query = parentSearchQuery.trim().toLowerCase();
                        const showNoneOption =
                          query === "" ||
                          query === "none" ||
                          "none".includes(query) ||
                          "top-level".includes(query);
                        const filteredParents =
                          query === "" || query === "none"
                            ? availableParents
                            : availableParents.filter((p) => {
                                const path = (p.path || "").toLowerCase();
                                const name = (p.name || "").toLowerCase();
                                return (
                                  path.includes(query) || name.includes(query)
                                );
                              });

                        return (
                          <>
                            {showNoneOption && (
                              <button
                                type="button"
                                onClick={() => handleSelectParent(null)}
                                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                                  parentId === null
                                    ? "bg-amber-50/70 text-gold font-semibold"
                                    : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                                }`}
                              >
                                <span>None (Top-level category)</span>
                                {parentId === null && (
                                  <svg
                                    className="h-4 w-4 text-gold"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </button>
                            )}

                            {showNoneOption && filteredParents.length > 0 && (
                              <div className="my-1 border-t border-stone-100" />
                            )}

                            {filteredParents.length > 0 ? (
                              filteredParents.map((p) => {
                                const isSelected = parentId === p.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelectParent(p)}
                                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition text-left ${
                                      isSelected
                                        ? "bg-amber-50/70 text-gold font-semibold"
                                        : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {p.path || p.name}
                                    </span>
                                    {isSelected && (
                                      <svg
                                        className="h-4 w-4 shrink-0 text-gold ml-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                );
                              })
                            ) : !showNoneOption ? (
                              <div className="px-3.5 py-3 text-center text-xs text-stone-500">
                                No category found matching &ldquo;
                                <span className="font-semibold text-stone-700">
                                  {parentSearchQuery}
                                </span>
                                &rdquo;
                              </div>
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
              {parentSearchError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                  <svg
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  <span>{parentSearchError}</span>
                </p>
              )}
              <p className="mt-1 text-[11px] text-stone-500">
                {parentId
                  ? "This category will be created as a sub-category under the selected parent."
                  : "Top-level categories appear on the homepage and root discovery catalogue."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-stone-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Handmade or Earrings"
                  className="mt-1.5 block w-full rounded-xl border border-stone-200/90 bg-white/80 backdrop-blur-xs px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g. handmade or earrings"
                  className="mt-1.5 block w-full rounded-xl border border-stone-200/90 bg-white/80 backdrop-blur-xs px-3.5 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 placeholder:font-sans focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            {name.trim() && (
              <p className="text-[11px] font-mono text-stone-400">
                Storefront URL: /category/
                {(slug.trim() || name)
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")}
              </p>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-700">
                  Description
                </label>
                <div className="text-[11px] font-mono">
                  <span
                    className={
                      countWords(description) > MAX_CATEGORY_WORDS
                        ? "text-red-500 font-semibold"
                        : countWords(description) >= MAX_CATEGORY_WORDS * 0.9
                          ? "text-amber-500 font-medium"
                          : "text-stone-400"
                    }
                  >
                    {countWords(description)} / {MAX_CATEGORY_WORDS} words
                  </span>
                </div>
              </div>
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  resizeTextarea(e.target);
                }}
                rows={3}
                placeholder="Describe this category. Appears as the hero subtitle on the category page and on collection cards..."
                className="mt-1.5 block w-full resize-none overflow-hidden rounded-xl border border-stone-200/90 bg-white/80 backdrop-blur-xs px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-[height] duration-75"
                style={{ minHeight: "88px" }}
              />
              {countWords(description) > MAX_CATEGORY_WORDS && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  Description exceeds the maximum limit of {MAX_CATEGORY_WORDS}{" "}
                  words. Please shorten your text before saving.
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Category Banner Media */}
          <div className="space-y-4 pt-6 border-t border-stone-100">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                Category Banner Media
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Image or video banner for category hero and collections. Max
                100MB.
              </p>
            </div>

            {/* Dropzone / Media Display */}
            <div
              onClick={() => {
                if (!pendingPreview && !bannerUrl) {
                  mediaInputRef.current?.click();
                }
              }}
              role={!pendingPreview && !bannerUrl ? "button" : undefined}
              tabIndex={!pendingPreview && !bannerUrl ? 0 : undefined}
              onKeyDown={(e) => {
                if (
                  !pendingPreview &&
                  !bannerUrl &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  mediaInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverMain(true);
              }}
              onDragLeave={() => setDragOverMain(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverMain(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className={`relative transition ${
                dragOverMain
                  ? "rounded-2xl border-2 border-dashed border-gold bg-gold/5 p-6 cursor-pointer"
                  : pendingPreview || bannerUrl
                    ? ""
                    : "group cursor-pointer rounded-2xl border-2 border-dashed border-stone-300/80 bg-white/40 backdrop-blur-xs p-8 hover:border-gold/60 focus:outline-hidden focus:border-gold/80"
              }`}
            >
              {pendingPreview ? (
                <div className="space-y-3 w-full">
                  <div className="relative mx-auto aspect-video max-h-80 w-full overflow-hidden rounded-xl border-2 border-dashed border-gold/50 bg-stone-100 shadow-2xs">
                    {pendingType === "video" ? (
                      <video
                        ref={(el) => {
                          if (el) {
                            el.defaultMuted = true;
                            el.muted = true;
                            el.play().catch(() => {});
                          }
                        }}
                        key={pendingPreview}
                        src={pendingPreview}
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pendingPreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                    {pendingType === "video" && (
                      <span className="absolute top-2.5 left-2.5 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Video
                      </span>
                    )}
                    {/* X button */}
                    <button
                      type="button"
                      onClick={handleClearPending}
                      aria-label="Remove selected file"
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-red-600 transition z-10"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-stone-400">
                    {pendingFile?.name} &bull;{" "}
                    {pendingFile
                      ? (pendingFile.size / 1024 / 1024).toFixed(1)
                      : 0}{" "}
                    MB
                  </p>
                </div>
              ) : bannerUrl ? (
                <div className="space-y-4 w-full">
                  <div className="relative mx-auto aspect-video max-h-80 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-2xs">
                    {bannerType === "video" ? (
                      <video
                        ref={(el) => {
                          if (el) {
                            el.defaultMuted = true;
                            el.muted = true;
                            el.play().catch(() => {});
                          }
                        }}
                        key={bannerUrl}
                        src={bannerUrl}
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                      />
                    ) : imageError ? (
                      <div className="flex flex-col items-center justify-center h-full w-full bg-stone-100 text-stone-400 p-4 text-center">
                        <svg
                          className="w-8 h-8 text-stone-300 mb-1.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs font-medium text-stone-600">
                          Image file not found or failed to load
                        </span>
                        <span className="text-[11px] text-stone-400 mt-0.5">
                          Click &apos;Replace Media&apos; or ✕ to remove
                        </span>
                      </div>
                    ) : isVideoMedia(bannerUrl, bannerType) ? (
                      <video
                        src={bannerUrl}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={bannerUrl}
                        alt={name || "Category banner"}
                        fill
                        unoptimized
                        onError={() => setImageError(true)}
                        className="object-cover"
                      />
                    )}
                    {bannerType === "video" && (
                      <span className="absolute top-2.5 left-2.5 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Video
                      </span>
                    )}
                    {/* X button */}
                    <button
                      type="button"
                      onClick={() => {
                        setBannerUrl("");
                        setBannerType("image");
                        setImageError(false);
                      }}
                      aria-label="Remove media"
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-red-600 transition z-10"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <label className="cursor-pointer rounded-xl bg-stone-100 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200 transition">
                      Replace Media
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/*,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                /* ── Empty dropzone ── */
                <div className="py-6 text-center space-y-2.5">
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/*,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 group-hover:bg-gold/10 group-hover:text-gold transition">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gold group-hover:underline">
                      Choose media file
                    </span>
                    <p className="text-xs text-stone-400 mt-1">
                      or drag and drop here
                    </p>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Image or Video · Max 100MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
