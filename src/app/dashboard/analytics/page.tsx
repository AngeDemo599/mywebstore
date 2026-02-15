"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Eye,
  ShoppingCart,
  TrendingUp,
  Smartphone,
  Monitor,
  Globe,
  MousePointer,
  ArrowRight,
  Lock,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import ProCTA from "@/components/pro-cta";
import { useTranslation } from "@/components/language-provider";

interface AnalyticsData {
  overview: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalOrders: number;
    conversionRate: number;
    formStarts: number;
    formSubmits: number;
    imageClicks: number;
    scrollDepth50: number;
  };
  funnel: {
    pageViews: number;
    scrolled: number;
    formViewed: number;
    formStarted: number;
    formSubmitted: number;
  };
  dailyViews: Array<{ date: string; count: number }>;
  dailyOrders: Array<{ date: string; count: number }>;
  topProducts: Array<{
    productId: string;
    title: string;
    slug: string;
    views: number;
    orders: number;
    conversionRate: string;
  }>;
  devices: Array<{ type: string; count: number }>;
  browsers: Array<{ name: string; count: number }>;
  referrers: Array<{ source: string; count: number }>;
  utmCampaigns: Array<{ source: string; campaign: string; count: number }>;
  geographic: Array<{ wilaya: string; count: number }>;
  hourly: Array<{ hour: number; count: number }>;
  dayOfWeek: Array<{ day: number; count: number }>;
}

