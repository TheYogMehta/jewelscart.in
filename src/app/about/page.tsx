import { buildMetadata } from "@/lib/seo";
import { getPageContent } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import Link from "next/link";

export const revalidate = 60;

export const metadata = buildMetadata({
  title: "About Us",
  description:
    "Learn about JewelsCart: custom handcrafted jewellery, made-to-order bridal and festive pieces, and personalized outfit color matching.",
  path: "/about",
});

export default async function AboutPage() {
  const heroContent = await getPageContent("about");

  return (
    <div className="bg-stone-50/50">
      <PageHero content={heroContent} />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-center shadow-xs">
            <span className="font-display text-2xl font-semibold text-gold sm:text-3xl">
              Made to Order
            </span>
            <h3 className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-900">
              Handcrafted Pieces
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Assembled by local artisans
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-center shadow-xs">
            <span className="font-display text-2xl font-semibold text-gold sm:text-3xl">
              15–20 Days
            </span>
            <h3 className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-900">
              Crafting Timeline
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Dedicated time for custom assembly
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-center shadow-xs">
            <span className="font-display text-2xl font-semibold text-gold sm:text-3xl">
              Color Match
            </span>
            <h3 className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-900">
              Outfit Customization
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Beads & stones matched to your attire
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            What We Do
          </span>
          <h2 className="font-display mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">
            Custom Handcrafted Jewellery for Every Occasion
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
            At JewelsCart, we create handmade jewellery tailored to your
            personal taste. Whether you need a complete bridal set, festive
            accessories, or everyday statement pieces, we assemble each order
            individually and customize the colors to coordinate with your
            outfits.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-8 shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60">
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
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <h3 className="font-display mt-5 text-xl font-semibold text-stone-900">
              Custom Color Matching
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
              Send us a photo or swatch of your saree, lehenga, or dress. Our
              team will hand-select the beads, pearls, and stones to match your
              outfit shades before assembling the piece.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-8 shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-display mt-5 text-xl font-semibold text-stone-900">
              Made to Order (15–20 Days)
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
              We do not mass-produce our items. Each order is individually
              crafted and hand-assembled upon request, allowing us to customize
              dimensions, shades, and details with care.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-8 shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="font-display mt-5 text-xl font-semibold text-stone-900">
              Quality Beads & Stones
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
              We select quality semi-precious stones, glass beads, pearls, and
              sturdy metal findings so your pieces maintain their color, shine,
              and durability across celebrations.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-8 shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="font-display mt-5 text-xl font-semibold text-stone-900">
              Artisan Workshop in India
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
              Based in Mumbai, our workshop brings together skilled karigars and
              women artisans who specialize in traditional and contemporary
              beading, Kundan work, and stone-setting.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200/90 bg-white p-8 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Simple Process
            </span>
            <h2 className="font-display mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">
              How Custom Orders Work
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
              <span className="font-display text-2xl font-semibold text-gold">
                01
              </span>
              <h3 className="mt-2 text-sm font-semibold text-stone-900">
                Choose a Design
              </h3>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Pick a style from our catalogue or send us your inspiration.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
              <span className="font-display text-2xl font-semibold text-gold">
                02
              </span>
              <h3 className="mt-2 text-sm font-semibold text-stone-900">
                Share Outfit Colors
              </h3>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Message us your outfit photos on WhatsApp or our Contact page.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
              <span className="font-display text-2xl font-semibold text-gold">
                03
              </span>
              <h3 className="mt-2 text-sm font-semibold text-stone-900">
                Crafting (15–20 Days)
              </h3>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Our artisans handcraft and assemble your piece to order.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
              <span className="font-display text-2xl font-semibold text-gold">
                04
              </span>
              <h3 className="mt-2 text-sm font-semibold text-stone-900">
                Dispatch & Delivery
              </h3>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Quality checked, securely packaged, and shipped with tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200/90 bg-white px-6 py-10 text-center shadow-xs sm:px-12 sm:py-14">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Direct Assistance
          </span>
          <h2 className="font-display mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">
            Have a Custom Color or Design in Mind?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-xs sm:text-sm text-stone-600 leading-relaxed">
            Reach out to our team directly. We are happy to help with shade
            selection, bridal customization, and sizing before you place your
            order.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/discover"
              className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
            >
              Browse Collections
            </Link>
            <Link
              href="/contact"
              className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
