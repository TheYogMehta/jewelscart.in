"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivityLogEntry } from "@/lib/logs";

interface Props {
  logs: ActivityLogEntry[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  currentSearch?: string;
}

function formatLogActivity(log: ActivityLogEntry): {
  description: string;
  badge: string;
  iconType: "edit" | "create" | "delete" | "login" | "security";
} {
  const action = log.action.toLowerCase();
  const target = log.target_name || "";

  if (action === "hero_content_edit") {
    let page = "Page";
    if (log.target_id) {
      page = log.target_id.charAt(0).toUpperCase() + log.target_id.slice(1);
    } else if (target) {
      page = target.replace(/\s*hero\s*section/i, "").trim() || "Page";
      page = page.charAt(0).toUpperCase() + page.slice(1).toLowerCase();
    }
    return {
      description: `edited ${page} hero section`,
      badge: "Content Edit",
      iconType: "edit",
    };
  }

  if (action === "product_create") {
    return {
      description: target ? `created product "${target}"` : "created product",
      badge: "Product Created",
      iconType: "create",
    };
  }

  if (action === "product_edit" || action === "product_update") {
    return {
      description: target ? `edited product "${target}"` : "edited product",
      badge: "Product Edited",
      iconType: "edit",
    };
  }

  if (action === "product_delete") {
    return {
      description: target ? `deleted product "${target}"` : "deleted product",
      badge: "Product Deleted",
      iconType: "delete",
    };
  }

  if (action === "category_create") {
    return {
      description: target ? `created category "${target}"` : "created category",
      badge: "Category Created",
      iconType: "create",
    };
  }

  if (action === "category_edit" || action === "category_update") {
    return {
      description: target ? `edited category "${target}"` : "edited category",
      badge: "Category Edited",
      iconType: "edit",
    };
  }

  if (action === "category_delete") {
    return {
      description: target ? `deleted category "${target}"` : "deleted category",
      badge: "Category Deleted",
      iconType: "delete",
    };
  }

  if (action === "user_login") {
    return {
      description: "signed in to account",
      badge: "Login",
      iconType: "login",
    };
  }

  if (action === "password_change") {
    return {
      description: "changed account password",
      badge: "Security",
      iconType: "security",
    };
  }

  if (action === "user_update") {
    return {
      description: target
        ? `updated user account "${target}"`
        : "updated user account",
      badge: "User Update",
      iconType: "edit",
    };
  }

  if (action === "user_delete") {
    return {
      description: target
        ? `deleted user account "${target}"`
        : "deleted user account",
      badge: "User Delete",
      iconType: "delete",
    };
  }

  const cleanAction = action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    description: target
      ? `${cleanAction.toLowerCase()}: ${target}`
      : cleanAction.toLowerCase(),
    badge: cleanAction,
    iconType: action.includes("delete")
      ? "delete"
      : action.includes("create")
        ? "create"
        : "edit",
  };
}

function parseUserAgent(ua?: string | null): string {
  if (!ua) return "Unknown Device";
  let browser = "Browser";
  let os = "";

  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("iPad")) os = "iPad";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";

  return os ? `${browser} on ${os}` : browser;
}

function groupLogsByDay(logs: ActivityLogEntry[]) {
  const groups: {
    dateLabel: string;
    dateSub: string;
    logs: ActivityLogEntry[];
  }[] = [];
  const map = new Map<string, ActivityLogEntry[]>();

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  for (const log of logs) {
    const logDate = new Date(log.created_at);
    const key = logDate.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(log);
  }

  for (const [key, groupLogs] of map.entries()) {
    const dateObj = new Date(groupLogs[0].created_at);
    const dateLabel = dateObj
      .toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
    let dateSub = "";

    if (key === todayKey) {
      dateSub = "TODAY";
    } else if (key === yesterdayKey) {
      dateSub = "YESTERDAY";
    }

    groups.push({
      dateLabel,
      dateSub,
      logs: groupLogs,
    });
  }

  return groups;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [];
  pages.push(1);
  if (currentPage > 3) {
    pages.push("...");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push("...");
  }
  pages.push(totalPages);
  return pages;
}

