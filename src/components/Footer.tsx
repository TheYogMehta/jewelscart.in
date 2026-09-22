"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="mt-16 border-t border-stone-800 bg-stone-900 text-stone-300 print:hidden">
      {/* Brand & Social/Location Icons */}
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row lg:px-8">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center gap-2.5 sm:justify-start">
            <Image
              src="/logo.svg"
              alt="JewelsCart"
              width={24}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <p className="font-display text-xl text-white">JewelsCart</p>
          </div>
          <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-stone-400">
            Leading handmade and handcrafted jewellery brand and manufacturer
            based in India.
          </p>
        </div>

        {/* Social & Contact Icons */}
        <div className="flex items-center gap-3">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/jewelscart/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-800/80 text-stone-300 transition hover:border-gold hover:bg-stone-800 hover:text-gold shadow-xs"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>

          {/* Direct Phone */}
          <a
            href="tel:+919920685652"
            aria-label="Direct Phone"
            title="Call +91 99206 85652"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-800/80 text-stone-300 transition hover:border-gold hover:bg-stone-800 hover:text-gold shadow-xs"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/919920685652"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            title="Chat on WhatsApp"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-800/80 text-stone-300 transition hover:border-gold hover:bg-stone-800 hover:text-gold shadow-xs"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>

          {/* Map Location */}
          <a
            href="https://maps.app.goo.gl/5HcSwi4zJPFAZFa26"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Studio Location"
            title="Google Maps Location"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-800/80 text-stone-300 transition hover:border-gold hover:bg-stone-800 hover:text-gold shadow-xs"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Navigation & Legal Links */}
      <div className="border-t border-stone-800 py-6 text-xs text-stone-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-8">
          <div>
            © {new Date().getFullYear()} JewelsCart. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="/terms-of-service"
              className="hover:text-stone-300 transition"
            >
              Terms of Service
            </Link>
            <Link href="/policy" className="hover:text-stone-300 transition">
              Policies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
