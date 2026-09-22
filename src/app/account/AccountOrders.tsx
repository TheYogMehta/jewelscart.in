"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Order } from "@/lib/orders/types";

interface Props {
  initialOrders: Order[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: "Order Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
    dotClass: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
    dotClass: "bg-blue-500",
  },
  processing: {
    label: "In Production",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
    dotClass: "bg-indigo-500",
  },
  shipped: {
    label: "Dispatched",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200/80",
    dotClass: "bg-violet-500",
  },
  in_transit: {
    label: "In Transit",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200/80",
    dotClass: "bg-purple-500",
  },
  delivered: {
    label: "Delivered",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dotClass: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-green-50 text-green-800 border-green-200/80",
    dotClass: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-red-50 text-red-800 border-red-200/80",
    dotClass: "bg-red-500",
  },
};

export function AccountOrders({ initialOrders }: Props) {
  const [orders] = useState<Order[]>(initialOrders);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-stone-200/90 bg-white p-8 sm:p-14 text-center shadow-xs">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-gold mb-6 border border-amber-200/50">
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-stone-900 sm:text-2xl">
          No Orders Placed Yet
        </h3>
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          When you purchase handcrafted fine jewellery from JewelsCart, your
          order receipts, tracking numbers, and delivery status will appear
          right here.
        </p>
        <div className="mt-8">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-gold-light transition cursor-pointer active:scale-98"
          >
            <span>Discover Collections</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-wide text-stone-900">
            Order History
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            View details, delivery status, and tracking for all your previous
            purchases.
          </p>
        </div>
        <span className="rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">
          {orders.length} {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      <div className="space-y-6">
        {paginatedOrders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status] || {
            label: order.status.toUpperCase(),
            badgeClass: "bg-stone-100 text-stone-800 border-stone-200",
            dotClass: "bg-stone-500",
          };

          const formattedDate = new Date(order.createdAt).toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            },
          );

          const address =
            typeof order.shippingAddress === "string"
              ? (() => {
                  try {
                    return JSON.parse(order.shippingAddress);
                  } catch {
                    return {};
                  }
                })()
              : order.shippingAddress || {};

          const isDeliveredOrCompleted =
            order.status === "delivered" || order.status === "completed";

          const recipientName =
            address.fullName || order.userName || "Customer";
          const cityState = [address.city, address.state]
            .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
            .filter(Boolean)
            .join(", ");
          const destination = [
            cityState,
            address.pincode ? `(${String(address.pincode).trim()})` : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={order.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs transition hover:border-stone-300"
            >
              {/* Order Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/80 px-4 sm:px-5 py-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-stone-900">
                    {order.orderNumber}
                  </span>
                  <span className="text-stone-300">&bull;</span>
                  <span className="text-stone-500">{formattedDate}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.badgeClass}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`}
                    />
                    <span>{statusConfig.label}</span>
                  </div>

                  <Link
                    href={`/order-confirmation/${order.orderNumber}`}
                    className="text-xs font-medium text-amber-800 hover:text-amber-900 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Receipt</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Active Tracking Banner (ONLY for active transit/processing orders, NOT delivered/completed) */}
              {!isDeliveredOrCompleted && order.trackingId && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/60 px-4 sm:px-5 py-2 text-xs">
                  <div className="flex items-center gap-2 text-stone-600">
                    <svg
                      className="h-3.5 w-3.5 text-amber-700 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                      />
                    </svg>
                    <span>
                      {order.trackingCourier ? (
                        <span className="font-semibold text-stone-900">
                          {order.trackingCourier}:{" "}
                        </span>
                      ) : (
                        "Dispatched: "
                      )}
                      <span className="font-mono text-stone-700">
                        {order.trackingId}
                      </span>
                    </span>
                  </div>

                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-900 hover:underline"
                    >
                      <span>Track Package</span>
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="divide-y divide-stone-100 px-4 sm:px-5">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.productImage ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-200/80 bg-stone-100">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-400 text-xs">
                          Item
                        </div>
                      )}

                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="font-medium text-stone-900 hover:text-amber-800 transition text-xs sm:text-sm line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                          {item.productSku && (
                            <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                              {item.productSku}
                            </span>
                          )}
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-xs sm:text-sm font-semibold text-stone-900">
                        ₹
                        {Number(
                          item.totalPrice || item.unitPrice * item.quantity,
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer / Delivery & Total */}
              <div className="border-t border-stone-100 bg-stone-50/50 px-4 sm:px-5 py-2.5 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg
                    className="h-3.5 w-3.5 text-stone-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">
                    {isDeliveredOrCompleted
                      ? "Delivered to "
                      : "Delivering to "}
                    <strong className="text-stone-700 font-medium">
                      {recipientName}
                    </strong>
                    {destination ? `, ${destination}` : ""}
                  </span>
                  {isDeliveredOrCompleted && order.trackingCourier && (
                    <span className="text-stone-400 text-[11px] hidden sm:inline">
                      &bull; via {order.trackingCourier}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {order.paymentId && (
                    <span className="font-mono text-[11px] text-stone-400 hidden md:inline">
                      Payment ID: {order.paymentId}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-stone-900">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-400">
                      Total
                    </span>
                    <span className="text-xs sm:text-sm font-bold">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Orders Pagination Bar (Always visible) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200/80 text-xs">
        <div className="flex items-center gap-3 text-stone-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-stone-800">
              {orders.length === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, orders.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-stone-800">
              {orders.length}
            </span>{" "}
            {orders.length === 1 ? "order" : "orders"}
            {totalPages > 0 && (
              <>
                {" "}
                (Page{" "}
                <span className="font-semibold text-stone-800">
                  {page}
                </span> of{" "}
                <span className="font-semibold text-stone-800">
                  {totalPages}
                </span>
                )
              </>
            )}
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-stone-200">
            <span className="text-stone-400">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-700 text-xs focus:outline-none focus:border-stone-400 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page <= 1}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`h-7 w-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                    page === p
                      ? "bg-stone-900 text-white shadow-2xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page >= totalPages}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
