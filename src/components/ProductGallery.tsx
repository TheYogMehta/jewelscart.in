"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/products";

interface Props {
  media: MediaItem[];
  name: string;
}

const SLIDE_DURATION = 5000;

export function ProductGallery({ media, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isDesktopHover, setIsDesktopHover] = useState(false);
  const [isMobileViewerOpen, setIsMobileViewerOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const items =
    media.length > 0
      ? media
      : [{ url: "/placeholder.png", type: "image" as const }];
  const activeItem = items[activeIndex] || items[0];

  useEffect(() => {
    const checkHover = () => {
      setIsDesktopHover(
        window.matchMedia("(hover: hover) and (pointer: fine)").matches,
      );
    };
    checkHover();
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    mq.addEventListener("change", checkHover);
    return () => mq.removeEventListener("change", checkHover);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
    setProgress(0);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    setProgress(0);
  }, [items.length]);

  const selectIndex = (idx: number) => {
    setActiveIndex(idx);
    setProgress(0);
  };

  useEffect(() => {
    if (items.length <= 1 || isPaused || isMobileViewerOpen) return;

    const intervalMs = 40;
    const step = (intervalMs / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [items.length, isPaused, isMobileViewerOpen, handleNext]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
    );
    setZoomOrigin({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleImageClick = () => {
    if (!isDesktopHover && activeItem.type !== "video") {
      setIsMobileViewerOpen(true);
    }
  };

  useEffect(() => {
    if (isMobileViewerOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isMobileViewerOpen]);

  return (
    <>
      <div className="space-y-4">
        {/* Main Active Media */}
        <div
          onMouseEnter={() => {
            if (isDesktopHover) {
              setIsPaused(true);
              setIsHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (isDesktopHover) {
              setIsPaused(false);
              setIsHovered(false);
            }
          }}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 border border-stone-200/80 shadow-2xs select-none touch-pan-y"
        >
          {/* Top Yellow / Gold Progress Bar */}
          {items.length > 1 && (
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 z-30 h-1 bg-stone-900/15"
              aria-hidden="true"
            >
              <div
                className="h-full bg-linear-to-r from-amber-400 via-gold to-amber-500 shadow-[0_0_8px_rgba(201,147,62,0.9)]"
                style={{
                  width: `${progress}%`,
                  transition: isPaused ? "none" : "width 40ms linear",
                }}
              />
            </div>
          )}

          {/* Previous Button (<) */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-stone-800 shadow-md backdrop-blur-xs transition hover:bg-white hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Previous image"
              title="Previous image"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Next Button (>) */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-stone-800 shadow-md backdrop-blur-xs transition hover:bg-white hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Next image"
              title="Next image"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Mobile Image Counter Badge (e.g. 1/4) */}
          {items.length > 1 && (
            <div className="md:hidden absolute bottom-3 right-3 z-20 rounded-full bg-stone-900/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs select-none">
              {activeIndex + 1} / {items.length}
            </div>
          )}

          {/* Media Content */}
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
            <div
              onClick={handleImageClick}
              className={`relative h-full w-full overflow-hidden ${
                isDesktopHover ? "cursor-zoom-in" : "cursor-pointer"
              }`}
            >
              <Image
                src={activeItem.url}
                alt={`${name} - View ${activeIndex + 1}`}
                fill
                priority
                draggable={false}
                className="object-cover select-none pointer-events-none transition-transform duration-200 ease-out"
                style={{
                  transform:
                    isDesktopHover && isHovered ? "scale(1.75)" : "scale(1)",
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                }}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {items.length > 1 && (
          <div className="flex flex-wrap gap-3">
            {items.map((item, idx) => (
              <button
                key={`${item.url}-${idx}`}
                type="button"
                onClick={() => selectIndex(idx)}
                className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer select-none ${
                  activeIndex === idx
                    ? "border-gold ring-1 ring-gold shadow-xs"
                    : "border-stone-200 opacity-70 hover:opacity-100"
                }`}
              >
                {item.type === "video" ? (
                  <div className="relative h-full w-full bg-stone-900 flex items-center justify-center">
                    <video
                      src={item.url}
                      className="h-full w-full object-cover pointer-events-none"
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
                    draggable={false}
                    sizes="64px"
                    className="object-cover select-none pointer-events-none"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clean Mobile Fullscreen Viewer (Opens on Tap on Mobile Only) */}
      {isMobileViewerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none touch-pan-x"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-xs text-stone-400">
              {activeIndex + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={() => setIsMobileViewerOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800/80 text-white active:bg-stone-700 transition"
              aria-label="Close viewer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Full Mobile Image */}
          <div
            onClick={() => setIsMobileViewerOpen(false)}
            className="relative flex-1 flex items-center justify-center p-2"
          >
            <div className="relative w-full h-full max-h-[80vh]">
              <Image
                src={activeItem.url}
                alt={`${name} view`}
                fill
                draggable={false}
                priority
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>

          {/* Mobile Swipe Hint / Thumbnails */}
          {items.length > 1 && (
            <div className="flex items-center justify-center gap-2 pb-6 px-4">
              {items.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  onClick={() => selectIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    activeIndex === idx ? "w-6 bg-gold" : "w-2 bg-stone-600"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
