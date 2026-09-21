"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AppRole, SafeUser } from "@/lib/auth/users";
import { RoleBadge } from "../UserList";

interface CreateUserFormProps {
  actorRole: string | undefined;
  allowedRoles: AppRole[];
  currentUserEmail?: string | null;
}

export function CreateUserForm({
  actorRole,
  allowedRoles,
  currentUserEmail,
}: CreateUserFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"assign" | "create">("assign");
  const [, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SafeUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [assignRole, setAssignRole] = useState<AppRole>(
    allowedRoles[0] ?? "staff",
  );
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>(allowedRoles[0] ?? "staff");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/admin/users?q=${encodeURIComponent(searchQuery.trim())}`,
        );
        if (res.ok) {
          const data: SafeUser[] = await res.json();
          setSearchResults(data);
        }
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setAssignError(null);
    setAssignSuccess(null);
    setAssignLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, role: assignRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAssignError(data.error || "Failed to update role");
        setAssignLoading(false);
        return;
      }

      setAssignSuccess(
        `Successfully assigned ${assignRole} role to ${selectedUser.email}`,
      );
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => {
        router.push("/admin/users");
      }, 1000);
    } catch {
      setAssignError("A network error occurred. Please try again.");
      setAssignLoading(false);
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
        setCreateLoading(false);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
      router.push("/admin/users");
    } catch {
      setCreateError("An unexpected network error occurred. Please try again.");
      setCreateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex rounded-xl bg-stone-100/90 p-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("assign");
            setAssignError(null);
            setAssignSuccess(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === "assign"
              ? "bg-white text-stone-900 shadow-2xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <svg
            className="h-4 w-4 text-gold"
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
          Assign Role to Existing Account
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("create");
            setCreateError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === "create"
              ? "bg-white text-stone-900 shadow-2xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <svg
            className="h-4 w-4 text-gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          Create New Account
        </button>
      </div>

      {/* TAB 1: ASSIGN ROLE TO EXISTING ACCOUNT */}
      {activeTab === "assign" && (
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Find Existing or Google Account
            </h2>
          </div>

          {assignSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
              {assignSuccess}
            </div>
          )}

          {assignError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {assignError}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email address or name (e.g. user@gmail.com)..."
              className="w-full rounded-xl border border-stone-200/90 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                Searching...
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchQuery.trim() && !selectedUser && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Matching Users ({searchResults.length})
              </p>

              {searchResults.length === 0 && !isSearching && (
                <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-500">
                  No accounts found matching &quot;{searchQuery}&quot;. If this
                  person hasn&apos;t signed up yet, switch to the &quot;Create
                  New Account&quot; tab.
                </div>
              )}

              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200/90 overflow-hidden">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (
                        currentUserEmail &&
                        user.email.toLowerCase() ===
                          currentUserEmail.toLowerCase()
                      ) {
                        setAssignError("You cannot change your own role.");
                        return;
                      }
                      if (user.role === "developer") {
                        setAssignError(
                          "Developer accounts are fixed and cannot be modified.",
                        );
                        return;
                      }
                      setAssignError(null);
                      setSelectedUser(user);
                      setAssignRole(
                        user.role === "admin" || user.role === "staff"
                          ? user.role
                          : (allowedRoles[0] ?? "staff"),
                      );
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-stone-50/80 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 font-display text-xs font-semibold text-stone-700 border border-stone-200">
                        {user.name
                          ? user.name.slice(0, 2).toUpperCase()
                          : user.email.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {user.name || (
                            <span className="text-stone-400 font-normal">
                              Not provided
                            </span>
                          )}
                        </p>
                        <p className="text-xs font-mono text-stone-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {user.provider === "google" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200/80">
                          <svg className="h-3 w-3" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                          </svg>
                          Google
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 border border-stone-200/80">
                          Credentials
                        </span>
                      )}
                      <RoleBadge role={user.role} />
                      <span className="text-xs font-semibold text-gold">
                        Select &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected User & Role Assignment Form */}
          {selectedUser && (
            <form onSubmit={handleAssignSubmit} className="space-y-6 pt-2">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                    Selected Account
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-xs font-medium text-stone-500 hover:text-stone-800 underline"
                  >
                    Change Account
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 font-display text-xs font-semibold text-stone-700 border border-stone-200">
                      {selectedUser.name
                        ? selectedUser.name.slice(0, 2).toUpperCase()
                        : selectedUser.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 text-sm truncate">
                        {selectedUser.name || (
                          <span className="text-stone-400 font-normal">
                            Not provided
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-mono text-stone-500 truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 capitalize">
                      Current:
                    </span>
                    <RoleBadge role={selectedUser.role} />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Select New Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {allowedRoles.map((r) => (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                        assignRole === r
                          ? "border-gold bg-amber-50/50 shadow-2xs ring-1 ring-gold"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <span className="text-sm font-semibold text-stone-900 capitalize">
                        {r === "admin" ? "Admin" : "Staff"}
                      </span>
                      <input
                        type="radio"
                        name="assignRoleRadio"
                        checked={assignRole === r}
                        onChange={() => setAssignRole(r)}
                        className="h-4 w-4 accent-gold"
                      />
                    </label>
                  ))}

                  {/* Option to demote to regular customer */}
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                      assignRole === "user"
                        ? "border-gold bg-amber-50/50 shadow-2xs ring-1 ring-gold"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-stone-700">
                      Customer
                    </span>
                    <input
                      type="radio"
                      name="assignRoleRadio"
                      checked={assignRole === "user"}
                      onChange={() => setAssignRole("user")}
                      className="h-4 w-4 accent-gold"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-light transition disabled:opacity-60"
                >
                  {assignLoading ? "Updating..." : "Save Role Assignment"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: CREATE NEW CREDENTIALS ACCOUNT */}
      {activeTab === "create" && (
        <form
          onSubmit={handleCreateSubmit}
          className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-2xs space-y-6"
        >
          {createError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {createError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="create_name"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1"
              >
                Full Name (Optional)
              </label>
              <input
                id="create_name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Yog Mehta"
                className="w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>

            <div>
              <label
                htmlFor="create_email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1"
              >
                Email Address *
              </label>
              <input
                id="create_email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="yog@theyogmehta.online"
                className="w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>

            <div>
              <label
                htmlFor="create_password"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1"
              >
                Initial Password *
              </label>
              <div className="relative">
                <input
                  id="create_password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-stone-200/90 bg-white pl-3.5 pr-12 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500 hover:text-stone-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Minimum 6 characters.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Assigned Role *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allowedRoles.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                      newRole === r
                        ? "border-gold bg-amber-50/50 shadow-2xs ring-1 ring-gold"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-stone-900 capitalize">
                      {r === "admin" ? "Admin" : "Staff"}
                    </span>
                    <input
                      type="radio"
                      name="createRoleRadio"
                      checked={newRole === r}
                      onChange={() => setNewRole(r)}
                      className="h-4 w-4 accent-gold"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <Link
              href="/admin/users"
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-light transition disabled:opacity-60"
            >
              {createLoading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
