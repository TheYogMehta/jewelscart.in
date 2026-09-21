import Link from "next/link";
import { listCategories } from "@/lib/categories";
import { buildMetadata } from "@/lib/seo";
import { CategoryHero } from "@/components/CategoryHero";
import { CategoryCard } from "@/components/CategoryCard";

export const revalidate = 60;

export const metadata = buildMetadata({
  title: "Discover Collections & Categories | JewelsCart",
  description:
    "Explore our full spectrum of handcrafted jewellery categories, custom designs, and artisan collections.",
  path: "/discover",
});

export default async function DiscoverPage() {
  const categories = await listCategories({ showInHeaderOnly: true });

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <CategoryHero
        badge="Handcrafted in Mumbai"
        title="All Collections"
        subtitle="Browse every category of handcrafted jewellery — from statement earrings to full bridal sets."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Curated Collections
          </span>
          <h2 className="font-display mt-1 text-3xl font-semibold text-stone-900 md:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Explore our handcrafted collections designed with heirloom precision
            and elegance.
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-24 text-center">
            <h3 className="font-display text-2xl font-semibold text-stone-900">
              Curating Collections
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              Our master jewellers are organizing our boutique collections.
              Please check back shortly or explore our complete catalogue.
            </p>
            <div className="mt-6">
              <Link
                href="/#products"
                className="rounded-full bg-stone-900 px-6 py-2.5 text-xs font-medium tracking-wider text-white uppercase transition hover:bg-stone-800"
              >
                Browse All Jewellery
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
