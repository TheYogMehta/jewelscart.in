import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/ProductCard";
import { PageHero } from "@/components/PageHero";
import { listProducts, type ProductDocument } from "@/lib/products";
import { listCategories, type CategoryDocument } from "@/lib/categories";
import { getPageContent, type PageContent } from "@/lib/content";
import { CategoryCard } from "@/components/CategoryCard";

export const revalidate = 300;

export default async function HomePage() {
  let products: ProductDocument[] = [];
  let categories: CategoryDocument[] = [];
  let content: PageContent = {
    id: 1,
    page_key: "home",
    title: "Where elegance meets craftsmanship",
    subtitle:
      "Explore curated collections of handcrafted, handmade, minimalist and bridal jewellery — designed with elegance for discerning buyers worldwide.",
    badge_text: "Handcrafted in India",
    bg_type: "image",
    updated_at: new Date(),
  };

  try {
    const [p, c, cnt] = await Promise.all([
      listProducts({ limit: 4 }),
      listCategories({ visibleOnly: true, limit: 3 }),
      getPageContent("home"),
    ]);
    products = p.slice(0, 4);
    categories = c;
    if (cnt) content = cnt;
  } catch {
    // DB fallback
  }

  return (
    <div className="space-y-0">
      {/* 1. Hero Section */}
      <PageHero
        content={content}
        primaryCta={{ text: "Explore Catalogue", href: "#collections" }}
        secondaryCta={{ text: "Contact Us", href: "/contact" }}
      />

      {/* 2. Brand Trust & Value Proposition Strip (Moved directly below Hero) */}
      <section className="border-b border-stone-200/80 bg-white py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {/* Value 1: Delivery */}
            <div className="flex items-start gap-4 rounded-2xl bg-stone-50/70 p-4 border border-stone-200/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.875A1.125 1.125 0 0013.125 3.75H3.375A1.125 1.125 0 002.25 4.875v9.375m12-5.625h4.125"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display text-sm font-semibold text-stone-900">
                  Pan-India & Global Express
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Flat ₹99 in Maharashtra, ₹199 Pan-India •{" "}
                  <span className="text-emerald-700 font-medium">
                    Free over ₹5,000 in India only
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Value 2: Artisan Craft */}
            <div className="flex items-start gap-4 rounded-2xl bg-stone-50/70 p-4 border border-stone-200/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display text-sm font-semibold text-stone-900">
                  Artisan Handcrafted
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Generational karigars in Mumbai crafting with heirloom
                  precision and zero-tarnish finish.
                </p>
              </div>
            </div>

            {/* Value 3: Custom Matching */}
            <div className="flex items-start gap-4 rounded-2xl bg-stone-50/70 p-4 border border-stone-200/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display text-sm font-semibold text-stone-900">
                  Custom Color Matching
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tailored to your outfit. Share your color palette or fabric
                  swatch via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Curated Collections Section */}
      {categories.length > 0 && (
        <section
          id="collections"
          className="py-16 lg:py-20 bg-[#faf8f5] border-t border-stone-200/60"
        >
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Curated Collections
                </span>
                <h2 className="font-display mt-1 text-3xl font-semibold text-stone-900 md:text-4xl">
                  Shop by Category
                </h2>
              </div>
              <Link
                href="/discover"
                className="group text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-gold transition-colors flex items-center gap-1.5"
              >
                <span>View All</span>
                <span className="transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 scrollbar-none [&::-webkit-scrollbar]:hidden">
              {categories.map((c, i) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  index={i}
                  className="flex-none w-72 sm:w-auto snap-start"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Latest Products */}
      <section
        id="products"
        className="bg-stone-50/50 py-16 lg:py-20 border-t border-stone-200/80"
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Handcrafted Catalogue
              </span>
              <h2 className="font-display mt-1 text-3xl font-semibold text-stone-900 md:text-4xl">
                Latest Additions
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Fresh bespoke additions from our Mumbai atelier, crafted with
                heirloom precision.
              </p>
            </div>
            <Link
              href="/discover"
              className="group text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-gold transition-colors flex items-center gap-1.5"
            >
              <span>View All</span>
              <span className="transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
          </div>

          <ProductGrid products={products} />
        </div>
      </section>

      {/* 5. Bespoke Atelier Spotlight */}
      <section className="bg-stone-900 text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#b8860b26,transparent_50%)]" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
            Bespoke Jewellery Service
          </span>
          <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl leading-tight">
            Have a Dream Design in Mind?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-stone-300 font-light leading-relaxed">
            Whether it&apos;s matching your bridal lehenga or creating an
            exclusive statement piece, our master artisans craft bespoke
            commissions customized to your exact fabric, gemstone, and metal
            preferences.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-xl bg-gold px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-gold-light transition shadow-xs"
            >
              Enquire
            </Link>
            <a
              href="https://wa.me/919920685652?text=Hi%20JewelsCart,%20I'm%20interested%20in%20a%20custom%20jewellery%20design"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-stone-600 bg-stone-800/80 px-7 py-3 text-xs font-semibold uppercase tracking-wider text-stone-200 hover:bg-stone-700 transition"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* 6. FAQ & Care Guide (Modern Collapsible Accordion) */}
      <section className="border-t border-stone-200 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Client Assistance
            </span>
            <h2 className="font-display mt-1 text-3xl font-semibold text-stone-900 md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Clear guidelines on orders, delivery schedules, and jewellery
              care.
            </p>
          </div>

          <div className="space-y-4">
            <details className="group rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 transition open:bg-white open:shadow-xs">
              <summary className="flex cursor-pointer items-center justify-between font-display text-base font-semibold text-stone-900 list-none">
                <span>How should I care for my handcrafted jewellery?</span>
                <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 group-open:rotate-180 transition-transform">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed pt-2 border-t border-stone-100">
                Avoid direct contact with water, sprays, sanitizers, and strong
                perfumes. Store each piece in a dry, airtight ziplock pouch.
                Normal wear or tarnishing caused by chemical exposure is not
                considered a manufacturing defect.
              </div>
            </details>

            <details className="group rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 transition open:bg-white open:shadow-xs">
              <summary className="flex cursor-pointer items-center justify-between font-display text-base font-semibold text-stone-900 list-none">
                <span>What are the crafting and delivery timelines?</span>
                <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 group-open:rotate-180 transition-transform">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed pt-2 border-t border-stone-100">
                Custom handcrafted pieces require{" "}
                <strong>15–20 business days</strong> for making. Once dispatched
                from Mumbai, delivery takes{" "}
                <strong>2–4 business days across India</strong> (₹99 flat in
                Maharashtra, ₹199 flat Pan-India;{" "}
                <strong className="text-emerald-700">
                  Free above ₹5,000 in India only
                </strong>
                ) and <strong>8–10 business days internationally</strong> with
                end-to-end tracking.
              </div>
            </details>

            <details className="group rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 transition open:bg-white open:shadow-xs">
              <summary className="flex cursor-pointer items-center justify-between font-display text-base font-semibold text-stone-900 list-none">
                <span>Can you customize colors to match my outfit?</span>
                <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 group-open:rotate-180 transition-transform">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed pt-2 border-t border-stone-100">
                Yes! Every handcrafted design can be customized to match your
                bridal or festive outfit. Simply share your color palette,
                fabric swatch, or lehenga photograph with us via WhatsApp or
                Contact, and our artisans will curate the stones and beads
                accordingly.
              </div>
            </details>

            <details className="group rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 transition open:bg-white open:shadow-xs">
              <summary className="flex cursor-pointer items-center justify-between font-display text-base font-semibold text-stone-900 list-none">
                <span>Do you accept returns or refunds?</span>
                <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 group-open:rotate-180 transition-transform">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed pt-2 border-t border-stone-100">
                <strong>
                  No. Because each piece is individually made-to-order and
                  handcrafted, all sales are 100% final.
                </strong>{" "}
                We do not accept returns, refunds, or exchanges. If you have
                questions regarding dimensions, hues, or styling before
                ordering, please message or call us and we will gladly assist
                you.
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
