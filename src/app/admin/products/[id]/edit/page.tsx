"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/app/admin/products/ProductForm";
import type { ProductDocument } from "@/lib/products";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<ProductDocument | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/products/${id}`)
        .then((r) => {
          if (!r.ok) throw new Error("Product not found");
          return r.json() as Promise<ProductDocument>;
        })
        .then((data) => {
          setProduct(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load product");
          setLoading(false);
        });
    });
  }, [params]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-stone-400">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <p className="font-semibold">{error || "Product not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}
