"use client";

import { useState, useEffect } from "react";
import type { AddressRecord } from "@/lib/addresses";
import type { Order } from "@/lib/orders/types";
import { AccountAddresses } from "./AccountAddresses";
import { AccountSecurity } from "./AccountSecurity";
import { AccountPrivacyPreferences } from "./AccountPrivacyPreferences";
import { AccountOrders } from "./AccountOrders";

type TabKey = "orders" | "addresses" | "security" | "privacy";

interface UserProps {
  id: number;
  name: string;
  email: string;
  memberSince: string;
  isEmailVerified: boolean;
  isGoogleLinked: boolean;
  hasPassword: boolean;
  provider: string;
  role: string;
}

interface Props {
  user: UserProps;
  initialAddresses: AddressRecord[];
  initialOrders: Order[];
}

export function AccountDashboard({
  user,
  initialAddresses,
  initialOrders,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("orders");
  const [displayName, setDisplayName] = useState(user.name);
  const [addressCount, setAddressCount] = useState(initialAddresses.length);

  // Inline Name Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (
      hash === "orders" ||
      hash === "addresses" ||
      hash === "security" ||
      hash === "privacy"
    ) {
      setActiveTab(hash as TabKey);
    }
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setNameError("Name cannot be empty");
      return;
    }

    setSavingName(true);
    setNameError(null);
    setNameSuccess(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile name");
      }

      setDisplayName(data.user.name);
      setIsEditingName(false);
      setNameSuccess("Name updated successfully.");
      setTimeout(() => setNameSuccess(null), 4000);
    } catch (err: unknown) {
      setNameError(
        err instanceof Error ? err.message : "Failed to update name",
      );
    } finally {
      setSavingName(false);
    }
  };

  const avatarLetter = (displayName || user.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10 lg:px-8 space-y-6">
      {/* Luxury Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Refined Monogram Avatar */}
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-stone-900 font-serif text-xl sm:text-2xl font-bold text-amber-200 border-2 border-amber-700/30 shadow-2xs">
              {avatarLetter}
            </div>

            {/* User Credentials */}
            <div className="flex-1 min-w-0">
              {!isEditingName ? (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900 tracking-tight truncate">
                    {displayName}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(displayName);
                      setIsEditingName(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-600 hover:border-stone-400 hover:text-stone-900 transition cursor-pointer shrink-0"
                    title="Edit Name"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSaveName}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    className="rounded-lg bg-stone-900 px-3 py-1 text-xs font-semibold text-white hover:bg-stone-800 transition disabled:opacity-50 cursor-pointer"
                  >
                    {savingName ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameError(null);
                    }}
                    className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {nameError && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {nameError}
                </p>
              )}
              {nameSuccess && (
                <p className="mt-1 text-xs font-medium text-emerald-600">
                  {nameSuccess}
                </p>
              )}

              <p className="mt-0.5 text-xs text-stone-500">{user.email}</p>
              <p className="mt-0.5 text-[11px] text-stone-400">
                Member since {user.memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Segmented Tab Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl bg-stone-100/80 p-1 border border-stone-200/70">
        {/* Tab: Orders & Purchases */}
        <button
          type="button"
          onClick={() => handleTabChange("orders")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "orders"
              ? "bg-white text-stone-900 shadow-2xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-50/50"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 text-stone-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span>Orders & Purchases</span>
          {initialOrders.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "orders"
                  ? "bg-stone-100 text-stone-800"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              {initialOrders.length}
            </span>
          )}
        </button>

        {/* Tab: Address & Delivery */}
        <button
          type="button"
          onClick={() => handleTabChange("addresses")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "addresses"
              ? "bg-white text-stone-900 shadow-2xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-50/50"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 text-stone-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Address & Delivery</span>
          {addressCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "addresses"
                  ? "bg-stone-100 text-stone-800"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              {addressCount}
            </span>
          )}
        </button>

        {/* Tab: Sign-In & Security */}
        <button
          type="button"
          onClick={() => handleTabChange("security")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "security"
              ? "bg-white text-stone-900 shadow-2xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-50/50"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 text-stone-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Sign-In & Security</span>
        </button>

        {/* Tab: Privacy Preferences */}
        <button
          type="button"
          onClick={() => handleTabChange("privacy")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "privacy"
              ? "bg-white text-stone-900 shadow-2xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-50/50"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 text-stone-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Privacy Preferences</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-200">
        {activeTab === "orders" && (
          <AccountOrders initialOrders={initialOrders} />
        )}

        {activeTab === "addresses" && (
          <AccountAddresses
            initialAddresses={initialAddresses}
            userName={displayName}
            userEmail={user.email}
            onAddressCountChange={(cnt) => setAddressCount(cnt)}
          />
        )}

        {activeTab === "security" && (
          <AccountSecurity
            email={user.email}
            hasPassword={user.hasPassword}
            isEmailVerified={user.isEmailVerified}
            isGoogleLinked={user.isGoogleLinked}
            provider={user.provider}
          />
        )}

        {activeTab === "privacy" && <AccountPrivacyPreferences />}
      </div>
    </div>
  );
}
