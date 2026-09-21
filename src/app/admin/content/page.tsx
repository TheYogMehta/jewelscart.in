import { requireDashboardAccess } from "@/lib/auth/rbac";
import { getPageContent } from "@/lib/content";
import { ContentEditor } from "./ContentEditor";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Site Content & Hero Editor",
  description:
    "Customize storefront hero banners, video backgrounds, and marketing copy",
  path: "/admin/content",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireDashboardAccess();

  const [home, about, contact, discover] = await Promise.all([
    getPageContent("home", { fresh: true }),
    getPageContent("about", { fresh: true }),
    getPageContent("contact", { fresh: true }),
    getPageContent("discover", { fresh: true }),
  ]);

  return (
    <ContentEditor
      initialContent={{
        home,
        about,
        contact,
        discover,
      }}
    />
  );
}
