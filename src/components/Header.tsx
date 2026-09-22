"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useCartStore, useCartHydrated } from "@/lib/cart/useCartStore";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const hydrated = useCartHydrated();
  const openCart = useCartStore((state) => state.openCart);
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    window.dispatchEvent(new CustomEvent("app:loading-start"));
    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      setSigningOut(false);
      window.dispatchEvent(new CustomEvent("app:loading-stop"));
    }
  };

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="JewelsCart Logo"
            width={28}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="font-display text-2xl font-semibold tracking-wide text-stone-900">
            Jewels<span className="text-gold">Cart</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <Link
            href="/discover"
            className={`text-sm font-medium tracking-wide transition-colors ${
              pathname === "/discover"
                ? "text-gold"
                : "text-stone-700 hover:text-gold"
            }`}
          >
            Discover
          </Link>
          <Link
            href="/about"
            className={`text-sm font-medium tracking-wide transition-colors ${
              pathname === "/about"
                ? "text-gold"
                : "text-stone-700 hover:text-gold"
            }`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`text-sm font-medium tracking-wide transition-colors ${
              pathname === "/contact"
                ? "text-gold"
                : "text-stone-700 hover:text-gold"
            }`}
          >
            Contact
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {/* Cart Bag Button */}
          <button
            type="button"
            onClick={openCart}
            className="group relative flex h-8.5 w-8.5 items-center justify-center rounded-full border border-stone-200/90 bg-stone-50/80 text-stone-700 transition hover:border-gold hover:text-gold active:scale-95"
            aria-label="View shopping bag"
          >
            <svg
              className="h-4.5 w-4.5 text-stone-600 group-hover:text-gold transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {hydrated && cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-in zoom-in-75 duration-150">
                {cartCount}
              </span>
            )}
          </button>

          {!mounted || status === "loading" ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-stone-200" />
          ) : session?.user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  userMenuOpen
                    ? "border-gold bg-amber-50/50 text-gold shadow-xs"
                    : "border-stone-200/90 bg-stone-50/80 text-stone-700 hover:border-gold hover:text-gold"
                }`}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 font-semibold text-gold text-[10px]">
                  {session.user.name
                    ? session.user.name.charAt(0).toUpperCase()
                    : session.user.email
                      ? session.user.email.charAt(0).toUpperCase()
                      : "U"}
                </span>
                <span className="max-w-27.5 truncate text-stone-800 font-medium">
                  {session.user.name ||
                    session.user.email?.split("@")[0] ||
                    "Account"}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180 text-gold" : ""
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

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-stone-200/90 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                  <div className="border-b border-stone-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-stone-900">
                        {session.user.name || "User"}
                      </p>
                    </div>
                    <p className="truncate text-[11px] text-stone-500 mt-0.5">
                      {session.user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    {["developer", "admin", "staff"].includes(
                      session.user.role ?? "",
                    ) && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          pathname.startsWith("/admin")
                            ? "bg-amber-50/60 text-gold font-semibold"
                            : "text-stone-700 hover:bg-amber-50/50 hover:text-gold"
                        }`}
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
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>Management Dashboard</span>
                      </Link>
                    )}

                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                        pathname === "/account"
                          ? "bg-amber-50/60 text-gold font-semibold"
                          : "text-stone-700 hover:bg-amber-50/50 hover:text-gold"
                      }`}
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

                  <div className="border-t border-stone-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-stone-200/90 bg-stone-50/60 px-4 py-1.5 text-xs font-medium tracking-wide uppercase text-stone-800 transition hover:border-gold hover:bg-amber-50/40 hover:text-gold"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Sign In</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          {/* Mobile Cart Trigger */}
          <button
            type="button"
            onClick={openCart}
            className="relative rounded-full p-2 text-stone-700 hover:text-gold transition"
            aria-label="View shopping bag"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {hydrated && cartCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white shadow-2xs">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="p-2 text-stone-700 transition-colors hover:text-gold"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? (
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
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white px-4 py-4 lg:hidden">
          <Link
            href="/discover"
            className="block py-2 text-stone-700 hover:text-gold"
            onClick={() => setOpen(false)}
          >
            Discover All Collections
          </Link>
          <Link
            href="/about"
            className="block py-2 text-stone-700 hover:text-gold"
            onClick={() => setOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block py-2 text-stone-700 hover:text-gold"
            onClick={() => setOpen(false)}
          >
            Contact
          </Link>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openCart();
            }}
            className="flex w-full items-center justify-between py-2 text-stone-700 hover:text-gold font-medium"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-gold"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Shopping Cart</span>
            </span>
            {hydrated && cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <div className="mt-4 border-t border-stone-200/80 pt-4">
            {!mounted || status === "loading" ? (
              <div className="my-2 h-12 w-full animate-pulse rounded-2xl bg-stone-100" />
            ) : session?.user ? (
              <div className="space-y-3">
                {/* User Identity */}
                <div className="flex items-center gap-3 px-1 py-1">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 font-semibold text-gold text-xs border border-amber-200/80 shadow-2xs">
                    {session.user.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : session.user.email
                        ? session.user.email.charAt(0).toUpperCase()
                        : "U"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {session.user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-0.5 pt-1">
                  {["developer", "admin", "staff"].includes(
                    session.user.role ?? "",
                  ) && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-stone-700 hover:bg-amber-50/60 hover:text-gold transition"
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
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Management Dashboard</span>
                    </Link>
                  )}

                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-stone-700 hover:bg-amber-50/60 hover:text-gold transition"
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

                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleSignOut();
                    }}
                    disabled={signingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 py-3 text-xs font-semibold tracking-wider uppercase text-white transition hover:bg-gold hover:border-gold shadow-xs"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
