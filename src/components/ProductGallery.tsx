"use client";

import { useState } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/products";

interface Props {
  media: MediaItem[];
  name: string;
}

export function ProductGallery({ media, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const items =
    media.length > 0
      ? media
      : [{ url: "/placeholder.png", type: "image" as const }];
  const activeItem = items[activeIndex] || items[0];

  return (
    <div className="space-y-4">
      {/* Main Active Media */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 border border-stone-200/80 shadow-2xs">
        {activeItem.type === "video" ? (
          <video
            key={activeItem.url}
            src={activeItem.url}
            controls
            playsInline
            autoPlay
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={activeItem.url}
            alt={`${name} - View ${activeIndex + 1}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}
      </div>

      {/* Thumbnail Strip (if multiple media items) */}
      {items.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {items.map((item, idx) => (
            <button
              key={`${item.url}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                activeIndex === idx
                  ? "border-gold ring-1 ring-gold shadow-xs"
                  : "border-stone-200 opacity-70 hover:opacity-100"
              }`}
            >
              {item.type === "video" ? (
                <div className="relative h-full w-full bg-stone-900 flex items-center justify-center">
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={`${name} thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
