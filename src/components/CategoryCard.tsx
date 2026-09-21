import Link from "next/link";
import Image from "next/image";
import type { CategoryDocument } from "@/lib/categories";
import { isVideoMedia } from "@/lib/media";

const GRADIENTS = [
  "from-amber-50 via-yellow-50 to-orange-50",
  "from-rose-50 via-pink-50 to-fuchsia-50",
  "from-teal-50 via-emerald-50 to-cyan-50",
  "from-violet-50 via-purple-50 to-indigo-50",
  "from-amber-50 via-orange-50 to-red-50",
  "from-sky-50 via-blue-50 to-indigo-50",
];

const ACCENT_COLORS = [
  "text-amber-700 bg-amber-100/80",
  "text-rose-700 bg-rose-100/80",
  "text-teal-700 bg-teal-100/80",
  "text-violet-700 bg-violet-100/80",
  "text-orange-700 bg-orange-100/80",
  "text-sky-700 bg-sky-100/80",
];

interface CategoryCardProps {
  category: CategoryDocument;
  index: number;
  className?: string;
}

export function CategoryCard({
  category,
  index,
  className = "",
}: CategoryCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const [accentText] = accent.split(" ");

  return (
    <Link
      href={`/category/${category.slug}`}
      className={`group relative flex flex-col rounded-2xl overflow-hidden border border-stone-200/70 bg-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${className}`}
    >
      <div
        className={`relative h-44 w-full shrink-0 overflow-hidden bg-linear-to-br ${gradient}`}
      >
        {category.banner_url ? (
          isVideoMedia(category.banner_url, category.banner_type) ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={category.banner_url}
            />
          ) : (
            <Image
              src={category.banner_url}
              alt={category.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 288px, (max-width: 1024px) 50vw, 33vw"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className={`absolute inset-0 h-full w-full opacity-20 ${accentText}`}
              viewBox="0 0 200 176"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="100"
                cy="88"
                r="80"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <circle
                cx="100"
                cy="88"
                r="62"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle
                cx="100"
                cy="88"
                r="44"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <circle
                cx="100"
                cy="88"
                r="26"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <line
                x1="100"
                y1="8"
                x2="100"
                y2="168"
                stroke="currentColor"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="88"
                x2="180"
                y2="88"
                stroke="currentColor"
                strokeWidth="0.4"
              />
              <line
                x1="43"
                y1="31"
                x2="157"
                y2="145"
                stroke="currentColor"
                strokeWidth="0.3"
              />
              <line
                x1="157"
                y1="31"
                x2="43"
                y2="145"
                stroke="currentColor"
                strokeWidth="0.3"
              />
              <circle cx="100" cy="8" r="2.5" fill="currentColor" />
              <circle cx="100" cy="168" r="2.5" fill="currentColor" />
              <circle cx="20" cy="88" r="2.5" fill="currentColor" />
              <circle cx="180" cy="88" r="2.5" fill="currentColor" />
            </svg>
            <span
              className={`relative z-10 font-display text-4xl font-light ${accentText}`}
            >
              {category.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-white/70 to-transparent" />
      </div>

      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-stone-900 group-hover:text-gold transition-colors">
              {category.name}
            </h3>
            <svg
              className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-gold group-hover:translate-x-0.5 transition-all duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>

          {category.description && (
            <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {category.children && category.children.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {category.children.slice(0, 3).map((sub) => (
              <span
                key={sub.id}
                className="rounded-full bg-stone-100 border border-stone-200/60 px-2.5 py-0.5 text-[10px] font-medium text-stone-500"
              >
                {sub.name}
              </span>
            ))}
            {category.children.length > 3 && (
              <span className="self-center text-[10px] text-stone-400">
                +{category.children.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
