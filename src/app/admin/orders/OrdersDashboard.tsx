"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Copy,
  Check,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  ArrowUpRight,
  X,
} from "lucide-react";

export interface Order {
  id: number;
  orderNumber: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string | Date;
  totalAmount: number;
  status: string;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface SalesOverview {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersToday: number;
  revenueToday: number;
}

interface OrdersDashboardProps {
  initialStatusCounts: StatusCount[];
  initialOrders: Order[];
  initialTotalPages: number;
  initialOverview?: SalesOverview;
}

const STATUS_CONFIG: Record<
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

const formatINR = (amount: number) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status: string) => {
  if (STATUS_CONFIG[status]) return STATUS_CONFIG[status].label;
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function OrdersDashboard({
  initialStatusCounts,
  initialOrders,
  initialTotalPages,
  initialOverview,
}: OrdersDashboardProps) {
  const router = useRouter();

  // State
  const [statusCounts] = useState<StatusCount[]>(initialStatusCounts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingCount = statusCounts
    .filter((s) => ["pending", "confirmed", "processing"].includes(s.status))
    .reduce((acc, curr) => acc + curr.count, 0);

  const inTransitCount = statusCounts
    .filter((s) => ["shipped", "in_transit"].includes(s.status))
    .reduce((acc, curr) => acc + curr.count, 0);

  const totalOrdersCount =
    initialOverview?.totalOrders ??
    statusCounts.reduce((acc, curr) => acc + curr.count, 0);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        if (statusFilter !== "all") {
          queryParams.append("status", statusFilter);
        }

        if (debouncedSearchTerm) {
          queryParams.append("search", debouncedSearchTerm);
        }

        const response = await fetch(
          `/api/admin/orders?${queryParams.toString()}`,
        );
        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [page, pageSize, statusFilter, debouncedSearchTerm, isFirstRender]);

  useEffect(() => {
    if (!isFirstRender) {
      setPage(1);
    }
  }, [pageSize, statusFilter, debouncedSearchTerm, isFirstRender]);

  const handleCopy = (e: React.MouseEvent, orderNumber: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = [
      "Order Number",
      "Customer Name",
      "Email",
      "Date",
      "Total Amount",
      "Status",
    ];
    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.userName || "Guest"}"`,
      `"${o.userEmail || ""}"`,
      `"${formatDate(o.createdAt)}"`,
      `"${o.totalAmount}"`,
      `"${o.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `jewelscart_orders_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
            Orders
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage, fulfill, and track customer shipments
          </p>
        </div>

        <div>
          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-2xs disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Orders */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Orders
            </span>
            <Package className="h-4 w-4 text-stone-400" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-stone-900 font-display">
            {totalOrdersCount}
          </p>
          {initialOverview?.ordersToday !== undefined && (
            <p className="mt-0.5 text-[11px] text-emerald-600 font-medium">
              +{initialOverview.ordersToday} today
            </p>
          )}
        </div>

        {/* Pending Fulfillment */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Pending
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-amber-700 font-display">
            {pendingCount}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-400">Needs processing</p>
        </div>

        {/* In Transit */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              In Transit
            </span>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-stone-900 font-display">
            {inTransitCount}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-400">With courier</p>
        </div>

        {/* Revenue */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Revenue (30d)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-stone-900 font-display">
            {initialOverview?.totalRevenue !== undefined
              ? formatINR(initialOverview.totalRevenue)
              : "—"}
          </p>
          {initialOverview?.revenueToday !== undefined && (
            <p className="mt-0.5 text-[11px] text-emerald-600 font-medium">
              +{formatINR(initialOverview.revenueToday)} today
            </p>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-stone-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search orders, names, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-stone-200 bg-stone-50/60 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-900 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-stone-400">
              Showing {orders.length} orders
            </p>
          </div>

          {/* Status Pills */}
          <div className="flex overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide space-x-1.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === "all"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All ({totalOrdersCount})
            </button>

            {statusCounts.map((s) => {
              const cfg = STATUS_CONFIG[s.status];
              const active = statusFilter === s.status;
              return (
                <button
                  key={s.status}
                  onClick={() => setStatusFilter(s.status)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cfg && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                    ></span>
                  )}
                  <span>{formatStatus(s.status)}</span>
                  <span className="text-[10px] opacity-70">({s.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {isLoadingOrders ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-stone-50 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <FilterX className="h-8 w-8 text-stone-300 mx-auto" />
            <p className="mt-2 text-xs font-medium text-stone-700">
              No orders found
            </p>
            {(statusFilter !== "all" || debouncedSearchTerm !== "") && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
                className="mt-2 text-xs text-amber-800 hover:underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-100 text-xs">
                <thead className="bg-stone-50/60 text-stone-500 font-medium">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Order</th>
                    <th className="px-4 py-2.5 text-left">Customer</th>
                    <th className="px-4 py-2.5 text-left">Date</th>
                    <th className="px-4 py-2.5 text-left">Amount</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => {
                    const cfg = STATUS_CONFIG[o.status] || {
                      label: formatStatus(o.status),
                      badge: "bg-stone-100 text-stone-700 border-stone-200",
                      dot: "bg-stone-400",
                    };

                    return (
                      <tr
                        key={o.id}
                        onClick={() => router.push(`/admin/orders/${o.id}`)}
                        className="group hover:bg-stone-50/70 transition cursor-pointer"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-stone-900 group-hover:text-amber-800 transition">
                              {o.orderNumber}
                            </span>
                            <button
                              onClick={(e) => handleCopy(e, o.orderNumber)}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded opacity-0 group-hover:opacity-100 transition"
                              title="Copy Order ID"
                            >
                              {copiedId === o.orderNumber ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-stone-900">
                              {o.userName || "Guest"}
                            </p>
                            <p className="text-[11px] text-stone-400">
                              {o.userEmail}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                          {formatDate(o.createdAt)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-bold text-stone-900">
                          {formatINR(o.totalAmount)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                            ></span>
                            <span>{cfg.label}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-stone-400 group-hover:text-stone-900 transition">
                            <ArrowUpRight className="h-4 w-4 inline" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Compact List View */}
            <div className="sm:hidden divide-y divide-stone-100">
              {orders.map((o) => {
                const cfg = STATUS_CONFIG[o.status] || {
                  label: formatStatus(o.status),
                  badge: "bg-stone-100 text-stone-700 border-stone-200",
                  dot: "bg-stone-400",
                };

                return (
                  <div
                    key={o.id}
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                    className="p-3.5 active:bg-stone-50 transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-xs">
                        {o.orderNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                        ></span>
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-stone-800">
                          {o.userName || "Guest"}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900">
                          {formatINR(o.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50/60 text-xs">
          <div className="flex items-center gap-3 text-stone-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-stone-800">
                {orders.length}
              </span>{" "}
              orders
              {totalPages > 0 && (
                <>
                  {" "}
                  (Page{" "}
                  <span className="font-semibold text-stone-800">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-stone-800">
                    {totalPages}
                  </span>
                  )
                </>
              )}
            </span>
            <div className="flex items-center gap-1.5 pl-3 border-l border-stone-200">
              <span className="text-stone-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-700 text-xs focus:outline-none focus:border-stone-400"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoadingOrders}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Previous
            </button>
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <span className="px-1 text-stone-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        disabled={isLoadingOrders}
                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                          page === p
                            ? "bg-stone-900 text-white shadow-2xs"
                            : "text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoadingOrders}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
