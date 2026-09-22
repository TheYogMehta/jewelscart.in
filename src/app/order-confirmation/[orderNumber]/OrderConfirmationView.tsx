"use client";

import Link from "next/link";
import type { Order } from "@/lib/orders/types";
import OrderReceiptCard from "@/components/orders/OrderReceiptCard";

interface Props {
  order: Order;
}

export default function OrderConfirmationView({ order }: Props) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/70 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:p-8 print:m-0 print:min-h-0">
      <div className="mx-auto max-w-3xl space-y-6 print:max-w-none print:w-full print:space-y-0">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs print:hidden">
          <Link
            href="/account#orders"
            className="inline-flex items-center gap-1.5 font-medium text-stone-500 hover:text-stone-900 transition"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to My Orders</span>
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 font-medium text-stone-600 hover:text-stone-900 transition cursor-pointer"
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
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Unified Luxury Receipt Card */}
        <OrderReceiptCard order={order} />

        {/* Refined Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden">
          <Link
            href="/account#orders"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-stone-900 px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-stone-800 transition"
          >
            View in My Account
          </Link>
          <Link
            href="/discover"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-7 py-3 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-50 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
