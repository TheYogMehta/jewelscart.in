import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/logo.svg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    icons: {
      icon: "/logo.svg",
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "JewelsCart",
      title,
      description,
      url,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function productJsonLd(product: {
  name: string;
  description?: string;
  image: string;
  slug: string;
  sku?: string;
  type?: string;
  sub_category?: string;
  category: string;
}) {
  const catString =
    product.type || product.sub_category
      ? `${product.type || product.sub_category} / ${product.category}`
      : product.category;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: { "@type": "Brand", name: "JewelsCart" },
    category: catString,
    url: `${SITE_URL}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "INR",
      url: `${SITE_URL}/products/${product.slug}`,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
