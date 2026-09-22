"use client";

import Link from "next/link";
import type { CategoryDocument } from "@/lib/categories";

interface Props {
  categorySlug: string;
  categoryName: string;
  categoryImage?: string | null;
  items: CategoryDocument[];
  activeSub?: string;
  activeChild?: string;
  isChildLevel?: boolean;
  parentSubName?: string;
  parentSubSlug?: string;
  totalProductsCount: number;
}

export function SubCategoryCarousel({
  categorySlug,
  categoryName,
  items,
  activeSub,
  activeChild,
  isChildLevel = false,
  parentSubName,
  parentSubSlug,
  totalProductsCount,
}: Props) {
  if (!items || items.length === 0) {
    return null;
  }

  const allCardHref =
    isChildLevel && parentSubSlug
      ? `/category/${categorySlug}/${parentSubSlug}`
      : `/category/${categorySlug}`;

  const isAllActive = isChildLevel ? !activeChild : !activeSub;
  const allLabel =
    isChildLevel && parentSubName
      ? `All ${parentSubName}`
      : `All ${categoryName}`;

  const sectionLabel = isChildLevel
    ? parentSubName
      ? `${parentSubName} Styles`
      : "Curated Styles"
    : "Browse";

  return (
    <div className="py-6">
      {/* Label */}
      <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] uppercase text-stone-400">
        {sectionLabel}
      </p>

      <div className="flex flex-wrap gap-2">
        {/* "All" pill */}
        <Link
          href={allCardHref}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 ${
            isAllActive
              ? "border-gold bg-gold text-white shadow-sm"
              : "border-stone-200 bg-white text-stone-600 hover:border-gold/50 hover:text-stone-900 hover:bg-amber-50/40"
          }`}
        >
          {allLabel}
          {totalProductsCount > 0 && (
            <span
              className={`text-[10px] font-normal ${isAllActive ? "text-white/80" : "text-stone-400"}`}
            >
              {totalProductsCount}
            </span>
          )}
        </Link>

        {/* Sub-category pills */}
        {items.map((item) => {
          const isActive = isChildLevel
            ? activeChild?.toLowerCase() === item.name.toLowerCase() ||
              activeChild?.toLowerCase() === item.slug?.toLowerCase()
            : activeSub?.toLowerCase() === item.name.toLowerCase() ||
              activeSub?.toLowerCase() === item.slug?.toLowerCase();

          const href =
            isChildLevel && parentSubSlug
              ? `/category/${categorySlug}/${parentSubSlug}/${item.slug}`
              : `/category/${categorySlug}/${item.slug}`;

          return (
            <Link
              key={item.slug || item.name}
              href={href}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "border-gold bg-gold text-white shadow-sm"
                  : "border-stone-200 bg-white text-stone-600 hover:border-gold/50 hover:text-stone-900 hover:bg-amber-50/40"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
