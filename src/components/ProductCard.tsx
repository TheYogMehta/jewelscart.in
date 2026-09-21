import Link from "next/link";
import Image from "next/image";
import type { ProductDocument } from "@/lib/products";
import { isVideoMedia } from "@/lib/media";

export function ProductCard({ product }: { product: ProductDocument }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs transition hover:border-stone-300 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        {isVideoMedia(product.image) ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={product.image}
          />
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gold truncate">
            {product.type}
          </p>
          {product.price != null && (
            <p className="text-sm font-semibold text-stone-900 shrink-0">
              /- ₹{product.price.toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <h3 className="font-display mt-1.5 text-base font-medium text-stone-900 line-clamp-1 transition group-hover:text-gold">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-stone-400 truncate">
          {product.category}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductDocument[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 py-16 text-center text-sm text-stone-400">
        No jewellery pieces found in catalogue.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
}
