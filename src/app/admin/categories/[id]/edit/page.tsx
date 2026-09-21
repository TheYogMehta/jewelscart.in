import { notFound } from "next/navigation";
import { requireDashboardAccess } from "@/lib/auth/rbac";
import { getCategoryById } from "@/lib/categories";
import { CategoryForm } from "../../CategoryForm";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export const metadata = buildMetadata({
  title: "Edit Category",
  description: "Edit category metadata, sub-options, and hero customization",
  path: "/admin/categories/edit",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: Props) {
  await requireDashboardAccess();

  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  return <CategoryForm initialCategory={category} isEdit />;
}
