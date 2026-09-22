import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, type CategoryDocument } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { buildMetadata } from "@/lib/seo";
import { SubCategoryCarousel } from "@/components/SubCategoryCarousel";
import { CategoryHero } from "@/components/CategoryHero";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ sub?: string; child?: string; type?: string }>;
}

async function resolveCategoryRoute(
  slugSegments: string[],
  searchParams: { sub?: string; child?: string; type?: string },
) {
  if (!slugSegments || slugSegments.length === 0) return null;

  const rootSlug = slugSegments[0];
  const rootCategory = await getCategoryBySlug(rootSlug);
  if (!rootCategory) return null;

  let category = rootCategory;
  let matchedSub: CategoryDocument | null = null;
  let matchedChild: CategoryDocument | null = null;

  if (
    slugSegments.length === 1 &&
    rootCategory.parent_id &&
    rootCategory.parent
  ) {
    const parentCat = await getCategoryBySlug(rootCategory.parent.slug);
    if (parentCat) {
      category = parentCat;
      matchedSub = rootCategory;
    }
  }

  if (slugSegments.length >= 2) {
    const subSlug = slugSegments[1].toLowerCase();
    matchedSub =
      category.children?.find(
        (s: CategoryDocument) =>
          s.slug.toLowerCase() === subSlug || s.name.toLowerCase() === subSlug,
      ) || null;
  } else if (!matchedSub) {
    const activeSubName = searchParams.sub || searchParams.type;
    if (activeSubName) {
      matchedSub =
        category.children?.find(
          (s: CategoryDocument) =>
            s.name.toLowerCase() === activeSubName.toLowerCase() ||
            s.slug.toLowerCase() === activeSubName.toLowerCase(),
        ) || null;
    }
  }

  if (slugSegments.length >= 3 && matchedSub) {
    const childSlug = slugSegments[2].toLowerCase();
    matchedChild =
      matchedSub.children?.find(
        (c: CategoryDocument) =>
          c.slug.toLowerCase() === childSlug ||
          c.name.toLowerCase() === childSlug,
      ) || null;
  } else if (!matchedChild && matchedSub) {
    const activeChildName = searchParams.child;
    if (activeChildName) {
      matchedChild =
        matchedSub.children?.find(
          (c: CategoryDocument) =>
            c.name.toLowerCase() === activeChildName.toLowerCase() ||
            c.slug.toLowerCase() === activeChildName.toLowerCase(),
        ) || null;
    }
  }

  return { category, matchedSub, matchedChild };
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const resolved = await resolveCategoryRoute(slug, sp);
  if (!resolved) {
    return buildMetadata({
      title: "Category Not Found",
      description: "The requested category could not be located.",
      noIndex: true,
    });
  }

  const { category, matchedSub, matchedChild } = resolved;

  const title = matchedChild
    ? `${matchedChild.name} - ${matchedSub?.name || category.name} Jewellery | JewelsCart`
    : matchedSub
      ? `${matchedSub.name} - ${category.name} Jewellery | JewelsCart`
      : `${category.name} Jewellery | JewelsCart`;

  const description =
    matchedChild?.description ||
    matchedSub?.description ||
    category.description ||
    `Explore handcrafted ${category.name} by JewelsCart.`;

  const canonicalPath = matchedChild
    ? `/category/${category.slug}/${matchedSub?.slug}/${matchedChild.slug}`
    : matchedSub
      ? `/category/${category.slug}/${matchedSub.slug}`
      : `/category/${category.slug}`;

  return buildMetadata({
    title,
    description,
    path: canonicalPath,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const resolved = await resolveCategoryRoute(slug, sp);
  if (!resolved) {
    notFound();
  }

  const { category, matchedSub, matchedChild } = resolved;

  const activeFilterName =
    matchedChild?.name || matchedSub?.name || sp.child || sp.sub || sp.type;

  const heroTitle = matchedChild?.name || matchedSub?.name || category.name;
  const heroSubtitle =
    matchedChild?.description ||
    matchedSub?.description ||
    category.description ||
    "Where elegance meets craftsmanship. Discover heirloom designs created for unforgettable moments.";

  const bannerUrl =
    matchedChild?.banner_url || matchedSub?.banner_url || category.banner_url;
  const bannerType = matchedChild?.banner_url
    ? matchedChild.banner_type || "image"
    : matchedSub?.banner_url
      ? matchedSub.banner_type || "image"
      : category.banner_type || "image";

  const allCategoryProducts = await listProducts({ category: category.name });

  const filteredProducts = matchedChild
    ? allCategoryProducts.filter(
        (p) =>
          p.child_category?.toLowerCase() === matchedChild.name.toLowerCase() ||
          p.type?.toLowerCase() === matchedChild.name.toLowerCase(),
      )
    : matchedSub
      ? allCategoryProducts.filter(
          (p) =>
            p.sub_category?.toLowerCase() === matchedSub.name.toLowerCase() ||
            p.type?.toLowerCase() === matchedSub.name.toLowerCase() ||
            (matchedSub.children &&
              matchedSub.children.some(
                (c: CategoryDocument) =>
                  p.child_category?.toLowerCase() === c.name.toLowerCase() ||
                  p.type?.toLowerCase() === c.name.toLowerCase(),
              )),
        )
      : allCategoryProducts;

  const hasSubCategories = category.children && category.children.length > 0;
  const showChildCarousel =
    matchedSub && matchedSub.children && matchedSub.children.length > 0;
  const carouselItems = (
    showChildCarousel ? matchedSub.children! : category.children || []
  ).filter((item: CategoryDocument) => item.is_visible);

  const breadcrumbs = [
    {
      label: category.name,
      href: matchedSub ? `/category/${category.slug}` : undefined,
    },
    ...(matchedSub
      ? [
          {
            label: matchedSub.name,
            href: matchedChild
              ? `/category/${category.slug}/${matchedSub.slug}`
              : undefined,
          },
        ]
      : []),
    ...(matchedChild
      ? [
          {
            label: matchedChild.name,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <CategoryHero
        breadcrumbs={breadcrumbs}
        badge={
          matchedChild
            ? `${category.name} / ${matchedSub?.name} / ${matchedChild.name}`
            : matchedSub
              ? `${category.name} / ${matchedSub.name}`
              : category.name
        }
        title={heroTitle}
        subtitle={heroSubtitle}
        bannerUrl={bannerUrl || undefined}
        bannerType={bannerType as "image" | "video"}
        clampSubtitle
      />

      <section
        id="collection-grid"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        {(showChildCarousel || hasSubCategories) && (
          <SubCategoryCarousel
            categorySlug={category.slug}
            categoryName={category.name}
            categoryImage={category.banner_url}
            items={carouselItems}
            activeSub={matchedSub?.name}
            activeChild={matchedChild?.name}
            isChildLevel={Boolean(showChildCarousel)}
            parentSubName={matchedSub?.name}
            parentSubSlug={matchedSub?.slug}
            totalProductsCount={
              showChildCarousel
                ? allCategoryProducts.filter(
                    (p) =>
                      p.sub_category?.toLowerCase() ===
                      matchedSub.name.toLowerCase(),
                  ).length
                : allCategoryProducts.length
            }
          />
        )}

        <div className="mb-8 flex items-center justify-between border-t border-stone-100 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
            {activeFilterName ? `${activeFilterName}` : category.name}
          </p>
          <p className="text-xs text-stone-400">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-6 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-300">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-display text-xl font-medium text-stone-900">
              No pieces in this curation yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
              {activeFilterName
                ? `No pieces listed under "${activeFilterName}" right now. Try another filter or browse all ${category.name}.`
                : `We're crafting new pieces for ${category.name}. Contact us for custom orders.`}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {activeFilterName && (
                <Link
                  href={`/category/${category.slug}`}
                  className="rounded-full bg-stone-900 px-5 py-2 text-xs font-medium text-white transition hover:bg-stone-800"
                >
                  All {category.name}
                </Link>
              )}
              <Link
                href="/discover"
                className="rounded-full border border-stone-200 px-5 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
              >
                All Categories
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
