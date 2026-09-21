import Image from "next/image";
import Link from "next/link";
import { PageContent } from "@/lib/content";
import { isVideoMedia } from "@/lib/media";

interface PageHeroProps {
  content: PageContent;
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
}

export function PageHero({ content, primaryCta, secondaryCta }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-stone-900 text-white">
      {isVideoMedia(content.bg_url, content.bg_type) && content.bg_url ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          src={content.bg_url}
        />
      ) : content.bg_url ? (
        <Image
          src={content.bg_url}
          alt={content.title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#b8860b33,transparent_50%)]" />
      )}

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
        {content.badge_text && (
          <p className="font-sans text-xs tracking-[0.2em] text-gold-light uppercase font-medium sm:text-sm">
            {content.badge_text}
          </p>
        )}
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-stone-300 sm:text-lg">
            {content.subtitle}
          </p>
        )}

        {(primaryCta || secondaryCta) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                target={
                  primaryCta.href.startsWith("http") ? "_blank" : undefined
                }
                rel={
                  primaryCta.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
              >
                {primaryCta.text}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                target={
                  secondaryCta.href.startsWith("http") ? "_blank" : undefined
                }
                rel={
                  secondaryCta.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
              >
                {secondaryCta.text}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
