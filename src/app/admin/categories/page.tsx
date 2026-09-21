import { requireDashboardAccess } from "@/lib/auth/rbac";
import { listCategories } from "@/lib/categories";
import { CategoryTreeGraph } from "./CategoryTreeGraph";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Categories Management",
  description: "Manage dynamic categories hierarchy and category hero banners",
  path: "/admin/categories",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireDashboardAccess();
  const treeCategories = await listCategories({ fresh: true });

  return <CategoryTreeGraph initialCategories={treeCategories} />;
}
