import { requireLogsAccess } from "@/lib/auth/rbac";
import { listActivityLogs } from "@/lib/logs";
import { buildMetadata } from "@/lib/seo";
import { LogsFeed } from "./LogsFeed";

export const metadata = buildMetadata({
  title: "Activity & Audit Logs",
  description:
    "View store operations, product edits, content updates, and logins with IP & geographic location",
  path: "/admin/logs",
  noIndex: true,
});

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function AdminLogsPage({ searchParams }: Props) {
  await requireLogsAccess();
  const params = await searchParams;
  const search = params.search || undefined;
  const currentPage = parseInt(params.page || "1", 10);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  const { logs, total } = await listActivityLogs({
    limit,
    offset,
    search,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <LogsFeed
      logs={logs}
      total={total}
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={limit}
      currentSearch={search || ""}
    />
  );
}
