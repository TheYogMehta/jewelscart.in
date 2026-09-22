import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { getProductBySlug } from "@/lib/products";
import { buildMetadata, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { safeJsonLd } from "@/lib/security";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.type
    ? `${product.name} ${product.type} Jewellery`
    : `${product.name} Jewellery | JewelsCart`;
  const description =
    product.description ??
    (product.type
      ? `${product.name} ${product.type} ${product.category} jewellery from JewelsCart. Handcrafted with exquisite artistry.`
      : `${product.name} ${product.category} jewellery from JewelsCart. Handcrafted with exquisite artistry.`);

  return buildMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image: product.image,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/&/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Discover", href: "/discover" },
  ];

  let currentCategoryPath = "/category";

  if (product.category) {
    currentCategoryPath += `/${toSlug(product.category)}`;
    breadcrumbItems.push({
      label: product.category,
      href: currentCategoryPath,
    });
  }

  if (product.sub_category) {
    currentCategoryPath += `/${toSlug(product.sub_category)}`;
    breadcrumbItems.push({
      label: product.sub_category,
      href: currentCategoryPath,
    });
  }

  if (product.child_category) {
    currentCategoryPath += `/${toSlug(product.child_category)}`;
    breadcrumbItems.push({
      label: product.child_category,
      href: currentCategoryPath,
    });
  }

  breadcrumbItems.push({ label: product.name });

  const breadcrumbs = breadcrumbJsonLd(
    breadcrumbItems.map((item) => ({
      name: item.label,
      path: item.href || `/products/${product.slug}`,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd(product)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />

      <article className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery media={product.media} name={product.name} />

          <div>
            <div className="flex items-center gap-3">
              {product.type && (
                <p className="text-sm uppercase tracking-wide text-gold">
                  {product.type}
                </p>
              )}
              {product.stock_status && product.stock_status !== "in_stock" && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600 border border-red-200">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="font-display mt-2 text-4xl font-semibold text-stone-900">
              {product.name}
            </h1>

            {product.price != null && (
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-2xl font-semibold text-stone-900">
                  ₹{product.price.toLocaleString("en-IN")} /-
                </span>
                <span className="text-xs font-normal text-stone-400">
                  (Inclusive of all taxes)
                </span>
              </div>
            )}

            {product.sku && (
              <p className="mt-2 text-xs font-mono text-stone-400">
                SKU: {product.sku}
              </p>
            )}

            {product.price != null && (
              <div className="mt-6 border-y border-stone-200/80 py-5">
                <AddToCartButton
                  product={{
                    id: String(product._id || product.id),
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    type: product.type,
                    category: product.category,
                    sku: product.sku,
                    qty: product.qty,
                    stock_status: product.stock_status,
                  }}
                />
              </div>
            )}

            {product.description && (
              <p className="mt-5 leading-relaxed text-stone-700">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
