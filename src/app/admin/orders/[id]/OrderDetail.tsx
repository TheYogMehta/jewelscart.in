"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type Order } from "@/lib/orders/types";
import OrderReceiptCard from "@/components/orders/OrderReceiptCard";
import {
  ArrowLeft,
  Copy,
  Check,
  Printer,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Truck,
  MapPin,
  AlertTriangle,
  Package,
} from "lucide-react";

interface OrderDetailProps {
  order: Order;
}

const STATUS_THEMES: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border-amber-200/60",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    badge: "bg-sky-50 text-sky-700 border-sky-200/60",
    dot: "bg-sky-500",
  },
  processing: {
    label: "Processing",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    dot: "bg-indigo-500",
  },
  shipped: {
    label: "Shipped",
    badge: "bg-purple-50 text-purple-700 border-purple-200/60",
    dot: "bg-purple-500",
  },
  in_transit: {
    label: "In Transit",
    badge: "bg-purple-50 text-purple-700 border-purple-200/60",
    dot: "bg-purple-500",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-stone-100 text-stone-600 border-stone-200",
    dot: "bg-stone-400",
  },
};

export default function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter();

  // Status State
  const [status, setStatus] = useState<string>(order.status || "");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Tracking State
  const [trackingId, setTrackingId] = useState(order.trackingId || "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || "");
  const [courier, setCourier] = useState(order.trackingCourier || "");
  const [sendEmail, setSendEmail] = useState(true);
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState({
    type: "",
    text: "",
  });

  // Feedback states
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    setStatusMessage({ type: "", text: "" });
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setStatusMessage({
        type: "success",
        text: "Status updated successfully",
      });
      router.refresh();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateTracking = async () => {
    setIsUpdatingTracking(true);
    setTrackingMessage({ type: "", text: "" });
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_tracking",
          trackingId,
          trackingUrl,
          courier,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tracking");
      setTrackingMessage({
        type: "success",
        text: "Tracking saved successfully",
      });
      router.refresh();
    } catch (err: any) {
      setTrackingMessage({ type: "error", text: err.message });
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  // Address parsing
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

  const customerName = address.fullName || order.userName || "Customer";
  const customerPhone = address.phone || "";
  const customerEmail = order.userEmail || "";

  const formattedFullAddress = [
    customerName,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    customerPhone ? `Phone: ${customerPhone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(formattedFullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  const statusTheme = STATUS_THEMES[order.status] || {
    label: order.status.replace(/_/g, " ").toUpperCase(),
    badge: "bg-stone-100 text-stone-700 border-stone-200",
    dot: "bg-stone-400",
  };

  // Stepper milestones
  const STAGES = [
    { key: "placed", label: "Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const stageIndexMap: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 1,
    shipped: 2,
    in_transit: 2,
    delivered: 3,
    completed: 3,
  };

  const currentStageIndex = stageIndexMap[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";

  return (
    <>
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      <div className="hidden print:block max-w-3xl mx-auto print:p-8 print:m-0">
        <OrderReceiptCard order={order} />
      </div>

      {/* ========================================================================= */}
      {/* 2. ON-SCREEN ADMIN DASHBOARD VIEW (Hidden on print)                       */}
      {/* ========================================================================= */}
      <div className="space-y-4 pb-12 print:hidden">
        {/* Clean, Tight Header Row (Without redundant status/paid tags) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/60">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="p-1 -ml-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
              title="Back to Orders"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {order.orderNumber || `Order #${order.id}`}
            </h1>

            <button
              onClick={copyOrderId}
              className="p-1 text-stone-400 hover:text-stone-700 rounded transition"
              title="Copy Order ID"
            >
              {copiedOrderId ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 mr-1 hidden sm:inline">
              {formatDate(order.createdAt)}
            </span>

            {customerPhone && (
              <a
                href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${customerName}, regarding your JewelsCart order ${order.orderNumber}...`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition shadow-2xs"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-stone-500" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>

        {/* Balanced 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column (2 Cols): Items, Fulfillment Tracker, Status Changer */}
          <div className="space-y-4 lg:col-span-2">
            {/* Items & Fulfillment Card */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-stone-500" />
                  <h2 className="text-sm font-semibold text-stone-900">
                    Purchased Items ({order.items?.length || 0})
                  </h2>
                  {order.trackingCourier && (
                    <span className="text-xs text-stone-500">
                      · {order.trackingCourier}{" "}
                      {order.trackingId ? `#${order.trackingId}` : ""}
                    </span>
                  )}
                </div>

                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
                  >
                    <span>Track Package</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Compact Fulfillment Line */}
              {!isCancelled ? (
                <div className="py-3 border-b border-stone-100">
                  <div className="max-w-md">
                    <div className="grid grid-cols-4 gap-1.5">
                      {STAGES.map((st, idx) => {
                        const isDone = idx <= currentStageIndex;
                        return (
                          <div key={st.key} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                isDone ? "bg-emerald-500" : "bg-stone-200"
                              }`}
                            />
                            <p
                              className={`text-[10px] font-medium ${
                                isDone
                                  ? "text-stone-800 font-semibold"
                                  : "text-stone-400"
                              }`}
                            >
                              {st.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2.5 text-xs text-rose-700 bg-rose-50/70 px-3 rounded-lg my-2 border border-rose-100 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>
                    Order is {statusTheme.label}. Fulfillment is halted.
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="divide-y divide-stone-100">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.productImage ? (
                        <div className="h-12 w-12 shrink-0 relative rounded-lg overflow-hidden bg-stone-100 border border-stone-200/60">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                          <Truck className="h-5 w-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="text-xs sm:text-sm font-medium text-stone-900 hover:text-amber-800 transition line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                          {item.productSku && (
                            <span className="font-mono bg-stone-100 px-1.5 py-0.2 rounded text-stone-600">
                              {item.productSku}
                            </span>
                          )}
                          <span>
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-stone-900">
                        {formatCurrency(Number(item.unitPrice) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Receipt Summary */}
              <div className="mt-3 pt-3 border-t border-stone-100">
                <div className="w-full sm:w-60 sm:ml-auto space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-stone-800">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Shipping</span>
                    <span className="font-medium text-stone-800">
                      {Number(order.shippingFee) === 0
                        ? "Free"
                        : formatCurrency(order.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                    <span>Total</span>
                    <span className="text-amber-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lean Status Card (Without Admin Notes clutter) */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <h2 className="text-sm font-semibold text-stone-900 pb-2.5 border-b border-stone-100">
                Update Order Status
              </h2>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-3">
                <div className="flex-1">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/60 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 transition"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdatingStatus}
                  className="py-2 px-5 rounded-lg text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition disabled:opacity-50 shrink-0"
                >
                  {isUpdatingStatus ? "Saving..." : "Apply Status"}
                </button>
              </div>

              {statusMessage.text && (
                <p
                  className={`text-[11px] p-2 rounded-lg mt-2.5 ${
                    statusMessage.type === "error"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {statusMessage.text}
                </p>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Customer & Delivery, Shipment Tracking */}
          <div className="space-y-4">
            {/* Customer & Address Card */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <h2 className="text-sm font-semibold text-stone-900 pb-2.5 border-b border-stone-100">
                Customer
              </h2>

              <div className="mt-3 space-y-3 text-xs">
                {/* Contact info */}
                <div>
                  <p className="font-semibold text-stone-900">{customerName}</p>
                  {customerEmail && (
                    <div className="flex items-center gap-1.5 text-stone-600 mt-1">
                      <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <a
                        href={`mailto:${customerEmail}`}
                        className="hover:text-amber-800 transition truncate"
                      >
                        {customerEmail}
                      </a>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="flex items-center gap-1.5 text-stone-600 mt-1">
                      <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <a
                        href={`tel:${customerPhone}`}
                        className="hover:text-amber-800 transition"
                      >
                        {customerPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Delivery address with copy icon only in address section */}
                <div className="pt-2.5 border-t border-stone-100 text-stone-600">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        {address.addressLine1 && <p>{address.addressLine1}</p>}
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        {(address.city || address.state || address.pincode) && (
                          <p className="font-medium text-stone-800">
                            {[address.city, address.state]
                              .filter(Boolean)
                              .join(", ")}
                            {address.pincode ? ` - ${address.pincode}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={copyAddressToClipboard}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded transition shrink-0 hover:bg-stone-100"
                      title="Copy Address"
                    >
                      {copiedAddress ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Tracking Card (Manual input only, no presets) */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <h2 className="text-sm font-semibold text-stone-900 pb-2.5 border-b border-stone-100">
                Shipment Tracking
              </h2>

              <div className="space-y-2.5 mt-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">
                    Courier Name
                  </label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/60 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 transition"
                    placeholder="e.g. BlueDart"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">
                    AWB / Tracking Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-stone-50/60 p-2 pr-7 text-xs text-stone-900 font-mono focus:bg-white focus:outline-none focus:border-stone-900 transition"
                      placeholder="e.g. 12345678"
                    />
                    {trackingId && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(trackingId);
                          setCopiedTracking(true);
                          setTimeout(() => setCopiedTracking(false), 2000);
                        }}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-stone-400 hover:text-stone-700"
                      >
                        {copiedTracking ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">
                    Tracking Web Link
                  </label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/60 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 transition"
                    placeholder="https://track..."
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="h-3.5 w-3.5 text-amber-600 rounded border-stone-300 focus:ring-0"
                  />
                  <span className="text-[11px] text-stone-600">
                    Notify customer via email
                  </span>
                </label>

                {trackingMessage.text && (
                  <p
                    className={`text-[11px] p-2 rounded-lg ${
                      trackingMessage.type === "error"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {trackingMessage.text}
                  </p>
                )}

                <button
                  onClick={handleUpdateTracking}
                  disabled={isUpdatingTracking}
                  className="w-full py-1.5 px-3 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 transition disabled:opacity-50"
                >
                  {isUpdatingTracking ? "Saving..." : "Save Tracking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
