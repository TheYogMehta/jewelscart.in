"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductDocument, MediaItem } from "@/lib/products";
import type { CategoryPathOption } from "@/lib/categories";

interface Props {
  initialProduct?: ProductDocument;
  isEdit?: boolean;
}

interface NewMediaFile {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

const MAX_PRODUCT_WORDS = 5000;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function ProductForm({ initialProduct, isEdit = false }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialProduct?.name || "");
  const [description, setDescription] = useState(
    initialProduct?.description || "",
  );
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 112)}px`;
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

  const [category, setCategory] = useState(initialProduct?.category || "");
  const [subCategory, setSubCategory] = useState(
    initialProduct?.sub_category || initialProduct?.type || "",
  );
  const [childCategory, setChildCategory] = useState(
    initialProduct?.child_category || "",
  );

  const [price, setPrice] = useState<string>(
    initialProduct?.price != null ? String(initialProduct.price) : "",
  );
  const [qty, setQty] = useState<string>(
    initialProduct?.qty != null ? String(initialProduct.qty) : "0",
  );
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [stockStatus, setStockStatus] = useState(
    initialProduct?.stock_status || "out_of_stock",
  );

  const [length, setLength] = useState(initialProduct?.length || "");
  const [weight, setWeight] = useState(initialProduct?.weight || "");

  const [existingMedia, setExistingMedia] = useState<MediaItem[]>(() => {
    if (initialProduct?.media && initialProduct.media.length > 0) {
      return initialProduct.media;
    }
    if (initialProduct?.image) {
      return [{ url: initialProduct.image, type: "image" }];
    }
    return [];
  });
  const [newMediaFiles, setNewMediaFiles] = useState<NewMediaFile[]>([]);

  const [categoryPaths, setCategoryPaths] = useState<CategoryPathOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const initialCategoryPath = [
    initialProduct?.category,
    initialProduct?.sub_category || initialProduct?.type,
    initialProduct?.child_category,
  ]
    .filter(Boolean)
    .join(" > ");

  const [categorySearchQuery, setCategorySearchQuery] =
    useState(initialCategoryPath);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchError, setCategorySearchError] = useState<string | null>(
    null,
  );
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState(-1);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch("/api/categories?paths=true")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load category paths");
        return res.json();
      })
      .then((data: CategoryPathOption[]) => {
        setCategoryPaths(data);
        if (initialProduct?.category) {
          const currentBuilt = [
            initialProduct.category,
            initialProduct.sub_category || initialProduct.type,
            initialProduct.child_category,
          ]
            .filter(Boolean)
            .join(" > ");

          const match =
            data.find(
              (p) => p.path.toLowerCase() === currentBuilt.toLowerCase(),
            ) ||
            data.find(
              (p) =>
                p.category.toLowerCase() ===
                  initialProduct.category.toLowerCase() &&
                (!initialProduct.sub_category ||
                  (p.sub_category &&
                    p.sub_category.toLowerCase() ===
                      (
                        initialProduct.sub_category ||
                        initialProduct.type ||
                        ""
                      ).toLowerCase())),
            );

          if (match) {
            setCategory(match.category);
            setSubCategory(match.sub_category || "");
            setChildCategory(match.child_category || "");
            setCategorySearchQuery(match.path);
          }
        }
      })
      .catch(() => setError("Failed to load categories from database"))
      .finally(() => setLoadingCategories(false));

    if (!isEdit && !sku) {
      fetch("/api/products/next-sku")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.sku) {
            setSku(data.sku);
          }
        })
        .catch(() => {});
    }
  }, [
    isEdit,
    sku,
    initialProduct?.category,
    initialProduct?.sub_category,
    initialProduct?.type,
    initialProduct?.child_category,
  ]);

  const currentPath = [category, subCategory, childCategory]
    .filter(Boolean)
    .join(" > ");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setCategoryDropdownOpen(false);

        const trimmed = categorySearchQuery.trim();
        if (!trimmed) {
          setCategory("");
          setSubCategory("");
          setChildCategory("");
          setCategorySearchError(null);
        } else {
          const exactPath = categoryPaths.find(
            (p) => p.path.toLowerCase() === trimmed.toLowerCase(),
          );
          if (exactPath) {
            setCategory(exactPath.category);
            setSubCategory(exactPath.sub_category || "");
            setChildCategory(exactPath.child_category || "");
            setCategorySearchQuery(exactPath.path);
            setCategorySearchError(null);
          } else {
            const exactNameMatches = categoryPaths.filter(
              (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
            );
            if (exactNameMatches.length === 1) {
              const match = exactNameMatches[0];
              setCategory(match.category);
              setSubCategory(match.sub_category || "");
              setChildCategory(match.child_category || "");
              setCategorySearchQuery(match.path);
              setCategorySearchError(null);
            } else {
              setCategory("");
              setSubCategory("");
              setChildCategory("");
              setCategorySearchError(
                `Category "${trimmed}" does not exist. Please select a valid category from the list.`,
              );
            }
          }
        }
      }
    }
    if (categoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryDropdownOpen, categorySearchQuery, categoryPaths]);

  const handleSelectCategory = (opt: CategoryPathOption) => {
    setCategory(opt.category);
    setSubCategory(opt.sub_category || "");
    setChildCategory(opt.child_category || "");
    setCategorySearchQuery(opt.path);
    setCategorySearchError(null);
    setCategoryDropdownOpen(false);
    setHighlightedCategoryIndex(-1);
  };

  const handleClearCategorySearch = () => {
    setCategory("");
    setSubCategory("");
    setChildCategory("");
    setCategorySearchQuery("");
    setCategorySearchError(null);
    setCategoryDropdownOpen(true);
    setHighlightedCategoryIndex(-1);
    categoryInputRef.current?.focus();
  };

  const query = categorySearchQuery.trim().toLowerCase();
  const isExactCurrentSelection = Boolean(
    currentPath && query === currentPath.toLowerCase(),
  );

  const filteredCategories =
    query === "" || isExactCurrentSelection
      ? categoryPaths
      : categoryPaths.filter((p) => {
          const path = (p.path || "").toLowerCase();
          const name = (p.name || "").toLowerCase();
          const cat = (p.category || "").toLowerCase();
          const sub = (p.sub_category || "").toLowerCase();
          const child = (p.child_category || "").toLowerCase();
          return (
            path.includes(query) ||
            name.includes(query) ||
            cat.includes(query) ||
            sub.includes(query) ||
            child.includes(query)
          );
        });

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!categoryDropdownOpen) {
        setCategoryDropdownOpen(true);
        setHighlightedCategoryIndex(0);
      } else {
        setHighlightedCategoryIndex((prev) =>
          prev < filteredCategories.length - 1 ? prev + 1 : 0,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!categoryDropdownOpen) {
        setCategoryDropdownOpen(true);
        setHighlightedCategoryIndex(filteredCategories.length - 1);
      } else {
        setHighlightedCategoryIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCategories.length - 1,
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = categorySearchQuery.trim();
      if (
        categoryDropdownOpen &&
        highlightedCategoryIndex >= 0 &&
        highlightedCategoryIndex < filteredCategories.length
      ) {
        handleSelectCategory(filteredCategories[highlightedCategoryIndex]);
      } else if (filteredCategories.length === 1) {
        handleSelectCategory(filteredCategories[0]);
      } else {
        const exactPath = categoryPaths.find(
          (p) => p.path.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exactPath) {
          handleSelectCategory(exactPath);
        } else {
          const nameMatches = categoryPaths.filter(
            (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
          );
          if (nameMatches.length === 1) {
            handleSelectCategory(nameMatches[0]);
          } else {
            setCategory("");
            setSubCategory("");
            setChildCategory("");
            setCategorySearchError(
              `Category "${trimmed}" does not exist. Please select a valid category from the list.`,
            );
            setCategoryDropdownOpen(false);
          }
        }
      }
    } else if (e.key === "Escape") {
      setCategoryDropdownOpen(false);
      if (currentPath) {
        setCategorySearchQuery(currentPath);
        setCategorySearchError(null);
      }
    }
  };

  const totalMediaCount = existingMedia.length + newMediaFiles.length;

  const handleFilesSelect = (files: FileList | File[]) => {
    setError(null);
    const remainingSlots = 5 - totalMediaCount;
    if (remainingSlots <= 0) {
      setError("Maximum 5 media items allowed.");
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newItems: NewMediaFile[] = [];

    for (const file of filesToAdd) {
      const isImg = file.type.startsWith("image/");
      const isVid =
        file.type.startsWith("video/") ||
        /\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name);

      if (!isImg && !isVid) {
        setError(
          `File "${file.name}" is not a supported image or video format.`,
        );
        continue;
      }

      if (file.size > 100 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 100MB limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl,
        type: isVid ? "video" : "image",
      });
    }

    if (newItems.length > 0) {
      setNewMediaFiles((prev) => [...prev, ...newItems]);
    }
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewMedia = (id: string) => {
    setNewMediaFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product title is required.");
      return;
    }

    const trimmedCat = categorySearchQuery.trim();
    if (!trimmedCat || !category.trim()) {
      const msg = "Please select a valid category from the list.";
      setError(msg);
      setCategorySearchError(msg);
      categoryInputRef.current?.focus();
      return;
    }

    const exactMatch = categoryPaths.find(
      (p) =>
        p.path.toLowerCase() === trimmedCat.toLowerCase() ||
        (p.category.toLowerCase() === category.toLowerCase() &&
          p.path.toLowerCase() === currentPath.toLowerCase()),
    );

    if (!exactMatch) {
      const msg = `Category "${trimmedCat}" does not exist. Please select a valid category from the list.`;
      setError(msg);
      setCategorySearchError(msg);
      categoryInputRef.current?.focus();
      return;
    }

    if (totalMediaCount === 0) {
      setError("At least one product image or video is required.");
      return;
    }

    if (totalMediaCount > 5) {
      setError("Maximum 5 media items allowed.");
      return;
    }

    if (countWords(description) > MAX_PRODUCT_WORDS) {
      setError(
        `Description cannot exceed ${MAX_PRODUCT_WORDS} words (currently ${countWords(description)} words).`,
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (description.trim())
        formData.append("description", description.trim());
      formData.append("category", category.trim());
      if (subCategory.trim()) {
        formData.append("sub_category", subCategory.trim());
        formData.append("type", childCategory.trim() || subCategory.trim());
      }
      if (childCategory.trim()) {
        formData.append("child_category", childCategory.trim());
      }
      if (sku.trim()) formData.append("sku", sku.trim());
      if (price.trim()) formData.append("price", price.trim());
      if (qty.trim()) formData.append("qty", qty.trim());
      if (length.trim()) formData.append("length", length.trim());
      if (weight.trim()) formData.append("weight", weight.trim());
      formData.append("stock_status", stockStatus);

      if (isEdit) {
        formData.append("existing_media", JSON.stringify(existingMedia));
      }

      for (const item of newMediaFiles) {
        formData.append("media", item.file);
      }

      const url = isEdit
        ? `/api/products/${initialProduct?.id || initialProduct?._id}`
        : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while saving the product.",
      );
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const prodId = initialProduct?.id || initialProduct?._id;
    if (!prodId) return;
    if (
      !confirm(
        `Are you sure you want to delete "${initialProduct?.name}"? This cannot be undone.`,
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${prodId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setLoading(false);
    }
  };

  const primaryMedia =
    existingMedia[0] ||
    (newMediaFiles[0]
      ? { url: newMediaFiles[0].previewUrl, type: newMediaFiles[0].type }
      : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link href="/admin/products" className="hover:text-gold transition">
              Products
            </Link>
            <span>/</span>
            <span className="text-stone-800 font-medium">
              {isEdit ? "Edit Product" : "New Product"}
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            {isEdit ? `Edit "${initialProduct?.name}"` : "Add New Product"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Publish jewellery with up to 5 images or videos, pricing,
            dimensions, and inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100 transition shadow-2xs"
            >
              Delete Product
            </button>
          )}
          <Link
            href="/admin/products"
            className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-xl bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-gold-light disabled:opacity-50 transition"
          >
            {loading
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Publish Product"}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2 divide-y divide-stone-200/70">
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              Basic Information
            </h2>

            <div>
              <label className="block text-xs font-medium text-stone-700">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kundan Choker Necklace Set with Earrings"
                required
                className="mt-1.5 block w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
              {name.trim() && (
                <p className="mt-1 text-[11px] font-mono text-stone-400 truncate">
                  Slug: /products/
                  {name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-700">
                  Description
                </label>
                <div className="text-[11px] font-mono">
                  <span
                    className={
                      countWords(description) > MAX_PRODUCT_WORDS
                        ? "text-red-500 font-semibold"
                        : countWords(description) >= MAX_PRODUCT_WORDS * 0.9
                          ? "text-amber-500 font-medium"
                          : "text-stone-400"
                    }
                  >
                    {countWords(description)} / {MAX_PRODUCT_WORDS} words
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
                rows={4}
                placeholder="Describe the craftsmanship, design, styling advice, and details..."
                className="mt-1.5 block w-full resize-none overflow-hidden rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-[height] duration-75"
                style={{ minHeight: "112px" }}
              />
              {countWords(description) > MAX_PRODUCT_WORDS && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  Description exceeds the maximum limit of {MAX_PRODUCT_WORDS}{" "}
                  words. Please shorten your text before saving.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Catalogue Placement <span className="text-red-500">*</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select the category, sub-category, or style for this piece.
                </p>
              </div>

              <Link
                href="/admin/categories"
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
              >
                <span>Category Manager</span>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </Link>
            </div>

            <div>
              {loadingCategories ? (
                <div className="mt-1.5 h-10 w-full animate-pulse rounded-xl bg-stone-100" />
              ) : categoryPaths.length === 0 ? (
                <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  No categories found.{" "}
                  <Link
                    href="/admin/categories"
                    className="font-semibold underline text-amber-900"
                  >
                    Create a category first
                  </Link>
                  .
                </div>
              ) : (
                <div ref={categoryDropdownRef} className="relative mt-1.5">
                  <div className="relative flex items-center">
                    <input
                      ref={categoryInputRef}
                      type="text"
                      value={categorySearchQuery}
                      onChange={(e) => {
                        setCategorySearchQuery(e.target.value);
                        setCategorySearchError(null);
                        setCategoryDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setCategoryDropdownOpen(true);
                      }}
                      onKeyDown={handleCategoryKeyDown}
                      placeholder="Type to search category or placement..."
                      className={`min-h-10.5 w-full rounded-xl border bg-white pl-3.5 pr-16 text-sm text-stone-900 transition focus:outline-none focus:ring-1 ${
                        categorySearchError
                          ? "border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-500 focus:ring-red-500"
                          : categoryDropdownOpen
                            ? "border-gold ring-1 ring-gold"
                            : "border-stone-200 hover:border-stone-300"
                      }`}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      {categorySearchQuery && (
                        <button
                          type="button"
                          onClick={handleClearCategorySearch}
                          aria-label="Clear category selection"
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
                        onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                        aria-label="Toggle categories list"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 transition"
                      >
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${
                            categoryDropdownOpen ? "rotate-180 text-gold" : ""
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

                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-full max-h-64 overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((p, idx) => {
                          const isSelected = currentPath === p.path;
                          const isHighlighted =
                            idx === highlightedCategoryIndex;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectCategory(p)}
                              onMouseEnter={() =>
                                setHighlightedCategoryIndex(idx)
                              }
                              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition text-left ${
                                isSelected
                                  ? "bg-amber-50/70 text-gold font-semibold"
                                  : isHighlighted
                                    ? "bg-stone-100 text-stone-900"
                                    : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                              }`}
                            >
                              <span className="truncate">{p.path}</span>
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
                      ) : (
                        <div className="px-3.5 py-3 text-center text-xs text-stone-500">
                          No category found matching &ldquo;
                          <span className="font-semibold text-stone-700">
                            {categorySearchQuery}
                          </span>
                          &rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {categorySearchError && (
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
                  <span>{categorySearchError}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              Pricing, Inventory & Specifications
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Price */}
              <div>
                <label className="block text-xs font-medium text-stone-700">
                  Price (₹)
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3.5 top-2.5 text-sm text-stone-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1499"
                    min="0"
                    step="1"
                    className="block w-full rounded-xl border border-stone-200 pl-8 pr-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700">
                  Quantity in Stock
                </label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="mt-1.5 block w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700">
                  SKU (Auto-Generated / Editable)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. JC-0001"
                  className="mt-1.5 block w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 placeholder:font-sans focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-stone-700">
                  Length / Dimensions
                </label>
                <input
                  type="text"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="e.g. 18 inches, 45 cm"
                  className="mt-1.5 block w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700">
                  Weight
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 45g, 12g"
                  className="mt-1.5 block w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700">
                  Availability Status
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="in_stock">In Stock (Ready to Ship)</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Product Media ({totalMediaCount} / 5)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Upload up to 5 images or videos (MP4/WebM/MOV). Max 100MB per
                  file.
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  totalMediaCount === 5
                    ? "bg-amber-100 text-amber-800"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {5 - totalMediaCount} slots remaining
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {existingMedia.map((item, idx) => (
                <div
                  key={`existing-${idx}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-2xs"
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`Product media ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}

                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {idx === 0 && (
                      <span className="rounded-md bg-stone-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                        Primary
                      </span>
                    )}
                    {item.type === "video" && (
                      <span className="rounded-md bg-gold/90 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                        Video
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeExistingMedia(idx)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white shadow-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                    title="Remove media"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {newMediaFiles.map((item, idx) => {
                const totalIndex = existingMedia.length + idx;
                return (
                  <div
                    key={item.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border-2 border-gold/50 bg-stone-100 shadow-2xs"
                  >
                    {item.type === "video" ? (
                      <video
                        src={item.previewUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={item.previewUrl}
                        alt="New upload"
                        className="h-full w-full object-cover"
                      />
                    )}

                    {/* Badges */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                      {totalIndex === 0 && (
                        <span className="rounded-md bg-stone-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                          Primary
                        </span>
                      )}
                      {item.type === "video" && (
                        <span className="rounded-md bg-gold/90 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                          Video
                        </span>
                      )}
                      <span className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        New
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeNewMedia(item.id)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white shadow-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                      title="Remove media"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}

              {totalMediaCount < 5 && (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.length) {
                      handleFilesSelect(e.dataTransfer.files);
                    }
                  }}
                  className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition ${
                    dragOver
                      ? "border-gold bg-gold/5"
                      : "border-stone-300 bg-stone-50/50 hover:border-gold/60 hover:bg-stone-50"
                  }`}
                >
                  <svg
                    className="h-6 w-6 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span className="mt-1 text-[11px] font-medium text-stone-600">
                    Add Media
                  </span>
                  <span className="text-[9px] text-stone-400">
                    Image or Video
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleFilesSelect(e.target.files);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                Storefront Preview
              </span>
              <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-[10px] font-medium text-stone-700 capitalize">
                {stockStatus.replace(/_/g, " ")}
              </span>
            </div>

            {/* Thumbnail */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
              {primaryMedia ? (
                primaryMedia.type === "video" ? (
                  <video
                    src={primaryMedia.url}
                    className="h-full w-full object-cover"
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryMedia.url}
                    alt={name || "Product preview"}
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                  No media uploaded
                </div>
              )}

              {totalMediaCount > 1 && (
                <span className="absolute bottom-2 right-2 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {totalMediaCount} Media Items
                </span>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2">
              <p className="font-display text-base font-semibold text-stone-900 leading-snug line-clamp-2">
                {name || "Untitled Product"}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-stone-200/70 px-2.5 py-0.5 text-[10px] font-medium text-stone-700">
                  {category || "Uncategorized"}
                </span>
                {subCategory && (
                  <span className="text-[11px] text-stone-500">
                    • {subCategory}
                  </span>
                )}
                {childCategory && (
                  <span className="text-[11px] text-stone-500">
                    › {childCategory}
                  </span>
                )}
              </div>

              {/* Price & Qty */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  {parseFloat(price) > 0 ? (
                    <span className="font-display text-lg font-semibold text-stone-900">
                      ₹{parseFloat(price).toLocaleString("en-IN")} /-
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-stone-500">
                      Price on Request
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500">
                  Qty: {qty || 0} in stock
                </span>
              </div>

              {/* SKU */}
              {sku && (
                <div className="pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 font-mono">
                  SKU: {sku}
                </div>
              )}

              {/* Physical Specs */}
              {(length || weight) && (
                <div className="space-y-1 text-[11px] text-stone-600">
                  {length && (
                    <div>
                      <span className="text-stone-400">Length: </span>
                      <span className="font-medium text-stone-800">
                        {length}
                      </span>
                    </div>
                  )}
                  {weight && (
                    <div>
                      <span className="text-stone-400">Weight: </span>
                      <span className="font-medium text-stone-800">
                        {weight}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
