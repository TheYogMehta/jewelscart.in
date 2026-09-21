"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { SafeUser, AppRole } from "@/lib/auth/users";

export function RoleBadge({ role }: { role: AppRole }) {
  const styles: Record<AppRole, string> = {
    developer: "bg-stone-900 text-stone-100 border-stone-900 shadow-2xs",
    admin: "bg-amber-50 text-amber-800 border-amber-200",
    staff: "bg-stone-100 text-stone-700 border-stone-200",
    user: "bg-stone-100 text-stone-600 border-stone-200",
  };

  const label = role === "user" ? "Customer" : role;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize transition-colors ${
        styles[role] ?? styles.user
      }`}
    >
      {label}
    </span>
  );
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [1];
  if (currentPage > 3) {
    pages.push("ellipsis-1");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-2");
  }
  pages.push(totalPages);
  return pages;
}

interface UserCounts {
  team: number;
  customer: number;
  total: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Props {
  initialUsers: SafeUser[];
  initialCounts: UserCounts;
  initialPagination?: PaginationState;
  actorRole: string | undefined;
  currentUserEmail?: string | null;
  currentUserId?: string | number | null;
}

export function UserList({
  initialUsers,
  initialCounts,
  initialPagination,
  actorRole,
  currentUserEmail,
  currentUserId,
}: Props) {
  const [activeTab, setActiveTab] = useState<"team" | "customer">("team");
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [counts, setCounts] = useState<UserCounts>(initialCounts);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination ?? {
      page: 1,
      pageSize: 12,
      total: initialUsers.length,
      totalPages: Math.ceil(initialUsers.length / 12),
    },
  );
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("staff");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<SafeUser | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCounts(initialCounts);
    if (activeTab === "team") {
      setUsers(initialUsers);
      if (initialPagination) {
        setPagination(initialPagination);
      }
    }
  }, [initialUsers, initialCounts, initialPagination, activeTab]);

  const fetchUsers = useCallback(
    async (
      tab: "team" | "customer",
      query: string,
      page: number = 1,
      pageSize: number = 12,
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("filter", tab);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        if (query.trim()) {
          params.set("q", query.trim());
        }

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          }
          if (data.counts) {
            setCounts(data.counts);
          }
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err) {
        console.error("[UserList] Failed to fetch users:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Switch tabs
  const handleTabChange = (newTab: "team" | "customer") => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setSearch("");
    setEditingUserId(null);
    setFeedback(null);
    fetchUsers(newTab, "", 1, pagination.pageSize);
  };

  // Change page
  const handlePageChange = (newPage: number) => {
    if (
      newPage === pagination.page ||
      newPage < 1 ||
      newPage > pagination.totalPages
    ) {
      return;
    }
    fetchUsers(activeTab, search, newPage, pagination.pageSize);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(activeTab, search, 1, pagination.pageSize);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab, fetchUsers, pagination.pageSize]);

  const isCurrentUser = (targetUser: SafeUser) => {
    if (
      currentUserEmail &&
      targetUser.email.toLowerCase() === currentUserEmail.toLowerCase()
    ) {
      return true;
    }
    if (currentUserId && String(targetUser.id) === String(currentUserId)) {
      return true;
    }
    return false;
  };

  const canEditTarget = (targetUser: SafeUser) => {
    if (isCurrentUser(targetUser)) return false;
    if (targetUser.role === "developer") return false;
    if (actorRole === "developer" || actorRole === "admin") return true;
    return false;
  };

  const canDeleteTarget = (targetUser: SafeUser) => {
    if (isCurrentUser(targetUser)) return false;
    if (targetUser.role === "developer") return false;
    if (actorRole === "developer") {
      return ["admin", "staff", "user"].includes(targetUser.role);
    }
    if (actorRole === "admin") {
      return ["staff", "user"].includes(targetUser.role);
    }
    return false;
  };

  const getEditableRolesForTarget = (targetUser: SafeUser): AppRole[] => {
    if (isCurrentUser(targetUser) || targetUser.role === "developer") {
      return [];
    }
    if (actorRole === "developer") {
      return ["admin", "staff", "user"];
    }
    if (actorRole === "admin") {
      return ["staff", "user"];
    }
    return [];
  };

  const handleStartEdit = (user: SafeUser) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role === "user" ? "staff" : user.role);
    setFeedback(null);
  };

  const handleSaveRole = async (userId: number) => {
    setIsUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          msg: data.error || "Failed to update role",
          type: "error",
        });
        setIsUpdating(false);
        return;
      }

      // Refresh list & counts from server
      fetchUsers(activeTab, search, pagination.page, pagination.pageSize);
      setEditingUserId(null);
      setFeedback({ msg: "Role updated successfully", type: "success" });
    } catch {
      setFeedback({ msg: "Network error occurred", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async (userId: number) => {
    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          msg: data.error || "Failed to delete account",
          type: "error",
        });
        setIsDeleting(false);
        setDeleteConfirmUser(null);
        return;
      }

      // Immediately filter out the deleted user from current state
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (data.counts) {
        setCounts(data.counts);
      }

      const targetPage =
        users.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      fetchUsers(activeTab, search, targetPage, pagination.pageSize);

      setFeedback({
        msg: `Account for ${data.deletedUser?.email || "user"} was permanently deleted.`,
        type: "success",
      });

      setDeleteConfirmUser(null);
    } catch {
      setFeedback({
        msg: "Network error occurred while deleting account",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("team")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === "team"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
            }`}
          >
            <span>Team Members</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeTab === "team"
                  ? "bg-stone-800 text-stone-200"
                  : "bg-stone-200 text-stone-700"
              }`}
            >
              {counts.team}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("customer")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === "customer"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
            }`}
          >
            <span>Customers</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeTab === "customer"
                  ? "bg-stone-800 text-stone-200"
                  : "bg-stone-200 text-stone-700"
              }`}
            >
              {counts.customer}
            </span>
          </button>
        </div>

        <div className="text-xs text-stone-500 font-medium">
          {isLoading
            ? "Loading..."
            : pagination.total > 0
              ? `Showing ${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.total,
                )} of ${pagination.total} ${
                  activeTab === "team" ? "team members" : "customers"
                }`
              : `0 ${activeTab === "team" ? "team members" : "customers"}`}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
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
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "team"
                ? "Search team members by name or email..."
                : "Search customers by name or email..."
            }
            className="w-full rounded-xl border border-stone-200/90 bg-white pl-10 pr-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl p-3 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Grid of Users */}
      {users.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/90 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-3">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-900">
            {search
              ? `No matching ${
                  activeTab === "team" ? "team members" : "customers"
                } found`
              : activeTab === "team"
                ? "No team accounts found"
                : "No customer accounts registered yet"}
          </p>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            {search
              ? "Try searching with a different email or name."
              : activeTab === "team"
                ? "Provision staff or administrators to manage catalogue and store operations."
                : "Customer accounts will appear here as users register or place orders."}
          </p>
          {activeTab === "team" && (
            <div className="mt-4">
              <Link
                href="/admin/users/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-gold-light transition"
              >
                + Add or Assign User
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u: SafeUser) => {
            const isEditing = editingUserId === u.id;
            const canEdit = canEditTarget(u);
            const canDelete = canDeleteTarget(u);
            const editableRoles = getEditableRolesForTarget(u);

            return (
              <div
                key={u.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-2xs hover:border-stone-300 hover:shadow-xs transition"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 font-display text-xs font-semibold text-stone-700 border border-stone-200/80">
                        {u.name
                          ? u.name.slice(0, 2).toUpperCase()
                          : u.email.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 text-sm truncate">
                          {u.name || (
                            <span className="text-stone-400 font-normal">
                              Not provided
                            </span>
                          )}
                        </p>
                        <p className="text-xs font-mono text-stone-500 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>

                  {/* Inline Role Editor */}
                  {isEditing ? (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 space-y-2.5 animate-in fade-in duration-150">
                      <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                        Assign New Role
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) =>
                          setSelectedRole(e.target.value as AppRole)
                        }
                        disabled={isUpdating}
                        className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 capitalize"
                      >
                        {editableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r === "admin"
                              ? "Admin"
                              : r === "staff"
                                ? "Staff"
                                : r === "developer"
                                  ? "Developer"
                                  : "Customer"}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingUserId(null)}
                          disabled={isUpdating}
                          className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(u.id)}
                          disabled={isUpdating}
                          className="rounded-lg bg-gold px-3 py-1 text-xs font-medium text-white hover:bg-gold-light transition disabled:opacity-60 cursor-pointer"
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Footer metadata & Quick actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 text-xs border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-stone-500 font-medium">
                      {u.provider === "google" ? "Google" : "Credentials"}
                    </span>
                    <span className="text-stone-300">•</span>
                    {u.email_verified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="text-stone-400">Unverified</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {canEdit && !isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(u)}
                        className="text-xs font-medium text-gold hover:text-gold-light hover:underline transition cursor-pointer"
                      >
                        {u.role === "user" ? "Promote" : "Edit Role"}
                      </button>
                    )}

                    {canDelete && !isEditing && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmUser(u)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
                      >
                        Delete
                      </button>
                    )}

                    <span className="text-stone-400">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100 pt-4">
          <p className="text-xs text-stone-500">
            Showing{" "}
            <span className="font-medium text-stone-800">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>
            –
            <span className="font-medium text-stone-800">
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total,
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-stone-800">
              {pagination.total}
            </span>{" "}
            {activeTab === "team" ? "team members" : "customers"}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="rounded-lg border border-stone-200/90 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs disabled:border-stone-100 disabled:bg-stone-50/50 disabled:text-stone-300 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers(pagination.page, pagination.totalPages).map(
                (p, idx) => {
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
                  const isActive = p === pagination.page;
                  return isActive ? (
                    <span
                      key={p}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold text-xs font-semibold text-white shadow-2xs"
                      aria-current="page"
                    >
                      {p}
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handlePageChange(p)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200/90 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs cursor-pointer"
                    >
                      {p}
                    </button>
                  );
                },
              )}
            </div>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="rounded-lg border border-stone-200/90 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs disabled:border-stone-100 disabled:bg-stone-50/50 disabled:text-stone-300 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-semibold text-stone-900">
                  Delete User Account
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-stone-900">
                    {deleteConfirmUser.name
                      ? `${deleteConfirmUser.name} (${deleteConfirmUser.email})`
                      : deleteConfirmUser.email}
                  </strong>
                  ?
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-red-50/80 border border-red-100 p-3 text-xs text-red-800 leading-relaxed">
              This action cannot be undone. All saved delivery addresses and
              profile information for this account will be erased from the
              database.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={isDeleting}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccount(deleteConfirmUser.id)}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