interface AccessInfo {
  hasAccess: boolean;
  reason: "pro" | "trial" | "none";
  trialDaysLeft: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BarChart({ data, maxVal, color = "#303030" }: { data: number[]; maxVal: number; color?: string }) {
  return (
    <div className="flex items-end gap-[3px] h-28">
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all hover:opacity-80"
          style={{
            height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`,
            minHeight: val > 0 ? "4px" : "0",
            backgroundColor: color,
          }}
          title={`${val}`}
        />
      ))}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  color,
  isLast,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex-1">
      <div className="relative h-16 rounded-lg overflow-hidden" style={{ backgroundColor: color + "15" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
          style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: color + "40" }}
        />
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{value.toLocaleString()}</span>
          <span className="text-[11px] font-medium text-d-text-sub">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-xs text-center mt-1.5 font-medium text-d-text">{label}</p>
      {!isLast && (
        <div className="flex justify-center mt-1">
          <ArrowRight className="w-3 h-3 text-d-text-muted" />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color = "#303030",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="bg-d-surface rounded-xl shadow-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "12" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-[13px] font-medium text-d-text-sub">{label}</span>
      </div>
      <p className="text-2xl font-bold text-d-text">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {subtext && <p className="text-[11px] text-d-text-muted mt-0.5">{subtext}</p>}
    </div>
  );
}

function LockedScreen() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-d-surface-secondary border border-d-border flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-d-text-muted" />
      </div>
      <h2 className="text-xl font-bold text-d-text mb-2">{t("analytics.locked")}</h2>
      <p className="text-d-text-sub text-sm text-center max-w-md mb-6">
        {t("analytics.lockedDesc")}
      </p>
      <Link
        href="/dashboard/upgrade"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all bg-gradient-to-b from-[#3a3a3a] to-[#262626] border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)] hover:from-[#404040] hover:to-[#2b2b2b]"
      >
        <Sparkles className="w-4 h-4" />
        {t("analytics.upgradeToPro")}
      </Link>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full opacity-40 pointer-events-none select-none">
        <div className="bg-d-surface rounded-xl shadow-card p-4 text-center">
          <Eye className="w-5 h-5 text-d-text-muted mx-auto mb-2" />
          <p className="text-xs text-d-text-muted">{t("analytics.pageViews")}</p>
        </div>
        <div className="bg-d-surface rounded-xl shadow-card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-d-text-muted mx-auto mb-2" />
          <p className="text-xs text-d-text-muted">{t("analytics.conversionRate")}</p>
        </div>
        <div className="bg-d-surface rounded-xl shadow-card p-4 text-center">
          <Globe className="w-5 h-5 text-d-text-muted mx-auto mb-2" />
          <p className="text-xs text-d-text-muted">{t("analytics.geographicIntelligence")}</p>
        </div>
        <div className="bg-d-surface rounded-xl shadow-card p-4 text-center">
          <BarChart3 className="w-5 h-5 text-d-text-muted mx-auto mb-2" />
          <p className="text-xs text-d-text-muted">{t("analytics.trafficSources")}</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePlan } = useEffectivePlan();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period });

        const res = await fetch(`/api/analytics/dashboard?${params}`);
        const json = await res.json();

        if (res.status === 403) {
          setAccess({ hasAccess: false, reason: "none", trialDaysLeft: 0 });
          setData(null);
        } else if (res.ok) {
          setAccess(json.access);
          setData(json.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router, period]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-d-text">{t("analytics.title")}</h1>
        </div>
        <LockedScreen />
      </div>
    );
  }

  const overview = data?.overview;
  const funnel = data?.funnel;

  // Build chart data for daily views (last N days)
  const daysCount = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const dailyViewMap = new Map((data?.dailyViews || []).map((d) => [d.date.split("T")[0], d.count]));
  const dailyOrderMap = new Map((data?.dailyOrders || []).map((d) => [d.date.split("T")[0], d.count]));
  const chartDates: string[] = [];
  const chartViews: number[] = [];
  const chartOrders: number[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    chartDates.push(key);
    chartViews.push(dailyViewMap.get(key) || 0);
    chartOrders.push(dailyOrderMap.get(key) || 0);
  }
  const maxViews = Math.max(...chartViews, 1);
  const maxOrders = Math.max(...chartOrders, 1);

  // Hourly data (pad to 24 hours)
  const hourlyMap = new Map((data?.hourly || []).map((h) => [h.hour, h.count]));
  const hourlyData = Array.from({ length: 24 }, (_, i) => hourlyMap.get(i) || 0);
  const maxHourly = Math.max(...hourlyData, 1);

  // Day of week data
  const dowMap = new Map((data?.dayOfWeek || []).map((d) => [d.day, d.count]));
  const dowData = Array.from({ length: 7 }, (_, i) => dowMap.get(i) || 0);
  const maxDow = Math.max(...dowData, 1);

  // Device totals
  const deviceTotal = (data?.devices || []).reduce((s, d) => s + d.count, 0) || 1;
  const referrerTotal = (data?.referrers || []).reduce((s, r) => s + r.count, 0) || 1;

  // Funnel percentages
  const funnelBase = funnel?.pageViews || 1;

  // Form abandonment rate
  const formAbandonRate =
    overview && overview.formStarts > 0
      ? (((overview.formStarts - overview.formSubmits) / overview.formStarts) * 100).toFixed(1)
      : "0";
  // Scroll depth rate
  const scrollRate = overview && overview.totalPageViews > 0
    ? ((overview.scrollDepth50 / overview.totalPageViews) * 100).toFixed(1)
    : "0";
  // Form interaction rate
  const formInteractionRate = overview && overview.totalPageViews > 0
    ? ((overview.formStarts / overview.totalPageViews) * 100).toFixed(1)
    : "0";

  return (
    <div>
      {/* Trial banner */}
      {access.reason === "trial" && (
        <div
          className={`rounded-xl p-4 mb-6 flex items-center justify-between ${
            access.trialDaysLeft <= 2
              ? "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <BarChart3
              className={`w-5 h-5 ${access.trialDaysLeft <= 2 ? "text-red-600" : "text-blue-600"}`}
            />
            <div>
              <p
                className={`text-sm font-semibold ${
                  access.trialDaysLeft <= 2 ? "text-red-800" : "text-blue-800"
                }`}
              >
                {access.trialDaysLeft <= 2
                  ? t("analytics.trialEndsSoon")
                  : `${t("analytics.trialDaysLeft")} ${access.trialDaysLeft} ${t("analytics.daysRemaining")}`}
              </p>
              <p
                className={`text-xs ${
                  access.trialDaysLeft <= 2 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {access.trialDaysLeft <= 2
                  ? `${t("analytics.onlyDaysLeft")} ${access.trialDaysLeft} ${t("analytics.daysLeftUpgrade")}`
                  : t("analytics.upgradeToKeep")}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/upgrade"
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
              access.trialDaysLeft <= 2
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {t("sidebar.upgrade")}
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-d-text">{t("analytics.title")}</h1>
            {effectivePlan === "PRO" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#303030] text-white text-[11px] font-bold">
                <Sparkles size={11} className="text-lime-400" />
                PRO
              </span>
            )}
          </div>
          <p className="text-[13px] text-d-text-sub mt-0.5">
            {t("analytics.insightsYourStore")}
          </p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none bg-d-surface border border-d-border rounded-lg px-4 py-2 pr-9 text-sm font-medium text-d-text focus:outline-none focus:ring-1 focus:ring-d-link cursor-pointer"
          >
            <option value="7d">{t("analytics.last7days")}</option>
            <option value="30d">{t("analytics.last30days")}</option>
            <option value="90d">{t("analytics.last90days")}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-d-text-sub pointer-events-none" />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          label={t("analytics.pageViews")}
          value={overview?.totalPageViews || 0}
          subtext={`${overview?.uniqueVisitors || 0} ${t("analytics.uniqueVisitors")}`}
          color="#2563eb"
        />
        <StatCard
          icon={<ShoppingCart className="w-4 h-4" />}
          label={t("analytics.orders")}
          value={overview?.totalOrders || 0}
          subtext={`${overview?.conversionRate || 0}% ${t("analytics.conversionRate").toLowerCase()}`}
          color="#16a34a"
        />
        <StatCard
          icon={<MousePointer className="w-4 h-4" />}
          label={t("analytics.formStarts")}
          value={overview?.formStarts || 0}
          subtext={`${formAbandonRate}% ${t("analytics.abandonment")}`}
          color="#ea580c"
        />
        <StatCard
          icon={<ImageIcon className="w-4 h-4" />}
          label={t("analytics.imageClicks")}
          value={overview?.imageClicks || 0}
          subtext={`${scrollRate}% ${t("analytics.scrollPast50")}`}
          color="#7c3aed"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-d-surface rounded-xl shadow-card p-5 mb-6">
        <h2 className="text-base font-semibold text-d-text mb-4">{t("analytics.conversionFunnel")}</h2>
        {(funnel?.pageViews || 0) > 0 ? (
          <div className="flex gap-2">
            <FunnelStep
              label={t("analytics.viewedPage")}
              value={funnel?.pageViews || 0}
              percentage={100}
              color="#2563eb"
            />
            <FunnelStep
              label={t("analytics.scrolled")}
              value={funnel?.scrolled || 0}
              percentage={((funnel?.scrolled || 0) / funnelBase) * 100}
              color="#3b82f6"
            />
            <FunnelStep
              label={t("analytics.sawForm")}
              value={funnel?.formViewed || 0}
              percentage={((funnel?.formViewed || 0) / funnelBase) * 100}
              color="#f59e0b"
            />
            <FunnelStep
              label={t("analytics.startedForm")}
              value={funnel?.formStarted || 0}
              percentage={((funnel?.formStarted || 0) / funnelBase) * 100}
              color="#ea580c"
            />
            <FunnelStep
              label={t("analytics.ordered")}
              value={funnel?.formSubmitted || 0}
              percentage={((funnel?.formSubmitted || 0) / funnelBase) * 100}
              color="#16a34a"
              isLast
            />
          </div>
        ) : (
          <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.viewsAppear")}</p>
        )}
      </div>

      {/* Views & Orders Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <h2 className="text-base font-semibold text-d-text mb-1">{t("analytics.pageViews")}</h2>
          <p className="text-[11px] text-d-text-muted mb-4">{t("analytics.dailyPageViewsDesc")}</p>
          {chartViews.some((v) => v > 0) ? (
            <>
              <BarChart data={chartViews} maxVal={maxViews} color="#2563eb" />
              <div className="flex justify-between mt-2 text-[10px] text-d-text-muted">
                <span>{chartDates[0]}</span>
                <span>{chartDates[chartDates.length - 1]}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noViewsYet")}</p>
          )}
        </div>

        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <h2 className="text-base font-semibold text-d-text mb-1">{t("analytics.orders")}</h2>
          <p className="text-[11px] text-d-text-muted mb-4">{t("analytics.dailyOrdersDesc")}</p>
          {chartOrders.some((v) => v > 0) ? (
            <>
              <BarChart data={chartOrders} maxVal={maxOrders} color="#16a34a" />
              <div className="flex justify-between mt-2 text-[10px] text-d-text-muted">
                <span>{chartDates[0]}</span>
                <span>{chartDates[chartDates.length - 1]}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noOrdersYet")}</p>
          )}
        </div>
      </div>

      {/* Product Rankings */}
      <div className="bg-d-surface rounded-xl shadow-card p-5 mb-6">
        <h2 className="text-base font-semibold text-d-text mb-4">{t("analytics.productRankings")}</h2>
        {(data?.topProducts || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-d-text-sub border-b border-d-border">
                  <th className="pb-2 font-medium">{t("common.products")}</th>
                  <th className="pb-2 font-medium text-right">{t("analytics.views")}</th>
                  <th className="pb-2 font-medium text-right">{t("analytics.orders")}</th>
                  <th className="pb-2 font-medium text-right">{t("analytics.conversion")}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topProducts || []).map((p, i) => (
                  <tr key={p.productId} className="border-b border-d-border last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-d-surface-secondary flex items-center justify-center text-[11px] font-bold text-d-text-sub">
                          {i + 1}
                        </span>
                        <span className="font-medium text-d-text truncate max-w-[200px]">{p.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-d-text">{p.views.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-d-text">{p.orders}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          parseFloat(p.conversionRate) >= 5
                            ? "bg-green-100 text-green-700"
                            : parseFloat(p.conversionRate) >= 2
                            ? "bg-amber-100 text-amber-700"
                            : "bg-d-surface-secondary text-d-text-sub"
                        }`}
                      >
                        {p.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noProductData")}</p>
        )}
      </div>

      {/* Traffic Sources & Geographic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Traffic Sources */}
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <h2 className="text-base font-semibold text-d-text mb-4">{t("analytics.trafficSources")}</h2>
          {(data?.referrers || []).length > 0 ? (
            <div className="space-y-3">
              {(data?.referrers || []).map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-d-text font-medium truncate max-w-[200px]">{r.source}</span>
                    <span className="text-d-text-sub text-xs">{r.count} ({((r.count / referrerTotal) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-d-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(r.count / referrerTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noReferrerData")}</p>
          )}

          {/* UTM Campaigns */}
          {(data?.utmCampaigns || []).length > 0 && (
            <div className="mt-5 pt-4 border-t border-d-border">
              <h3 className="text-sm font-semibold text-d-text mb-3">{t("analytics.utmCampaigns")}</h3>
              <div className="space-y-2">
                {(data?.utmCampaigns || []).map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-d-text">
                      {u.source} / <span className="text-d-text-sub">{u.campaign}</span>
                    </span>
                    <span className="text-d-text-sub text-xs font-medium">{u.count} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Geographic */}
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <h2 className="text-base font-semibold text-d-text mb-4">{t("analytics.geographicIntelligence")}</h2>
          {(data?.geographic || []).length > 0 ? (
            <div className="space-y-3">
              {(data?.geographic || []).slice(0, 10).map((g, i) => {
                const geoTotal = (data?.geographic || []).reduce((s, gg) => s + gg.count, 0) || 1;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-d-text font-medium flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {g.wilaya}
                      </span>
                      <span className="text-d-text-sub text-xs">{g.count} ({((g.count / geoTotal) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-d-surface-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(g.count / geoTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noGeoData")}</p>
          )}
        </div>
      </div>

      {/* Behavior Metrics */}
      <div className="bg-d-surface rounded-xl shadow-card p-5 mb-6">
        <h2 className="text-base font-semibold text-d-text mb-4">{t("analytics.behaviorMetrics")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-d-surface-secondary rounded-xl">
            <p className="text-2xl font-bold text-d-text">{scrollRate}%</p>
            <p className="text-xs text-d-text-sub mt-1">{t("analytics.scrollPast50Label")}</p>
          </div>
          <div className="text-center p-4 bg-d-surface-secondary rounded-xl">
            <p className="text-2xl font-bold text-d-text">{formInteractionRate}%</p>
            <p className="text-xs text-d-text-sub mt-1">{t("analytics.formInteractionRate")}</p>
          </div>
          <div className="text-center p-4 bg-d-surface-secondary rounded-xl">
            <p className="text-2xl font-bold text-d-text">{formAbandonRate}%</p>
            <p className="text-xs text-d-text-sub mt-1">{t("analytics.formAbandonment")}</p>
          </div>
          <div className="text-center p-4 bg-d-surface-secondary rounded-xl">
            <p className="text-2xl font-bold text-d-text">{overview?.conversionRate || 0}%</p>
            <p className="text-xs text-d-text-sub mt-1">{t("analytics.conversionRate")}</p>
          </div>
        </div>
      </div>

      {/* Device & Time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Device Breakdown */}
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <h2 className="text-base font-semibold text-d-text mb-4">{t("analytics.devices")}</h2>
          {(data?.devices || []).length > 0 ? (
            <div className="space-y-3">
              {(data?.devices || []).map((d) => (
                <div key={d.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {d.type === "mobile" ? (
                      <Smartphone className="w-4 h-4 text-d-text-sub" />
                    ) : (
                      <Monitor className="w-4 h-4 text-d-text-sub" />
                    )}
                    <span className="text-sm text-d-text font-medium capitalize">{d.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-d-surface-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-d-text transition-all"
                        style={{ width: `${(d.count / deviceTotal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-d-text-sub w-10 text-right">
                      {((d.count / deviceTotal) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noDataYet")}</p>
          )}

          {/* Browser Breakdown */}
          {(data?.browsers || []).length > 0 && (
            <div className="mt-5 pt-4 border-t border-d-border">
              <h3 className="text-sm font-semibold text-d-text mb-3">{t("analytics.browsers")}</h3>
              <div className="space-y-2">
                {(data?.browsers || []).map((b) => {
                  const browserTotal = (data?.browsers || []).reduce((s, bb) => s + bb.count, 0) || 1;
                  return (
                    <div key={b.name} className="flex justify-between text-sm">
                      <span className="text-d-text">{b.name}</span>
                      <span className="text-d-text-sub text-xs">
                        {((b.count / browserTotal) * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Hourly Activity */}
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <h2 className="text-base font-semibold text-d-text mb-1">{t("analytics.peakHours")}</h2>
          <p className="text-[11px] text-d-text-muted mb-4">{t("analytics.peakHoursDesc")}</p>
          {hourlyData.some((v) => v > 0) ? (
            <>
              <BarChart data={hourlyData} maxVal={maxHourly} color="#7c3aed" />
              <div className="flex justify-between mt-2 text-[10px] text-d-text-muted">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>23h</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noDataYet")}</p>
          )}
        </div>

        {/* Day of Week */}
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <h2 className="text-base font-semibold text-d-text mb-1">{t("analytics.ordersByDay")}</h2>
          <p className="text-[11px] text-d-text-muted mb-4">{t("analytics.ordersByDayDesc")}</p>
          {dowData.some((v) => v > 0) ? (
            <>
              <BarChart data={dowData} maxVal={maxDow} color="#ea580c" />
              <div className="flex justify-between mt-2 text-[10px] text-d-text-muted">
                {[t("analytics.sun"), t("analytics.mon"), t("analytics.tue"), t("analytics.wed"), t("analytics.thu"), t("analytics.fri"), t("analytics.sat")].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-8">{t("analytics.noDataYet")}</p>
          )}
        </div>
      </div>

      {/* PRO CTA */}
      {effectivePlan === "FREE" && (
        <div className="mt-6">
          <ProCTA />
        </div>
      )}
    </div>
  );
}
