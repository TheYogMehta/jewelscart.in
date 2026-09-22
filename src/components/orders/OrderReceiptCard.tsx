"use client";

import Link from "next/link";
import Image from "next/image";
import type { Order } from "@/lib/orders/types";

interface Props {
  order: Order;
  className?: string;
}

export default function OrderReceiptCard({ order, className }: Props) {
  const addr =
    typeof order.shippingAddress === "string"
      ? (() => {
          try {
            return JSON.parse(order.shippingAddress);
          } catch {
            return {};
          }
        })()
      : order.shippingAddress || {};

  const recipientName = addr.fullName || order.userName || "Customer";
  const cityState = [addr.city, addr.state]
    .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join(", ");
  const destination = [
    cityState,
    addr.pincode ? `(${String(addr.pincode).trim()})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs print:border print:border-stone-300 print:rounded-2xl print:shadow-none print:w-full ${
        className || ""
      }`}
    >
      {/* Header Section */}
      <div className="relative p-6 sm:p-8 text-center border-b border-stone-100">
        <div className="sm:absolute sm:top-6 sm:right-8 text-center sm:text-right text-xs mb-3 sm:mb-0">
          <span className="font-medium text-stone-700 block">{formattedDate}</span>
          <span className="text-[11px] text-stone-400 block">{formattedTime}</span>
        </div>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 mb-4">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 tracking-tight">
          Order Confirmed
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          Thank you, <strong className="font-medium text-stone-800">{recipientName}</strong>.
          A receipt has been sent to{" "}
          <span className="font-medium text-stone-800">{order.userEmail}</span>.
        </p>
      </div>

      {/* Purchased Items List */}
      <div className="p-6 sm:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
          Purchased Pieces ({order.items?.length || 0})
        </h2>

        <div className="divide-y divide-stone-100">
          {(order.items || []).map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-200/80 bg-stone-100">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400 text-xs">
                      Item
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="font-medium text-xs sm:text-sm text-stone-900 hover:text-amber-800 transition line-clamp-1"
                  >
                    {item.productName}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-500">
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

        {/* Financial Summary (Full Width) */}
        <div className="mt-6 border-t border-stone-100 pt-5 space-y-2.5 text-xs">
          <div className="flex justify-between text-stone-500">
            <span>Items Subtotal</span>
            <span className="font-medium text-stone-900">
              ₹{Number(order.subtotal).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Delivery Charges</span>
            <span className="font-medium text-stone-900">
              {Number(order.shippingFee) === 0
                ? "FREE"
                : `₹${Number(order.shippingFee).toLocaleString("en-IN")}`}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-stone-900 border-t border-stone-200 pt-3 mt-2">
            <span>Total Paid</span>
            <span className="text-base sm:text-lg">
              ₹{Number(order.totalAmount).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Order Details (Shipping & Payment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-100 bg-stone-50/50 border-t border-stone-100 text-xs">
        {/* 1. Delivery Details */}
        <div className="p-5 sm:p-6 space-y-1.5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 block">
            Shipping Address
          </span>
          <p className="font-medium text-stone-900">{recipientName}</p>
          {addr.phone && (
            <p className="text-stone-500 text-[11px]">Phone: {addr.phone}</p>
          )}
          <p className="text-stone-600 leading-snug">
            {addr.addressLine1}
            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
          </p>
          {destination && (
            <p className="text-stone-600 font-medium">{destination}</p>
          )}
        </div>

        {/* 2. Order & Payment Details */}
        <div className="p-5 sm:p-6 space-y-3">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 block">
              Order Number
            </span>
            <p className="font-mono font-bold text-stone-900 mt-1 text-sm">
              {order.orderNumber}
            </p>
          </div>

          <div className="pt-2.5 border-t border-stone-200/60">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 block">
              Payment Method
            </span>
            <p className="font-medium text-stone-900 mt-0.5">
              {order.paymentMethod ? order.paymentMethod.toUpperCase() : "Online Payment"}
            </p>
            {order.paymentId && (
              <p className="font-mono text-[11px] text-stone-500 truncate mt-0.5" title={order.paymentId}>
                ID: {order.paymentId}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
