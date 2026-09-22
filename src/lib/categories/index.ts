import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import slugify from "slugify";
import { connectDB } from "@/lib/db";

export const CATEGORIES_CACHE_TAG = "categories";
export const CATEGORIES_REVALIDATE_SECONDS = 300;

export interface CategoryDocument {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  banner_url?: string | null;
  banner_type: "image" | "video";
  is_visible: boolean;
  header_order: number;
  path: string;
  parent?: { id: number; name: string; slug: string } | null;
  children: CategoryDocument[];
  created_at: Date;
  updated_at: Date;
}

export interface CategoryPathOption {
  id: number;
  name: string;
  slug: string;
  path: string;
  category: string;
  sub_category?: string;
  child_category?: string;
  depth: number;
}

function toSlug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

interface CategoryRow {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  banner_url?: string | null;
  banner_type?: "image" | "video" | null;
  is_visible?: boolean;
  header_order?: number;
  created_at: Date;
  updated_at: Date;
}

function buildCategoryHierarchy(rows: CategoryRow[]): {
  allMap: Map<number, CategoryDocument>;
  allList: CategoryDocument[];
  tree: CategoryDocument[];
} {
  const allMap = new Map<number, CategoryDocument>();
  const allList: CategoryDocument[] = [];

  for (const r of rows) {
    const bannerUrl = r.banner_url || null;
    const bannerType = r.banner_type === "video" ? "video" : "image";
    const isVisible = r.is_visible !== undefined ? Boolean(r.is_visible) : true;
    const doc: CategoryDocument = {
      id: r.id,
      parent_id: r.parent_id || null,
      name: r.name,
      slug: r.slug,
      description: r.description || null,
      banner_url: bannerUrl,
      banner_type: bannerType,
      is_visible: isVisible,
      header_order: r.header_order ?? 0,
      path: r.name,
      children: [],
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
    allMap.set(r.id, doc);
    allList.push(doc);
  }

  for (const doc of allList) {
    if (doc.parent_id && allMap.has(doc.parent_id)) {
      const parentDoc = allMap.get(doc.parent_id)!;
      parentDoc.children = parentDoc.children || [];
      parentDoc.children.push(doc);
      doc.parent = {
        id: parentDoc.id,
        name: parentDoc.name,
        slug: parentDoc.slug,
      };
    }
  }

  const computePath = (doc: CategoryDocument): string => {
    if (doc.path && doc.path !== doc.name) return doc.path;
    if (doc.parent_id && allMap.has(doc.parent_id)) {
      const parentPath = computePath(allMap.get(doc.parent_id)!);
      doc.path = `${parentPath} > ${doc.name}`;
    } else {
      doc.path = doc.name;
    }
    return doc.path;
  };

  for (const doc of allList) {
    computePath(doc);
  }

  const tree = allList.filter((doc) => !doc.parent_id);
  return { allMap, allList, tree };
}

async function listCategoriesFromDb(
  filterOptions: {
    visibleOnly?: boolean;
    all?: boolean;
    limit?: number;
  } = {},
): Promise<CategoryDocument[]> {
  const { visibleOnly = false, all = false, limit } = filterOptions;
  const pool = await connectDB();
  const query = "SELECT * FROM categories ORDER BY header_order ASC, name ASC";
  const res = await pool.query(query);

  const { allList, tree } = buildCategoryHierarchy(res.rows);

  if (all) {
    const result = visibleOnly ? allList.filter((c) => c.is_visible) : allList;
    return limit ? result.slice(0, limit) : result;
  }

  if (visibleOnly) {
    const filterVisible = (nodes: CategoryDocument[]): CategoryDocument[] => {
      return nodes
        .filter((cat) => cat.is_visible)
        .map((cat) => ({
          ...cat,
          children: cat.children ? filterVisible(cat.children) : [],
        }));
    };
    const filtered = filterVisible(tree);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  return limit ? tree.slice(0, limit) : tree;
}

const getCachedCategories = unstable_cache(
  async (optionsJson: string) => {
    const options = JSON.parse(optionsJson);
    return listCategoriesFromDb(options);
  },
  ["list-categories"],
  { revalidate: CATEGORIES_REVALIDATE_SECONDS, tags: [CATEGORIES_CACHE_TAG] },
);

export async function listCategories(options?: {
  visibleOnly?: boolean;
  fresh?: boolean;
  all?: boolean;
  limit?: number;
}): Promise<CategoryDocument[]> {
  const filterOptions = {
    visibleOnly: Boolean(options?.visibleOnly),
    all: Boolean(options?.all),
    limit: options?.limit,
  };

  if (options?.fresh) {
    return listCategoriesFromDb(filterOptions);
  }
  return getCachedCategories(JSON.stringify(filterOptions));
}

export async function listAllCategories(options?: {
  fresh?: boolean;
}): Promise<CategoryDocument[]> {
  return listCategories({ all: true, fresh: options?.fresh });
}

export async function listCategoryPaths(options?: {
  fresh?: boolean;
}): Promise<CategoryPathOption[]> {
  const all = await listAllCategories({ fresh: options?.fresh });
  const byId = new Map<number, CategoryDocument>(all.map((c) => [c.id, c]));

  return all.map((c) => {
    const chain: CategoryDocument[] = [c];
    let curr = c;
    while (curr.parent_id && byId.has(curr.parent_id)) {
      curr = byId.get(curr.parent_id)!;
      chain.unshift(curr);
    }

    const depth = chain.length;
    const category = chain[0].name;
    const sub_category = depth >= 2 ? chain[1].name : undefined;
    const child_category = depth >= 3 ? chain[2].name : undefined;

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      path: chain.map((item) => item.name).join(" > "),
      category,
      sub_category,
      child_category,
      depth,
    };
  });
}

async function getCategoryBySlugFromDb(
  slug: string,
): Promise<CategoryDocument | null> {
  const pool = await connectDB();
  const allRes = await pool.query(
    "SELECT * FROM categories ORDER BY header_order ASC, name ASC",
  );
  const { allList } = buildCategoryHierarchy(allRes.rows);

  const cleanSlug = slug.toLowerCase().trim();
  const found = allList.find(
    (c) =>
      c.slug.toLowerCase() === cleanSlug || c.name.toLowerCase() === cleanSlug,
  );

  return found || null;
}

const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) => getCategoryBySlugFromDb(slug),
  ["category-by-slug"],
  { revalidate: CATEGORIES_REVALIDATE_SECONDS, tags: [CATEGORIES_CACHE_TAG] },
);

