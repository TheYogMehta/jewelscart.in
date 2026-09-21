"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface Props {
  canManageUsers: boolean;
  canViewLogs?: boolean;
  userEmail?: string | null;
}

export function AdminNavbar({ canManageUsers, canViewLogs, userEmail }: Props) {
  const pathname = usePathname();
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [mobileCatalogueOpen, setMobileCatalogueOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCatalogueOpen(false);
    setMobileCatalogueOpen(false);
  }, [pathname]);

  const isCatalogueActive =
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/categories");

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCatalogueOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setCatalogueOpen(false);
    }, 150);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5 lg:px-8">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 text-stone-900"
          >
            <Image
              src="/logo.svg"
              alt="JewelsCart Logo"
              width={26}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="font-display text-xl font-semibold tracking-wide text-stone-900">
              Jewels<span className="text-gold">Cart</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {/* Analytics */}
            <Link
              href="/admin"
              className={`rounded-xl px-3 py-1.5 font-medium transition ${
                pathname === "/admin"
                  ? "bg-amber-50/70 text-gold font-semibold"
                  : "text-stone-700 hover:bg-stone-50 hover:text-gold"
              }`}
            >
              Analytics
            </Link>

            {/* Catalogue Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setCatalogueOpen((prev) => !prev)}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 font-medium transition ${
                  isCatalogueActive || catalogueOpen
                    ? "bg-amber-50/70 text-gold font-semibold"
                    : "text-stone-700 hover:bg-stone-50 hover:text-gold"
                }`}
              >
                Catalogue
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${catalogueOpen ? "rotate-180 text-gold" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {catalogueOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl border border-stone-200/90 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                  <Link
                    href="/admin/products"
                    className={`block rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      pathname.startsWith("/admin/products")
                        ? "bg-amber-50/60 text-gold"
                        : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                    onClick={() => setCatalogueOpen(false)}
                  >
                    Products & SKUs
                  </Link>
                  <div className="my-1 border-t border-stone-100" />
                  <Link
                    href="/admin/categories"
                    className={`block rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      pathname.startsWith("/admin/categories")
                        ? "bg-amber-50/60 text-gold"
                        : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                    onClick={() => setCatalogueOpen(false)}
                  >
                    Categories & Navigation
                  </Link>
                </div>
              )}
            </div>

            {/* Site Content */}
            <Link
              href="/admin/content"
              className={`rounded-xl px-3 py-1.5 font-medium transition ${
                pathname.startsWith("/admin/content")
                  ? "bg-amber-50/70 text-gold font-semibold"
                  : "text-stone-700 hover:bg-stone-50 hover:text-gold"
              }`}
            >
              Site Content
            </Link>

            {/* Users */}
            {canManageUsers && (
              <Link
                href="/admin/users"
                className={`rounded-xl px-3 py-1.5 font-medium transition ${
                  pathname.startsWith("/admin/users")
                    ? "bg-amber-50/70 text-gold font-semibold"
                    : "text-stone-700 hover:bg-stone-50 hover:text-gold"
                }`}
              >
                Users
              </Link>
            )}

            {/* Activity Logs */}
            {canViewLogs && (
              <Link
                href="/admin/logs"
                className={`rounded-xl px-3 py-1.5 font-medium transition ${
                  pathname.startsWith("/admin/logs")
                    ? "bg-amber-50/70 text-gold font-semibold"
                    : "text-stone-700 hover:bg-stone-50 hover:text-gold"
                }`}
              >
                Logs
              </Link>
            )}
          </nav>
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            href="/"
            title="View Storefront"
            aria-label="View Storefront"
            className="p-1.5 text-stone-600 transition hover:text-gold"
          >
            <svg
              className="h-5.5 w-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </Link>

          <Link
            href="/account"
            title="My Account"
            aria-label="My Account"
            className="p-1.5 text-stone-600 transition hover:text-gold"
          >
            <svg
              className="h-5.5 w-5.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>

        {/* Mobile Hamburger / Close Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="p-1 text-stone-700 hover:text-gold transition md:hidden"
        >
          {mobileMenuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-200 bg-white px-4 py-4 md:hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="space-y-1">
            {/* Analytics */}
            <Link
              href="/admin"
              className={`block py-2 text-base font-medium transition ${
                pathname === "/admin"
                  ? "text-gold font-semibold"
                  : "text-stone-700 hover:text-gold"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Analytics
            </Link>

            {/* Catalogue Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setMobileCatalogueOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between py-2 text-base font-medium transition ${
                  isCatalogueActive
                    ? "text-gold font-semibold"
                    : "text-stone-700 hover:text-gold"
                }`}
              >
                <span>Catalogue</span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${
                    mobileCatalogueOpen
                      ? "rotate-180 text-gold"
                      : "text-stone-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {mobileCatalogueOpen && (
                <div className="ml-3 border-l-2 border-amber-200/60 pl-3 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link
                    href="/admin/products"
                    className={`block py-1.5 text-sm font-medium transition ${
                      pathname.startsWith("/admin/products")
                        ? "text-gold font-semibold"
                        : "text-stone-600 hover:text-gold"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products & SKUs
                  </Link>
                  <Link
                    href="/admin/categories"
                    className={`block py-1.5 text-sm font-medium transition ${
                      pathname.startsWith("/admin/categories")
                        ? "text-gold font-semibold"
                        : "text-stone-600 hover:text-gold"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Categories & Navigation
                  </Link>
                </div>
              )}
            </div>

            {/* Site Content */}
            <Link
              href="/admin/content"
              className={`block py-2 text-base font-medium transition ${
                pathname.startsWith("/admin/content")
                  ? "text-gold font-semibold"
                  : "text-stone-700 hover:text-gold"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Site Content
            </Link>

            {/* Users */}
            {canManageUsers && (
              <Link
                href="/admin/users"
                className={`block py-2 text-base font-medium transition ${
                  pathname.startsWith("/admin/users")
                    ? "text-gold font-semibold"
                    : "text-stone-700 hover:text-gold"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                User Management
              </Link>
            )}

            {/* Activity Logs */}
            {canManageUsers && (
              <Link
                href="/admin/logs"
                className={`block py-2 text-base font-medium transition ${
                  pathname.startsWith("/admin/logs")
                    ? "text-gold font-semibold"
                    : "text-stone-700 hover:text-gold"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Activity Logs
              </Link>
            )}
          </div>

          {/* User Account & Storefront Links */}
          <div className="mt-4 border-t border-stone-200/80 pt-4 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-gold transition"
            >
              <svg
                className="h-4 w-4 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              <span>View Storefront</span>
            </Link>

            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-gold transition"
            >
              <svg
                className="h-4 w-4 text-stone-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>My Account</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
