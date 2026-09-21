import { buildMetadata } from "@/lib/seo";
import { getPageContent } from "@/lib/content";
import { PageHero } from "@/components/PageHero";

export const revalidate = 60;

export const metadata = buildMetadata({
  title: "Contact Us & Location",
  description:
    "Get in touch with JewelsCart for custom jewellery inquiries, WhatsApp consultations, and store directions in Mumbai.",
  path: "/contact",
});

export default async function ContactPage() {
  const heroContent = await getPageContent("contact");

  return (
    <div className="bg-[#fcfbfa] min-h-screen">
      <PageHero content={heroContent} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Full-Row Interactive Map Card */}
        <div className="w-full overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-xs">
          {/* Map Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/70 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-gold"></span>
              </span>
              <div>
                <h2 className="font-display text-base font-semibold text-stone-900">
                  JewelsCart
                </h2>
                <p className="text-xs text-stone-500">
                  Mumbai, Maharashtra, India
                </p>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/5HcSwi4zJPFAZFa26"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-700 shadow-2xs transition hover:border-gold hover:text-gold"
            >
              <svg
                className="h-3.5 w-3.5 text-gold"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              Get Directions &rarr;
            </a>
          </div>

          {/* Live Embedded Map Viewport (Takes Whole Row) */}
          <div className="relative h-95 w-full bg-stone-100 sm:h-115 lg:h-125">
            <iframe
              src={
                "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3773.493809635745!2d72.82047007596264!3d18.95855948222019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7cfbdc528e661%3A0xd0d8386ad574663e!2sJEWELSCART!5e0!3m2!1sen!2sin!4v1716000000000!5m2!1sen!2sin"
              }
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="JewelsCart Location Map"
            />
          </div>

          {/* Map Footer Info */}
          <div className="border-t border-stone-100 bg-white px-6 py-3.5 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-stone-400"
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
              <span className="font-medium text-stone-700">
                Open Monday to Saturday 11:30 AM to 7:00 PM
              </span>
            </div>
          </div>
        </div>

        {/* Direct Contact Channels */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-10 shadow-xs">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              Direct Contact
            </span>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl font-semibold text-stone-900">
              Get in Touch
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
              Connect with our artisans and customer desk directly for custom
              orders, bridal jewelry, color matching, and order assistance.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* WhatsApp */}
            <a
              href="https://wa.me/919920685652"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/50 p-5 transition duration-200 hover:border-gold hover:bg-amber-50/20 hover:shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60 transition group-hover:scale-105">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    WhatsApp Support
                  </p>
                  <p className="font-display text-base font-semibold text-stone-900">
                    +91 99206 85652
                  </p>
                  <p className="text-xs text-stone-500">
                    Instant styling guidance & quotes
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-gold transition group-hover:translate-x-1">
                Chat &rarr;
              </span>
            </a>

            {/* Direct Phone Call */}
            <a
              href="tel:+919920685652"
              className="group flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/50 p-5 transition duration-200 hover:border-gold hover:bg-amber-50/20 hover:shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60 transition group-hover:scale-105">
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
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Direct Phone
                  </p>
                  <p className="font-display text-base font-semibold text-stone-900">
                    +91 99206 85652
                  </p>
                  <p className="text-xs text-stone-500">
                    Mon – Sat · 11:30 AM – 7:00 PM IST
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-gold transition group-hover:translate-x-1">
                Call &rarr;
              </span>
            </a>

            {/* Official Support Email */}
            <a
              href="mailto:jewelscart2@gmail.com"
              className="group flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/50 p-5 transition duration-200 hover:border-gold hover:bg-amber-50/20 hover:shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60 transition group-hover:scale-105">
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
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Support Email
                  </p>
                  <p className="font-display text-base font-semibold text-stone-900 truncate">
                    jewelscart2@gmail.com
                  </p>
                  <p className="text-xs text-stone-500">
                    Order updates & assistance
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-gold transition group-hover:translate-x-1">
                Email &rarr;
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/jewelscart/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/50 p-5 transition duration-200 hover:border-gold hover:bg-amber-50/20 hover:shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-gold border border-amber-200/60 transition group-hover:scale-105">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Instagram DM
                  </p>
                  <p className="font-display text-base font-semibold text-stone-900">
                    @jewelscart
                  </p>
                  <p className="text-xs text-stone-500">
                    Direct messaging & latest pieces
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-gold transition group-hover:translate-x-1">
                Message &rarr;
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