export async function getCategoryBySlug(
  slug: string,
  options?: { fresh?: boolean },
): Promise<CategoryDocument | null> {
  if (options?.fresh) {
    return getCategoryBySlugFromDb(slug);
  }
  return getCachedCategoryBySlug(slug);
}

export async function getCategoryById(
  id: string | number,
): Promise<CategoryDocument | null> {
  const pool = await connectDB();
  const numId = typeof id === "number" ? id : parseInt(id, 10);
  if (isNaN(numId)) return null;

  const allRes = await pool.query(
    "SELECT * FROM categories ORDER BY header_order ASC, name ASC",
  );
  const { allMap } = buildCategoryHierarchy(allRes.rows);
  return allMap.get(numId) || null;
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  parent_id?: number | null;
  description?: string | null;
  banner_url?: string | null;
  banner_type?: "image" | "video";
  is_visible?: boolean;
  header_order?: number;
}): Promise<CategoryDocument> {
  const pool = await connectDB();
  const baseSlug = data.slug ? toSlug(data.slug) : toSlug(data.name);
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const check = await pool.query("SELECT 1 FROM categories WHERE slug = $1", [
      slug,
    ]);
    if (check.rows.length === 0) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const bannerUrl = data.banner_url || null;
  const bannerType = data.banner_type || "image";
  const parentId = data.parent_id && data.parent_id > 0 ? data.parent_id : null;
  const isVisible =
    data.is_visible !== undefined ? data.is_visible : parentId === null;

  const res = await pool.query(
    `INSERT INTO categories 
      (parent_id, name, slug, description, banner_url, banner_type, is_visible, header_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [
      parentId,
      data.name.trim(),
      slug,
      data.description?.trim() || null,
      bannerUrl,
      bannerType,
      isVisible,
      data.header_order ?? 0,
    ],
  );

  revalidateCategoryCache();
  const created = await getCategoryById(res.rows[0].id);
  return created!;
}

export async function updateCategory(
  id: string | number,
  data: Partial<{
    name: string;
    slug: string;
    parent_id: number | null;
    description: string | null;
    banner_url: string | null;
    banner_type: "image" | "video";
    is_visible: boolean;
    header_order: number;
  }>,
): Promise<CategoryDocument | null> {
  const pool = await connectDB();
  const numId = typeof id === "number" ? id : parseInt(id, 10);
  if (isNaN(numId)) return null;

  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    values.push(data.name.trim());
    sets.push(`name = $${values.length}`);
  }
  if (data.slug !== undefined) {
    values.push(toSlug(data.slug));
    sets.push(`slug = $${values.length}`);
  }
  if (data.parent_id !== undefined) {
    const parentId =
      data.parent_id && data.parent_id > 0 ? data.parent_id : null;
    if (parentId === numId) {
      throw new Error("A category cannot be its own parent.");
    }
    values.push(parentId);
    sets.push(`parent_id = $${values.length}`);
  }
  if (data.description !== undefined) {
    values.push(data.description ? data.description.trim() || null : null);
    sets.push(`description = $${values.length}`);
  }
  if (data.banner_url !== undefined) {
    values.push(data.banner_url || null);
    sets.push(`banner_url = $${values.length}`);
  }
  if (data.banner_type !== undefined) {
    values.push(data.banner_type || "image");
    sets.push(`banner_type = $${values.length}`);
  }
  if (data.is_visible !== undefined) {
    values.push(data.is_visible);
    sets.push(`is_visible = $${values.length}`);
  }
  if (data.header_order !== undefined) {
    values.push(data.header_order);
    sets.push(`header_order = $${values.length}`);
  }

  if (sets.length > 0) {
    sets.push(`updated_at = NOW()`);
    values.push(numId);

    await pool.query(
      `UPDATE categories SET ${sets.join(", ")} WHERE id = $${values.length}`,
      values,
    );
  }

  revalidateCategoryCache();
  return getCategoryById(numId);
}

export async function deleteCategory(
  id: string | number,
): Promise<CategoryDocument | null> {
  const pool = await connectDB();
  const numId = typeof id === "number" ? id : parseInt(id, 10);
  if (isNaN(numId)) return null;

  const existing = await getCategoryById(numId);
  if (!existing) return null;

  await pool.query("DELETE FROM categories WHERE id = $1", [numId]);

  revalidateCategoryCache();
  return existing;
}

export function revalidateCategoryCache() {
  try {
    revalidateTag(CATEGORIES_CACHE_TAG);
    revalidatePath("/discover");
    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
  } catch (e) {
    console.error("[Categories] Cache revalidation failed:", e);
  }
}

export async function reorderCategories(
  orderings: {
    id: number;
    header_order: number;
    is_visible?: boolean;
  }[],
): Promise<void> {
  const pool = await connectDB();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of orderings) {
      if (item.is_visible !== undefined) {
        await client.query(
          "UPDATE categories SET header_order = $1, is_visible = $2, updated_at = NOW() WHERE id = $3",
          [item.header_order, item.is_visible, item.id],
        );
      } else {
        await client.query(
          "UPDATE categories SET header_order = $1, updated_at = NOW() WHERE id = $2",
          [item.header_order, item.id],
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  revalidateCategoryCache();
}

export async function repositionCategory(params: {
  nodeId: number;
  newParentId: number | null;
  siblingOrders?: { id: number; order: number }[];
}): Promise<void> {
  const pool = await connectDB();
  const { nodeId, newParentId, siblingOrders } = params;

  const node = await getCategoryById(nodeId);
  if (!node) throw new Error("Category not found");

  if (newParentId === nodeId) {
    throw new Error("A category cannot be its own parent.");
  }

  if (newParentId !== null) {
    const parent = await getCategoryById(newParentId);
    if (!parent) throw new Error("Target parent category not found");

    const isDescendant = (cat: CategoryDocument, targetId: number): boolean => {
      if (!cat.children) return false;
      for (const child of cat.children) {
        if (child.id === targetId || isDescendant(child, targetId)) {
          return true;
        }
      }
      return false;
    };

    if (isDescendant(node, newParentId)) {
      throw new Error("Cannot move a category under its own sub-category.");
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE categories SET parent_id = $1, updated_at = NOW() WHERE id = $2",
      [newParentId, nodeId],
    );

    if (siblingOrders && siblingOrders.length > 0) {
      for (const item of siblingOrders) {
        await client.query(
          "UPDATE categories SET header_order = $1, updated_at = NOW() WHERE id = $2",
          [item.order, item.id],
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  revalidateCategoryCache();
}
