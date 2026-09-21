import { unstable_cache, revalidateTag } from "next/cache";
import slugify from "slugify";
import { connectDB } from "@/lib/db";
import type { MediaItem } from "@/lib/uploads";

export * from "@/lib/uploads";

export const PRODUCTS_CACHE_TAG = "products";
export const CATALOG_REVALIDATE_SECONDS = 300;

export function revalidateProductCatalog() {
  revalidateTag(PRODUCTS_CACHE_TAG);
}

export interface ProductDocument {
  id: number;
  _id: string;
  name: string;
  slug: string;
  image: string;
  media: MediaItem[];
  description?: string;
  category: string;
  sub_category?: string;
  child_category?: string;
  type?: string;
  sku?: string;
  price?: number;
  qty?: number;
  length?: string;
  weight?: string;
  stock_status?: "in_stock" | "out_of_stock" | string;
  created_at: Date;
  updated_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

function toSlug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  image: string;
  media?: any;
  description?: string | null;
  category: string;
  sub_category?: string | null;
  child_category?: string | null;
  sku?: string | null;
  price?: string | number | null;
  qty?: number | null;
  length?: string | null;
  weight?: string | null;
  stock_status?: string | null;
  created_at: Date;
  updated_at: Date;
}

function parseMedia(val: any, fallbackImage: string): MediaItem[] {
  if (Array.isArray(val) && val.length > 0) {
    return val.map((item) => {
      if (typeof item === "string") {
        const isVid = /\.(mp4|webm|mov)$/i.test(item);
        return { url: item, type: isVid ? "video" : "image" };
      }
      return {
        url: String(item.url || ""),
        type: item.type === "video" ? "video" : "image",
      };
    });
  }
  if (fallbackImage) {
    const isVid = /\.(mp4|webm|mov)$/i.test(fallbackImage);
    return [{ url: fallbackImage, type: isVid ? "video" : "image" }];
  }
  return [];
}