export function LogsFeed({
  logs,
  total,
  currentPage,
  totalPages,
  pageSize = 20,
  currentSearch = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/admin/logs?${params.toString()}`);
  };

  const grouped = groupLogsByDay(logs);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-stone-200/70">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-stone-900">
            Timeline Feed
          </h2>
          {currentSearch && (
            <span className="text-xs text-stone-500">
              · Filtered by &quot;{currentSearch}&quot; ·{" "}
              <Link
                href="/admin/logs"
                className="text-gold font-medium hover:underline"
              >
                Clear search
              </Link>
            </span>
          )}
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full sm:w-72 shrink-0"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search user, email, item..."
            className="h-8.5 w-full rounded-full border border-stone-200/90 bg-white pl-8.5 pr-8 text-xs text-stone-900 placeholder-stone-400 transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("search");
                params.delete("page");
                router.push(`/admin/logs?${params.toString()}`);
              }}
              className="absolute right-2.5 top-1/2 flex h-4.5 w-4.5 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="Clear search"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </form>
      </div>

      {logs.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-700">
            No activity logs found
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {currentSearch
              ? "Try adjusting your search term."
              : "System operations will appear here in real time."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <div className="sticky top-20 z-10 flex items-center gap-2.5">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold tracking-wider text-stone-700 border border-stone-200/80 shadow-2xs">
                  {group.dateSub ? `${group.dateSub} · ` : ""}
                  {group.dateLabel}
                </span>
                <div className="h-px flex-1 bg-stone-200/60" />
                <span className="text-[11px] text-stone-400 font-medium">
                  {group.logs.length}{" "}
                  {group.logs.length === 1 ? "event" : "events"}
                </span>
              </div>

              <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200/70 space-y-3">
                {group.logs.map((log) => {
                  const { description, badge, iconType } =
                    formatLogActivity(log);
                  const timeString = new Date(
                    log.created_at,
                  ).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={log.id}
                      className="relative flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white p-3.5 transition hover:border-stone-300 hover:bg-stone-50/40"
                    >
                      <div className="absolute -left-7.75 sm:-left-9.75 top-3.5 flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-2xs">
                        {iconType === "create" && (
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                        {iconType === "edit" && (
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        )}
                        {iconType === "delete" && (
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        )}
                        {iconType === "login" && (
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                          </svg>
                        )}
                        {iconType === "security" && (
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 text-[10px] font-bold text-gold">
                              {(log.actor_name || "S").charAt(0).toUpperCase()}
                            </span>
                            <p className="text-xs font-medium text-stone-900 truncate">
                              <span className="font-semibold">
                                {log.actor_name || "System"}
                              </span>{" "}
                              <span className="text-stone-700">
                                {description}
                              </span>
                            </p>
                            <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-200/70">
                              {badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-mono whitespace-nowrap">
                            {timeString}
                          </span>
                        </div>

                        {log.actor_email && (
                          <p className="mt-0.5 text-[11px] text-stone-400 pl-7">
                            {log.actor_email}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2 pl-7 text-[11px]">
                          <div className="flex items-center gap-1 text-stone-600">
                            <svg
                              className="h-3 w-3 text-stone-400 shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>
                              {log.city || "Anonymous"},{" "}
                              {log.country || "Anonymous"}
                            </span>
                          </div>
                          <span className="text-stone-300">·</span>
                          <span className="rounded bg-stone-50 border border-stone-200/70 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">
                            IP: {log.ip || "—"}
                          </span>
                          {log.user_agent && (
                            <>
                              <span className="text-stone-300">·</span>
                              <span className="rounded bg-stone-50 border border-stone-200/70 px-1.5 py-0.5 text-[10px] text-stone-500">
                                {parseUserAgent(log.user_agent)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100 pt-4">
          <p className="text-xs text-stone-500">
            Showing{" "}
            <span className="font-medium text-stone-800">
              {(currentPage - 1) * pageSize + 1}
            </span>
            –
            <span className="font-medium text-stone-800">
              {Math.min(currentPage * pageSize, total)}
            </span>{" "}
            of <span className="font-medium text-stone-800">{total}</span> logs
          </p>
          <div className="flex items-center gap-1.5">
            {currentPage > 1 ? (
              <Link
                href={`/admin/logs?page=${currentPage - 1}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`}
                className="rounded-lg border border-stone-200/90 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-stone-100 bg-stone-50/50 px-2.5 py-1 text-xs font-medium text-stone-300 cursor-not-allowed">
                Previous
              </span>
            )}

            <div className="flex items-center gap-1">
              {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                if (typeof p === "string") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs text-stone-400 select-none"
                    >
                      …
                    </span>
                  );
                }
                const isActive = p === currentPage;
                return isActive ? (
                  <span
                    key={p}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold text-xs font-semibold text-white shadow-2xs"
                    aria-current="page"
                  >
                    {p}
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={`/admin/logs?page=${p}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200/90 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs"
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            {currentPage < totalPages ? (
              <Link
                href={`/admin/logs?page=${currentPage + 1}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`}
                className="rounded-lg border border-stone-200/90 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-lg border border-stone-100 bg-stone-50/50 px-2.5 py-1 text-xs font-medium text-stone-300 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
