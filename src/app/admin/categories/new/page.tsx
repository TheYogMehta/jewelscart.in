import { requireDashboardAccess } from "@/lib/auth/rbac";
import { CategoryForm } from "../CategoryForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "New Category",
  description: "Create a new jewellery category and configure sub-options",
  path: "/admin/categories/new",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requireDashboardAccess();

  return <CategoryForm />;
}
