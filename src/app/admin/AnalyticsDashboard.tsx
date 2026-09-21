"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AnalyticsOverview } from "@/lib/analytics";

interface Props {
  overview: AnalyticsOverview;
  userName?: string;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const DEVICE_COLORS = {
  desktop: "#1c1917", // stone-900
  mobile: "#b8860b", // gold
  tablet: "#78716c", // stone-500
  anonymous: "#a8a29e", // stone-400
};

export function AnalyticsDashboard({ overview, userName }: Props) {
  const {
    totalVisits,
    uniqueVisitors,
    avgDurationSeconds,
    avgDurationMembers,
    avgDurationAnonymous,
    loggedInVisits,
    anonymousVisits,
    dailyTimeSeries,
    hotspots,
    topLocations,
    deviceBreakdown,
    referrers,
  } = overview;

  const hasVisits = loggedInVisits + anonymousVisits > 0;
  const totalSessions = loggedInVisits + anonymousVisits || 1;
  const anonPercent = hasVisits
    ? Math.round((anonymousVisits / totalSessions) * 100)
    : 0;
  const loggedInPercent = hasVisits ? Math.max(0, 100 - anonPercent) : 0;

  const rawTotalDevices =
    (deviceBreakdown.desktop || 0) +
    (deviceBreakdown.mobile || 0) +
    (deviceBreakdown.tablet || 0) +
    (deviceBreakdown.anonymous || 0);
  const totalDevices = rawTotalDevices || 1;
  const desktopPercent =
    rawTotalDevices > 0
      ? Math.round(((deviceBreakdown.desktop || 0) / totalDevices) * 100)
      : 0;
  const mobilePercent =
    rawTotalDevices > 0
      ? Math.round(((deviceBreakdown.mobile || 0) / totalDevices) * 100)
      : 0;
  const tabletPercent =
    rawTotalDevices > 0
      ? Math.round(((deviceBreakdown.tablet || 0) / totalDevices) * 100)
      : 0;
  const anonDevicePercent =
    rawTotalDevices > 0
      ? Math.max(0, 100 - (desktopPercent + mobilePercent + tabletPercent))
      : 0;

  const devicePieData = [
    {
      name: "Desktop",
      value: deviceBreakdown.desktop || 0,
      color: DEVICE_COLORS.desktop,
      percent: desktopPercent,
    },
    {
      name: "Mobile",
      value: deviceBreakdown.mobile || 0,
      color: DEVICE_COLORS.mobile,
      percent: mobilePercent,
    },
    {
      name: "Tablet",
      value: deviceBreakdown.tablet || 0,
      color: DEVICE_COLORS.tablet,
      percent: tabletPercent,
    },
    {
      name: "Anonymous",
      value: deviceBreakdown.anonymous || 0,
      color: DEVICE_COLORS.anonymous,
      percent: anonDevicePercent,
    },
  ].filter((d) => d.value > 0);

  const hasDeviceData = devicePieData.length > 0;

  const displayPieData = hasDeviceData
    ? devicePieData
    : [{ name: "No Data", value: 1, color: "#e7e5e4", percent: 0 }];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {userName && (
          <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
            Welcome, {userName}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
          Analytics
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 border-y border-stone-200/80 py-7">
        {/* Total Views */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-stone-500">
            <svg
              className="h-4 w-4 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Views
            </span>
          </div>
          <p className="font-sans text-3xl font-bold tracking-tight text-stone-900">
            {totalVisits.toLocaleString()}
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="space-y-1 sm:border-l sm:border-stone-200/70 sm:pl-8">
          <div className="flex items-center gap-2 text-stone-500">
            <svg
              className="h-4 w-4 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Unique Visitors
            </span>
          </div>
          <p className="font-sans text-3xl font-bold tracking-tight text-stone-900">
            {uniqueVisitors.toLocaleString()}
          </p>
        </div>

        {/* Avg Time Spent */}
        <div className="space-y-1 lg:border-l lg:border-stone-200/70 lg:pl-8">
          <div className="flex items-center gap-2 text-stone-500">
            <svg
              className="h-4 w-4 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Avg Time Spent
            </span>
          </div>
          <p className="font-sans text-3xl font-bold tracking-tight text-stone-900">
            {formatDuration(avgDurationSeconds)}
          </p>
          <p className="text-[11px] text-stone-400">
            Members:{" "}
            <span className="font-medium text-stone-700">
              {formatDuration(avgDurationMembers)}
            </span>{" "}
            • Anon:{" "}
            <span className="font-medium text-stone-700">
              {formatDuration(avgDurationAnonymous)}
            </span>
          </p>
        </div>

        {/* Audience */}
        <div className="space-y-1 sm:border-l sm:border-stone-200/70 sm:pl-8">
          <div className="flex items-center gap-2 text-stone-500">
            <svg
              className="h-4 w-4 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Audience Split
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5 font-sans text-3xl font-bold tracking-tight">
              <span className="text-stone-900">{anonPercent}%</span>
              <span className="font-normal text-stone-300 text-xl">/</span>
              <span className="text-gold">{loggedInPercent}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <span className="font-medium text-stone-600">Anon</span>
              <span className="text-stone-300">•</span>
              <span className="font-medium text-stone-600">Members</span>
            </div>
          </div>
          <div className="h-1.5 w-full max-w-45 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-gold transition-all duration-500"
              style={{ width: `${loggedInPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recharts Timeline Area Chart */}
      <div className="border-t border-stone-200/80 pt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Traffic Trend
            </h2>
            <p className="text-xs text-stone-500">
              Daily views and unique visitors over the last 14 days
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              <span className="text-stone-600">Total Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-stone-800" />
              <span className="text-stone-600">Unique Visitors</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyTimeSeries}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8860b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#b8860b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="stoneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1c1917" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1c1917" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0ece6"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#a8a29e"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#a8a29e"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                name="Total Views"
                stroke="#b8860b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#goldGradient)"
              />
              <Area
                type="monotone"
                dataKey="unique"
                name="Unique Visitors"
                stroke="#1c1917"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#stoneGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic Sources & Device Segment Grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 border-t border-stone-200/80 pt-8">
        {/* Referral Channels */}
        <div>
          <div className="border-b border-stone-200/60 pb-3">
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Traffic Sources
            </h2>
            <p className="text-xs text-stone-500">
              Channels and platforms bringing visitors to your store
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {referrers.length === 0 ? (
              <p className="py-8 text-center text-xs text-stone-400">
                No referral sources recorded yet.
              </p>
            ) : (
              referrers.map((ref) => (
                <div key={ref.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold" />
                      <span className="font-semibold text-stone-800">
                        {ref.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500">
                      <span className="font-sans font-medium">
                        {ref.count} visits
                      </span>
                      <span className="font-sans font-semibold text-stone-900">
                        ({ref.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${Math.max(ref.percentage, 2)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device Segment */}
        <div>
          <div className="border-b border-stone-200/60 pb-3">
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Device Breakdown
            </h2>
            <p className="text-xs text-stone-500">
              Audience distribution across mobile, desktop, and tablet
            </p>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center sm:flex-row gap-6">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={displayPieData.length > 1 ? 4 : 0}
                    dataKey="value"
                  >
                    {displayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => {
                      if (!hasDeviceData || name === "No Data") {
                        return ["0 sessions", "No data"];
                      }
                      return [`${val} sessions`, name || "Traffic"];
                    }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e7e5e4",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Device Details */}
            <div className="w-full divide-y divide-stone-100">
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DEVICE_COLORS.desktop }}
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Desktop
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-sans text-sm font-semibold text-stone-900">
                    {desktopPercent}%
                  </span>
                  <span className="ml-1 text-[11px] text-stone-400">
                    ({deviceBreakdown.desktop || 0})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DEVICE_COLORS.mobile }}
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Mobile
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-sans text-sm font-semibold text-stone-900">
                    {mobilePercent}%
                  </span>
                  <span className="ml-1 text-[11px] text-stone-400">
                    ({deviceBreakdown.mobile || 0})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DEVICE_COLORS.tablet }}
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Tablet
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-sans text-sm font-semibold text-stone-900">
                    {tabletPercent}%
                  </span>
                  <span className="ml-1 text-[11px] text-stone-400">
                    ({deviceBreakdown.tablet || 0})
                  </span>
                </div>
              </div>

              {Boolean(deviceBreakdown.anonymous) && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: DEVICE_COLORS.anonymous }}
                    />
                    <span className="text-xs font-medium text-stone-700">
                      Anonymous
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-sans text-sm font-semibold text-stone-900">
                      {anonDevicePercent}%
                    </span>
                    <span className="ml-1 text-[11px] text-stone-400">
                      ({deviceBreakdown.anonymous || 0})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots & Geographical Locations Grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 border-t border-stone-200/80 pt-8">
        {/* Hotspots Table with per-page duration */}
        <div>
          <div className="border-b border-stone-200/60 pb-3">
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Traffic Hotspots
            </h2>
            <p className="text-xs text-stone-500">
              Most engaged pages and average time spent on each
            </p>
          </div>

          <div className="mt-4 divide-y divide-stone-100">
            {hotspots.length === 0 ? (
              <p className="py-8 text-center text-xs text-stone-400">
                No page views recorded yet in the current period.
              </p>
            ) : (
              hotspots.map((item) => (
                <div
                  key={item.path}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-medium text-stone-900 truncate">
                      {item.path}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-xs font-semibold text-stone-900">
                      {item.count} views
                    </p>
                    <p className="font-sans text-[11px] font-medium text-stone-500">
                      avg {formatDuration(item.avgDuration)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Locations (Cities e.g. Mumbai, Delhi, etc.) */}
        <div>
          <div className="border-b border-stone-200/60 pb-3">
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Geographic Visitor Reach
            </h2>
            <p className="text-xs text-stone-500">
              Top cities and regions accessing your store
            </p>
          </div>

          <div className="mt-4 divide-y divide-stone-100">
            {topLocations.length === 0 ? (
              <p className="py-8 text-center text-xs text-stone-400">
                No location data recorded yet.
              </p>
            ) : (
              topLocations.map((loc) => (
                <div
                  key={`${loc.city}-${loc.country}`}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-3.5 w-3.5 text-gold shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {loc.city}
                      </p>
                      <span className="text-[10px] text-stone-400 uppercase">
                        {loc.country}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-stone-800"
                        style={{ width: `${loc.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-xs font-semibold text-stone-900">
                      {loc.count} visitors
                    </p>
                    <p className="font-sans text-[10px] text-stone-400">
                      {loc.percentage}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
