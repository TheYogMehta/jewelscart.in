"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/cart/useCartStore";

interface AddToCartButtonProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price?: number | null;
    image: string;
    type?: string;
    category?: string;
    sku?: string;
    qty?: number | null;
    stock_status?: string;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const openCart = useCartStore((state) => state.openCart);

  useEffect(() => {
    setMounted(true);
    setCurrentUrl(window.location.href);
  }, []);

  const itemId = String(product.id || (product as any)._id || product.slug);
  const cartItem = mounted
    ? items.find(
        (i) =>
          i.id === itemId ||
          i.productId === itemId ||
          (product.slug && i.slug === product.slug),
      )
    : null;

  const currentInBag = cartItem ? cartItem.quantity : 0;
  const isInBag = currentInBag > 0;

  const maxStock = product.qty != null ? Number(product.qty) : Infinity;
  const isOutOfStock =
    product.stock_status === "out_of_stock" ||
    (product.qty != null && Number(product.qty) <= 0);
  const hasNoPrice = product.price == null || product.price <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock || hasNoPrice) return;

    addItem(
      {
        id: itemId,
        productId: itemId,
        slug: product.slug,
        name: product.name,
        price: product.price as number,
        image: product.image,
        type: product.type,
        category: product.category,
        sku: product.sku,
        maxStock: product.qty != null ? Number(product.qty) : null,
      },
      1,
    );
  };

  const handleDecrement = () => {
    if (cartItem) {
      if (currentInBag <= 1) {
        removeItem(cartItem.id);
      } else {
        updateQuantity(cartItem.id, currentInBag - 1);
      }
    }
  };

  const handleIncrement = () => {
    if (cartItem) {
      if (currentInBag >= maxStock) return;
      updateQuantity(cartItem.id, currentInBag + 1);
    }
  };

  if (hasNoPrice) {
    return null;
  }

  const isMaxStockReached = currentInBag >= maxStock;

  return (
    <div className="flex flex-col gap-3 w-full sm:w-auto">
      {/* Stock note if limited */}
      {!isOutOfStock && product.qty != null && product.qty <= 5 && (
        <p className="text-xs font-medium text-amber-700">
          Only {product.qty} unit{product.qty === 1 ? "" : "s"} left in stock
        </p>
      )}

      {/* Quantity & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {isOutOfStock ? (
          <button
            type="button"
            disabled
            className="flex h-11 items-center justify-center rounded-full bg-stone-200 px-7 text-xs font-semibold uppercase tracking-wider text-stone-400 cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : isInBag ? (
          <div className="flex h-11 items-center rounded-full border border-stone-300 bg-stone-50/90 px-2 shadow-2xs">
            <button
              type="button"
              onClick={handleDecrement}
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-600 hover:bg-white hover:text-stone-900 transition cursor-pointer text-base font-bold"
              aria-label={
                currentInBag === 1 ? "Remove from bag" : "Decrease quantity"
              }
              title={
                currentInBag === 1 ? "Remove from bag" : "Decrease quantity"
              }
            >
              -
            </button>
            <span className="w-9 text-center text-xs font-semibold text-stone-900">
              {currentInBag}
            </span>
            <button
              type="button"
              disabled={isMaxStockReached}
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-600 hover:bg-white hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-base font-bold"
              aria-label="Increase quantity"
              title={
                isMaxStockReached ? `Maximum available: ${maxStock}` : undefined
              }
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-stone-900 px-7 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 shadow-xs transition cursor-pointer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span>Add to Bag</span>
          </button>
        )}

        {/* Inquire via WhatsApp */}
        <a
          href={`https://wa.me/919920685652?text=${encodeURIComponent(
            `Hi JewelsCart, I want to inquire about this product: ${product.name} (${currentUrl || `https://jewelscart.in/products/${product.slug}`})`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-6 text-xs font-medium uppercase tracking-wider text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition"
        >
          <svg
            className="h-4 w-4 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>Inquire</span>
        </a>
      </div>
    </div>
  );
}

export function QuickAddToCartButton({
  product,
  className = "",
}: {
  product: {
    id?: string | number;
    _id?: string;
    slug: string;
    name: string;
    price?: number | null;
    image: string;
    type?: string;
    category?: string;
    sku?: string;
    qty?: number | null;
    stock_status?: string;
  };
  className?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);

  const itemId = String(product._id || product.id || product.slug);
  const cartItem = items.find((i) => i.id === itemId);
  const currentInBag = cartItem ? cartItem.quantity : 0;

  const maxStock = product.qty != null ? Number(product.qty) : Infinity;
  const isOutOfStock =
    product.stock_status === "out_of_stock" ||
    (product.qty != null && Number(product.qty) <= 0);
  const hasNoPrice = product.price == null || product.price <= 0;

  if (hasNoPrice) return null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    addItem(
      {
        id: itemId,
        productId: itemId,
        slug: product.slug,
        name: product.name,
        price: product.price as number,
        image: product.image,
        type: product.type,
        category: product.category,
        sku: product.sku,
        maxStock: product.qty != null ? Number(product.qty) : null,
      },
      1,
    );
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(itemId, currentInBag - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentInBag >= maxStock) return;
    updateQuantity(itemId, currentInBag + 1);
  };

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 py-2 px-3 text-xs font-semibold text-stone-400 cursor-not-allowed ${className}`}
      >
        <span>Out of Stock</span>
      </button>
    );
  }

  if (currentInBag > 0) {
    const isMaxStock = currentInBag >= maxStock;

    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`flex w-full items-center justify-between rounded-xl border border-gold/40 bg-amber-50/70 p-1 text-xs font-semibold shadow-2xs ${className}`}
      >
        <button
          type="button"
          onClick={handleDecrement}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-700 shadow-2xs hover:bg-stone-900 hover:text-white transition active:scale-90"
          aria-label={`Decrease ${product.name} quantity`}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className="flex items-center gap-1 font-bold text-stone-900 text-xs px-2 select-none">
          <span>{currentInBag}</span>
          <span className="font-normal text-stone-600 text-[11px]">in bag</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={isMaxStock}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-90 ${
            isMaxStock
              ? "bg-stone-100 text-stone-300 cursor-not-allowed"
              : "bg-white text-stone-700 shadow-2xs hover:bg-stone-900 hover:text-white"
          }`}
          aria-label={`Increase ${product.name} quantity`}
          title={
            isMaxStock ? `Max available (${maxStock}) reached` : "Add one more"
          }
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleQuickAdd}
      aria-label={`Add ${product.name} to cart`}
      className={`group/btn relative flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200/90 bg-stone-50/80 py-2 px-3 text-xs font-semibold text-stone-800 transition hover:border-gold hover:bg-gold hover:text-white active:scale-98 shadow-2xs ${className}`}
    >
      <svg
        className="h-3.5 w-3.5 text-stone-600 group-hover/btn:text-white transition-colors"
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
      <span>+ Add to Bag</span>
    </button>
  );
}
