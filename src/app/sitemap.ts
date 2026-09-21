import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/products";
import { listCategories } from "@/lib/categories";
import { SITE_URL } from "@/lib/env";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/discover`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/policy`, changeFrequency: "monthly", priority: 0.3 },
    {
      url: `${SITE_URL}/terms-of-service`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await listCategories();
    for (const c of categories) {
      categoryPages.push({
        url: `${SITE_URL}/category/${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });

      if (Array.isArray(c.children)) {
        for (const sub of c.children) {
          if (sub?.name && sub.name.trim()) {
            categoryPages.push({
              url: `${SITE_URL}/category/${c.slug}?sub=${encodeURIComponent(sub.name.trim())}`,
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[Sitemap] Failed to load categories:", err);
  }

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProductSlugs();
    productPages = slugs.map((slug) => ({
      url: `${SITE_URL}/products/${slug}`,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  } catch (err) {
    console.error("[Sitemap] Failed to load products:", err);
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
