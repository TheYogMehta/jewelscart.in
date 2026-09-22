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

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    ...(product.category
      ? [
          {
            name: product.category,
            path: `/products/${product.slug}`,
          },
        ]
      : []),
    { name: product.name, path: `/products/${product.slug}` },
  ]);

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
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            ...(product.category
              ? [
                  {
                    label: product.category,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery media={product.media} name={product.name} />

          <div>
            <div className="flex items-center gap-3">
              {product.type && (
                <p className="text-sm uppercase tracking-wide text-gold">
                  {product.type}
                </p>
              )}
              {product.stock_status && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                  {product.stock_status === "in_stock"
                    ? "In Stock"
                    : "Out of Stock"}
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
            {product.description && (
              <p className="mt-5 leading-relaxed text-stone-700">
                {product.description}
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

            {/* Product Specifications & Care Guide */}
            <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/70 p-5 text-xs text-stone-700 space-y-3">
              <p className="font-semibold uppercase tracking-wider text-stone-900 text-[11px]">
                Product Specifications
              </p>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {product.length && (
                  <div>
                    <span className="text-stone-500">Length / Dimensions:</span>
                    <p className="font-medium text-stone-800">
                      {product.length}
                    </p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <span className="text-stone-500">Weight:</span>
                    <p className="font-medium text-stone-800">
                      {product.weight}
                    </p>
                  </div>
                )}
                {product.qty != null && (
                  <div>
                    <span className="text-stone-500">Available Quantity:</span>
                    <p className="font-medium text-stone-800">
                      {product.qty} unit{product.qty === 1 ? "" : "s"}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-stone-500">Classification:</span>
                  <p className="font-medium text-stone-800">
                    Handcrafted Fashion Jewellery
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">Country of Origin:</span>
                  <p className="font-medium text-stone-800">India</p>
                </div>
                <div>
                  <span className="text-stone-500">Manufacturer & Packer:</span>
                  <p className="font-medium text-stone-800">
                    JewelsCart, Mumbai, Maharashtra
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-200/80 pt-3">
                <p className="font-semibold text-stone-900 mb-1">
                  Jewellery Care Guide:
                </p>
                <p className="text-stone-600 leading-relaxed">
                  Avoid direct contact with water, sprays, sanitizers, and
                  strong perfumes. Store each piece in a dry, airtight ziplock
                  pouch. Normal wear or tarnishing caused by chemical exposure
                  is not considered a manufacturing defect.
                </p>
              </div>

              <div className="border-t border-stone-200/80 pt-2 text-stone-500 text-[11px] flex items-center justify-between">
                <span>
                  Handcrafted to order • Strictly no returns or refunds
                </span>
                <Link
                  href="/contact"
                  className="text-gold hover:underline font-medium"
                >
                  Have questions? Contact us &rarr;
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-full border border-stone-300 px-6 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
              >
                Inquire
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
