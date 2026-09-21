import Link from "next/link";
import Image from "next/image";
import { requireDashboardAccess } from "@/lib/auth/rbac";
import { listProducts, type ProductDocument } from "@/lib/products";
import { buildMetadata } from "@/lib/seo";
import { isVideoMedia } from "@/lib/media";

export const metadata = buildMetadata({
  title: "Products Management",
  description: "Manage catalogue products, inventory, and creation",
  path: "/admin/products",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireDashboardAccess();
  const products = await listProducts(undefined, { fresh: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Products Catalogue
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage your jewellery inventory, edit attributes, or publish new
            pieces.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center rounded-xl bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-gold-light transition"
        >
          + Add Product
        </Link>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            All Products ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500 shadow-2xs">
            No products found in catalogue. Click &quot;Add Product&quot; to
            create your first item.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p: ProductDocument) => (
              <div
                key={p._id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-stone-300 hover:shadow-xs transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200">
                      {p.image ? (
                        isVideoMedia(p.image) ? (
                          <video
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                            src={p.image}
                          />
                        ) : (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                          No pic
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-stone-400 truncate">
                        /{p.slug}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700 font-medium">
                          {p.type}
                        </span>
                        {p.category && (
                          <span className="text-xs text-stone-500">
                            • {p.category}
                          </span>
                        )}
                        {p.price != null && (
                          <span className="text-xs font-semibold text-stone-900">
                            • ₹{p.price.toLocaleString("en-IN")}
                          </span>
                        )}
                        {p.stock_status && p.stock_status !== "in_stock" && (
                          <span className="rounded-md bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-stone-100">
                  <Link
                    href={`/admin/products/${p._id}/edit`}
                    className="inline-flex items-center rounded-xl bg-stone-50 border border-stone-200 px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-gold hover:text-white hover:border-gold transition"
                  >
                    Edit Product
                  </Link>
                  <Link
                    href={`/products/${p.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3.5 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition"
                  >
                    <span>Preview</span>
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
