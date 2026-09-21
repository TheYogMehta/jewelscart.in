import Image from "next/image";
import Link from "next/link";
import { isVideoMedia } from "@/lib/media";

export interface CategoryHeroBreadcrumb {
  label: string;
  href?: string;
}

interface CategoryHeroProps {
  badge?: string;
  breadcrumbs?: CategoryHeroBreadcrumb[];
  title: string;
  subtitle?: string;
  bannerUrl?: string;
  bannerType?: "image" | "video";
  clampSubtitle?: boolean;
}

function RingMotif() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,#b8860b22,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_100%,#92400e18,transparent_55%)]" />
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 h-115 w-115 opacity-[0.07] text-gold"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="200"
          cy="200"
          r="190"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx="200"
          cy="200"
          r="155"
          stroke="currentColor"
          strokeWidth="0.6"
        />
        <circle
          cx="200"
          cy="200"
          r="118"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx="200"
          cy="200"
          r="80"
          stroke="currentColor"
          strokeWidth="0.6"
        />
        <circle
          cx="200"
          cy="200"
          r="42"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="200"
          y1="10"
          x2="200"
          y2="390"
          stroke="currentColor"
          strokeWidth="0.4"
        />
        <line
          x1="10"
          y1="200"
          x2="390"
          y2="200"
          stroke="currentColor"
          strokeWidth="0.4"
        />
        <line
          x1="55"
          y1="55"
          x2="345"
          y2="345"
          stroke="currentColor"
          strokeWidth="0.3"
        />
        <line
          x1="345"
          y1="55"
          x2="55"
          y2="345"
          stroke="currentColor"
          strokeWidth="0.3"
        />
        <circle cx="200" cy="10" r="3" fill="currentColor" />
        <circle cx="200" cy="390" r="3" fill="currentColor" />
        <circle cx="10" cy="200" r="3" fill="currentColor" />
        <circle cx="390" cy="200" r="3" fill="currentColor" />
        <circle cx="200" cy="200" r="6" fill="currentColor" opacity="0.5" />
      </svg>
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 h-80 w-80 opacity-[0.04] text-amber-300"
        viewBox="0 0 300 300"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="150"
          cy="150"
          r="140"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="150"
          cy="150"
          r="100"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <circle
          cx="150"
          cy="150"
          r="60"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="150" cy="150" r="20" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  );
}

export function CategoryHero({
  badge,
  breadcrumbs,
  title,
  subtitle,
  bannerUrl,
  bannerType = "image",
  clampSubtitle = false,
}: CategoryHeroProps) {
  return (
    <section className="relative overflow-hidden bg-stone-900 text-white">
      {isVideoMedia(bannerUrl, bannerType) && bannerUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src={bannerUrl}
        />
      ) : bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
      ) : (
        <RingMotif />
      )}

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="font-sans text-xs tracking-[0.2em] text-gold-light uppercase font-medium sm:text-sm"
          >
            <ol className="inline-flex flex-wrap items-center justify-center gap-2">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={idx} className="inline-flex items-center gap-2">
                    {idx > 0 && (
                      <span className="opacity-60" aria-hidden="true">
                        /
                      </span>
                    )}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="transition-colors hover:text-white hover:underline focus:outline-hidden focus:text-white"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className={isLast ? "text-gold" : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : badge ? (
          <p className="font-sans text-xs tracking-[0.2em] text-gold-light uppercase font-medium sm:text-sm">
            {badge}
          </p>
        ) : null}
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p
            className={`mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-stone-300 sm:text-lg${
              clampSubtitle ? " line-clamp-2" : ""
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