function mapProduct(row: ProductRow): ProductDocument {
  const name = String(row.name ?? "");
  const id = Number(row.id);
  const rawImage = String(row.image ?? "");
  const media = parseMedia(row.media, rawImage);
  const primaryImage =
    media.find((m) => m.type === "image")?.url || media[0]?.url || rawImage;

  const subCat = row.sub_category ? String(row.sub_category) : undefined;
  const childCat = row.child_category ? String(row.child_category) : undefined;

  return {
    id,
    _id: String(id),
    name,
    slug: String(row.slug ?? toSlug(name)),
    image: primaryImage,
    media,
    description: row.description ? String(row.description) : undefined,
    category: String(row.category ?? ""),
    sub_category: subCat,
    child_category: childCat,
    type: childCat || subCat || "",
    sku: row.sku ? String(row.sku) : undefined,
    price:
      row.price != null && row.price !== "" ? Number(row.price) : undefined,
    qty: row.qty != null ? Number(row.qty) : 0,
    length: row.length ? String(row.length) : undefined,
    weight: row.weight ? String(row.weight) : undefined,
    stock_status: row.stock_status ? String(row.stock_status) : "out_of_stock",
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ListFilters = {
  type?: string;
  sub_category?: string;
  child_category?: string;
  category?: string;
  limit?: number;
};

async function listProductsFromDb(
  filters?: ListFilters,
): Promise<ProductDocument[]> {
  const pool = await connectDB();
  let queryText = "SELECT * FROM products";
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  const filterSub = filters?.sub_category || filters?.type;
  if (filterSub) {
    values.push(filterSub);
    conditions.push(
      `(sub_category ILIKE $${values.length} OR child_category ILIKE $${values.length})`,
    );
  }
  if (filters?.child_category) {
    values.push(filters.child_category);
    conditions.push(`child_category ILIKE $${values.length}`);
  }
  if (filters?.category) {
    values.push(filters.category);
    conditions.push(`category ILIKE $${values.length}`);
  }

  if (conditions.length > 0) {
    queryText += " WHERE " + conditions.join(" AND ");
  }

  queryText += " ORDER BY created_at DESC";

  if (filters?.limit && filters.limit > 0) {
    values.push(filters.limit);
    queryText += ` LIMIT $${values.length}`;
  }

  const res = await pool.query(queryText, values);
  return res.rows.map((row) => mapProduct(row));
}

const getCachedListProducts = unstable_cache(
  async (filtersKey: string) =>
    listProductsFromDb(JSON.parse(filtersKey) as ListFilters),
  ["list-products"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [PRODUCTS_CACHE_TAG] },
);

export async function listProducts(
  filters?: ListFilters,
  options?: { fresh?: boolean },
): Promise<ProductDocument[]> {
  if (options?.fresh) {
    return listProductsFromDb(filters);
  }
  return getCachedListProducts(JSON.stringify(filters ?? {}));
}

async function getProductBySlugFromDb(slug: string) {
  const pool = await connectDB();

  let res = await pool.query("SELECT * FROM products WHERE slug = $1", [slug]);
  if (res.rows.length > 0) return mapProduct(res.rows[0]);

  const namePattern = slug.replace(/-/g, " ");
  res = await pool.query("SELECT * FROM products WHERE name ILIKE $1", [
    namePattern,
  ]);
  return res.rows.length > 0 ? mapProduct(res.rows[0]) : null;
}

const getCachedProductBySlug = unstable_cache(
  async (slug: string) => getProductBySlugFromDb(slug),
  ["product-by-slug"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [PRODUCTS_CACHE_TAG] },
);

export async function getProductBySlug(
  slug: string,
  options?: { fresh?: boolean },
) {
  if (options?.fresh) {
    return getProductBySlugFromDb(slug);
  }
  return getCachedProductBySlug(slug);
}

export async function getProductById(id: string) {
  const pool = await connectDB();
  const intId = parseInt(id, 10);
  if (isNaN(intId)) return null;

  const res = await pool.query("SELECT * FROM products WHERE id = $1", [intId]);
  return res.rows.length > 0 ? mapProduct(res.rows[0]) : null;
}

export async function getNextSku(): Promise<string> {
  const pool = await connectDB();
  try {
    const res = await pool.query(
      "SELECT sku FROM products WHERE sku ILIKE 'JC-%' ORDER BY id DESC LIMIT 1",
    );
    if (res.rows.length > 0) {
      const match = res.rows[0].sku?.match(/JC-(\d+)/i);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `JC-${String(nextNum).padStart(4, "0")}`;
      }
    }
    const countRes = await pool.query("SELECT COUNT(*) FROM products");
    const count = parseInt(countRes.rows[0].count, 10) || 0;
    return `JC-${String(count + 1).padStart(4, "0")}`;
  } catch {
    return "JC-0001";
  }
}

export async function createProduct(data: {
  name: string;
  image?: string;
  media?: MediaItem[];
  description?: string;
  category: string;
  sub_category?: string | null;
  child_category?: string | null;
  type?: string | null;
  sku?: string;
  price?: number;
  qty?: number;
  length?: string;
  weight?: string;
  stock_status?: string;
}) {
  const pool = await connectDB();
  const baseSlug = toSlug(data.name);
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const checkRes = await pool.query(
      "SELECT 1 FROM products WHERE slug = $1",
      [slug],
    );
    if (checkRes.rows.length === 0) {
      break;
    }
    slug = `${baseSlug}-${suffix++}`;
  }

  const sku = data.sku?.trim() || (await getNextSku());
  const media =
    data.media && data.media.length > 0
      ? data.media
      : data.image
        ? [{ url: data.image, type: "image" as const }]
        : [];
  const primaryImage =
    media.find((m) => m.type === "image")?.url ||
    media[0]?.url ||
    data.image ||
    "";

  const subCat = data.sub_category?.trim() || data.type?.trim() || null;
  const childCat = data.child_category?.trim() || null;

  const res = await pool.query(
    `INSERT INTO products (name, slug, image, media, description, category, sub_category, child_category, sku, price, qty, length, weight, stock_status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
     RETURNING *`,
    [
      data.name,
      slug,
      primaryImage,
      JSON.stringify(media),
      data.description || null,
      data.category,
      subCat,
      childCat,
      sku,
      data.price != null ? data.price : null,
      data.qty != null ? data.qty : 0,
      data.length || null,
      data.weight || null,
      data.stock_status || "out_of_stock",
    ],
  );

  return mapProduct(res.rows[0]);
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    image: string;
    media: MediaItem[];
    description: string;
    category: string;
    sub_category: string | null;
    child_category: string | null;
    type: string | null;
    sku: string;
    price: number | null;
    qty: number | null;
    length: string | null;
    weight: string | null;
    stock_status: string;
  }>,
) {
  const pool = await connectDB();
  const intId = parseInt(id, 10);
  if (isNaN(intId)) return null;

  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    values.push(data.name);
    sets.push(`name = $${values.length}`);

    const slug = toSlug(data.name);
    values.push(slug);
    sets.push(`slug = $${values.length}`);
  }
  if (data.media !== undefined) {
    values.push(JSON.stringify(data.media));
    sets.push(`media = $${values.length}::jsonb`);

    const primaryImage =
      data.media.find((m) => m.type === "image")?.url ||
      data.media[0]?.url ||
      "";
    if (primaryImage) {
      values.push(primaryImage);
      sets.push(`image = $${values.length}`);
    }
  } else if (data.image !== undefined) {
    values.push(data.image);
    sets.push(`image = $${values.length}`);
  }
  if (data.description !== undefined) {
    values.push(data.description || null);
    sets.push(`description = $${values.length}`);
  }
  if (data.category !== undefined) {
    values.push(data.category);
    sets.push(`category = $${values.length}`);
  }
  if (data.sub_category !== undefined || data.type !== undefined) {
    const subCat =
      data.sub_category !== undefined ? data.sub_category : data.type;
    values.push(subCat?.trim() || null);
    sets.push(`sub_category = $${values.length}`);
  }
  if (data.child_category !== undefined) {
    values.push(data.child_category?.trim() || null);
    sets.push(`child_category = $${values.length}`);
  }
  if (data.sku !== undefined) {
    values.push(data.sku || null);
    sets.push(`sku = $${values.length}`);
  }
  if (data.price !== undefined) {
    values.push(data.price != null ? data.price : null);
    sets.push(`price = $${values.length}`);
  }
  if (data.qty !== undefined) {
    values.push(data.qty != null ? data.qty : 0);
    sets.push(`qty = $${values.length}`);
  }
  if (data.length !== undefined) {
    values.push(data.length || null);
    sets.push(`length = $${values.length}`);
  }
  if (data.weight !== undefined) {
    values.push(data.weight || null);
    sets.push(`weight = $${values.length}`);
  }
  if (data.stock_status !== undefined) {
    values.push(data.stock_status || "out_of_stock");
    sets.push(`stock_status = $${values.length}`);
  }

  if (sets.length === 0) {
    const checkRes = await pool.query("SELECT * FROM products WHERE id = $1", [
      intId,
    ]);
    return checkRes.rows.length > 0 ? mapProduct(checkRes.rows[0]) : null;
  }

  sets.push(`updated_at = NOW()`);

  values.push(intId);
  const queryText = `UPDATE products SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`;

  const res = await pool.query(queryText, values);
  return res.rows.length > 0 ? mapProduct(res.rows[0]) : null;
}

export async function deleteProduct(id: string) {
  const pool = await connectDB();
  const intId = parseInt(id, 10);
  if (isNaN(intId)) return null;

  const res = await pool.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [intId],
  );
  return res.rows.length > 0 ? mapProduct(res.rows[0]) : null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await listProducts();
  return products.map((p) => p.slug);
}
