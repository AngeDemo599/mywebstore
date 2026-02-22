"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { useTranslation } from "@/components/language-provider";
import { useStoreContext } from "@/lib/store-context";
import ProCTA from "@/components/pro-cta";
import {
  Sparkles,
  PartyPopper,
  Coins,
  X,
  ShoppingCart,
  Package,
  Clock,
  TrendingUp,
  Eye,
  Users,
  Plus,
  ClipboardList,
  ExternalLink,
  Settings,
  BarChart3,
  Palette,
  ArrowUpRight,
  CircleDollarSign,
  Calculator,
  ArrowRightLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CurrencyRates {
  usd: { buy: number; sell: number };
  eur: { buy: number; sell: number };
  updatedAt: string;
}

interface DashboardStats {
  products: {
    total: number;
    active: number;
    outOfStock: number;
    lowStockProducts: Array<{
      id: string;
      title: string;
      stockQuantity: number;
      lowStockThreshold: number;
    }>;
  };
  orders: {
    total: number;
    todayCount: number;
    thisWeekCount: number;
    byStatus: Record<string, number>;
    recentOrders: Array<{
      id: string;
      status: string;
      quantity: number;
      createdAt: string;
      productTitle: string;
    }>;
  };
  revenue: {
    deliveredCount: number;
    estimatedTotal: number;
  };
  topProducts: Array<{
    id: string;
    title: string;
    orderCount: number;
  }>;
  isPro: boolean;
  analytics?: {
    pageViews7d: number;
    uniqueVisitors7d: number;
    conversionRate: number;
    dailyOrders: Array<{ date: string; count: number }>;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_KEYS = ["PENDING", "CONFIRMED", "IN_DELIVERY", "DELIVERED", "RETURNED"] as const;

function relativeTime(dateStr: string, t: (k: string) => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("dash.justNow");
  if (mins < 60) return `${mins}${t("dash.mAgo")}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t("dash.hAgo")}`;
  return `${Math.floor(hrs / 24)}${t("dash.dAgo")}`;
}

function fmt(n: number) {
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const {
    effectivePlan,
    remainingDays,
    isExpiringSoon,
    isExpiringUrgent,
  } = useEffectivePlan();
  const { t } = useTranslation();
  const { activeStore } = useStoreContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [dismissedPixel, setDismissedPixel] = useState(false);
  const [dismissedSheets, setDismissedSheets] = useState(false);

  // Profit calculator
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [qty, setQty] = useState("1");

  // Currency converter
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(false);
  const [convAmount, setConvAmount] = useState("1");
  const [convCurrency, setConvCurrency] = useState<"usd" | "eur">("usd");

  useEffect(() => {
    if (localStorage.getItem("_mws_show_welcome") === "1") {
      localStorage.removeItem("_mws_show_welcome");
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) { router.push("/auth/login"); return; }
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) setStats(await res.json());
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [session, sessionStatus, router]);

  // Fetch currency rates
  useEffect(() => {
    setRatesLoading(true);
    fetch("/api/tools/rates")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: CurrencyRates) => { setRates(data); setRatesError(false); })
      .catch(() => setRatesError(true))
      .finally(() => setRatesLoading(false));
  }, []);

  /* ── Loading state ─────────────────────────────────────── */
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  const isPro = effectivePlan === "PRO";
  const orders = stats?.orders;
  const products = stats?.products;
  const revenue = stats?.revenue;
  const analytics = stats?.analytics;

  const statusLabel: Record<string, string> = {
    PENDING: t("dash.statusPending"),
    CONFIRMED: t("dash.statusConfirmed"),
    IN_DELIVERY: t("dash.statusInDelivery"),
    DELIVERED: t("dash.statusDelivered"),
    RETURNED: t("dash.statusReturned"),
  };

  const totalByStatus = STATUS_KEYS.reduce((s, k) => s + (orders?.byStatus[k] || 0), 0) || 1;

  /* Build 7-day order chart -------------------------------- */
  const dailyMap = new Map(
    (analytics?.dailyOrders || []).map((d) => [d.date.split("T")[0], d.count])
  );
  const chart7: number[] = [];
  const chart7Labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    chart7.push(dailyMap.get(d.toISOString().split("T")[0]) || 0);
    chart7Labels.push(d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3));
  }
  const chart7Max = Math.max(...chart7, 1);

  /* Build weekly order chart (all users) from recentOrders -- */
  /* For FREE users we derive a simpler "this week" chart from byStatus */

  const firstName = session?.user?.email?.split("@")[0] || "";

  /* ── Profit calculator computations ─────────────────── */
  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellingPrice) || 0;
  const quantity = parseInt(qty) || 1;
  const margin = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
  const profitPerUnit = sell - cost;
  const totalProfit = profitPerUnit * quantity;
  const hasProfitInput = cost > 0 && sell > 0;

  /* ── Currency converter computations ────────────────── */
  const convAmt = parseFloat(convAmount) || 0;
  const selectedRate = rates ? rates[convCurrency] : null;
  const convResultBuy = selectedRate ? convAmt * selectedRate.buy : 0;
  const convResultSell = selectedRate ? convAmt * selectedRate.sell : 0;

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-d-text">
            {firstName ? `${t("dash.greeting")}, ${firstName}` : t("dashboard.title")}
          </h1>
          {isPro && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#303030] text-white text-[10px] font-bold tracking-wide">
              <Sparkles size={10} className="text-lime-400" />
              PRO
            </span>
          )}
        </div>
        <p className="text-[13px] text-d-text-muted mt-0.5">{t("dash.hereIsWhatsHappening")}</p>
      </div>

      {/* ── Subscription warning ─────────────────────────────── */}
      {isExpiringSoon && (
        <Link
          href="/dashboard/upgrade"
          className={`block rounded-xl p-5 mb-6 transition-all ${
            isExpiringUrgent
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {isExpiringUrgent ? t("dashboard.subscriptionExpiring") : t("dashboard.subscriptionExpiringSoon")}
              </p>
              <p className="text-white/75 text-sm mt-0.5">
                {t("dashboard.expiresIn")} {remainingDays}{" "}
                {remainingDays !== 1 ? t("dashboard.days") : t("dashboard.day")}. {t("dashboard.renewToKeep")}
              </p>
            </div>
            <span className="flex-shrink-0 bg-white/20 px-4 py-2 rounded-lg text-sm font-medium">
              {t("common.renewNow")}
            </span>
          </div>
        </Link>
      )}

      {effectivePlan === "FREE" && <div className="mb-6"><ProCTA /></div>}

      {/* ── Quick shortcuts — secondary icon buttons ──────────── */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 overflow-x-auto">
        <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-d-border bg-d-surface text-[13px] font-medium text-d-text hover:bg-d-hover-bg transition-colors shadow-card">
          <Plus className="w-4 h-4 text-d-text-sub" />
          {t("dash.addProduct")}
        </Link>
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-d-border bg-d-surface text-[13px] font-medium text-d-text hover:bg-d-hover-bg transition-colors shadow-card">
          <ClipboardList className="w-4 h-4 text-d-text-sub" />
          {t("dash.viewOrders")}
        </Link>
        <Link href="/dashboard/stores" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-d-border bg-d-surface text-[13px] font-medium text-d-text hover:bg-d-hover-bg transition-colors shadow-card">
          <ExternalLink className="w-4 h-4 text-d-text-sub" />
          {t("dash.viewStore")}
        </Link>
        <Link href="/dashboard/profile" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-d-border bg-d-surface text-[13px] font-medium text-d-text hover:bg-d-hover-bg transition-colors shadow-card">
          <Settings className="w-4 h-4 text-d-text-sub" />
          {t("dash.settings")}
        </Link>
        <Link href="/dashboard/analytics" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-d-border bg-d-surface text-[13px] font-medium text-d-text hover:bg-d-hover-bg transition-colors shadow-card">
          <BarChart3 className="w-4 h-4 text-d-text-sub" />
          {t("dash.analytics")}
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#303030] text-white text-[9px] font-bold">
            <Sparkles size={8} className="text-lime-400" />PRO
          </span>
        </Link>
        <Link href="/dashboard/style" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-d-border bg-d-surface text-[13px] font-medium text-d-text hover:bg-d-hover-bg transition-colors shadow-card">
          <Palette className="w-4 h-4 text-d-text-sub" />
          {t("dash.styleBuilder")}
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#303030] text-white text-[9px] font-bold">
            <Sparkles size={8} className="text-lime-400" />PRO
          </span>
        </Link>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Link href="/dashboard/orders" className="bg-d-surface rounded-xl shadow-card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-d-text-muted uppercase tracking-wide">{t("dash.totalOrders")}</span>
            <ShoppingCart className="w-4 h-4 text-d-text-muted" />
          </div>
          <p className="text-2xl font-bold text-d-text tracking-tight">{fmt(orders?.total || 0)}</p>
          <p className="text-[12px] text-d-text-sub mt-1">+{orders?.todayCount || 0} {t("dash.today")}</p>
        </Link>

        <Link href="/dashboard/products" className="bg-d-surface rounded-xl shadow-card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-d-text-muted uppercase tracking-wide">{t("dash.products")}</span>
            <Package className="w-4 h-4 text-d-text-muted" />
          </div>
          <p className="text-2xl font-bold text-d-text tracking-tight">
            {products?.active || 0}<span className="text-base font-normal text-d-text-muted">/{products?.total || 0}</span>
          </p>
          <p className="text-[12px] text-d-text-sub mt-1">{t("dash.activeProducts")}</p>
        </Link>

        <Link href="/dashboard/orders" className="bg-d-surface rounded-xl shadow-card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-d-text-muted uppercase tracking-wide">{t("dash.pendingOrders")}</span>
            <Clock className="w-4 h-4 text-d-text-muted" />
          </div>
          <p className="text-2xl font-bold text-d-text tracking-tight">{fmt(orders?.byStatus["PENDING"] || 0)}</p>
          <p className="text-[12px] text-d-text-sub mt-1">{t("dash.actionNeeded")}</p>
        </Link>

        <div className="bg-d-surface rounded-xl shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-d-text-muted uppercase tracking-wide">
              {isPro ? t("dash.revenue") : t("dash.delivered")}
            </span>
            <CircleDollarSign className="w-4 h-4 text-d-text-muted" />
          </div>
          <p className="text-2xl font-bold text-d-text tracking-tight">
            {isPro ? `${fmt(revenue?.estimatedTotal || 0)} ${t("common.da")}` : fmt(revenue?.deliveredCount || 0)}
          </p>
          <p className="text-[12px] text-d-text-sub mt-1">
            {isPro ? `${fmt(revenue?.deliveredCount || 0)} ${t("dash.deliveredOrders")}` : t("dash.deliveredOrders")}
          </p>
        </div>
      </div>

      {/* ── PRO: Traffic strip ───────────────────────────────── */}
      {isPro && analytics && (
        <div className="bg-d-surface rounded-xl shadow-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-d-text">{t("dash.trafficSummary")}</span>
            <Link href="/dashboard/analytics" className="text-[12px] font-medium text-d-link hover:underline inline-flex items-center gap-1">
              {t("dash.viewFullReport")} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 divide-x divide-d-border">
            <div className="px-2 sm:px-4 first:ps-0">
              <div className="flex items-center gap-1.5 text-d-text-muted mb-0.5">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">{t("dash.pageViews")}</span>
              </div>
              <p className="text-lg font-bold text-d-text">{fmt(analytics.pageViews7d)}</p>
            </div>
            <div className="px-4">
              <div className="flex items-center gap-1.5 text-d-text-muted mb-0.5">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">{t("dash.visitors")}</span>
              </div>
              <p className="text-lg font-bold text-d-text">{fmt(analytics.uniqueVisitors7d)}</p>
            </div>
            <div className="px-4 last:pe-0">
              <div className="flex items-center gap-1.5 text-d-text-muted mb-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">{t("dash.conversionRate")}</span>
              </div>
              <p className="text-lg font-bold text-d-text">{analytics.conversionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Setup CTA Alerts ──────────────────────────────── */}
      {!dismissedPixel && !activeStore?.metaPixelId && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 ps-1 pe-2 py-1 mb-3 sm:mb-4">
          <div className="w-1 self-stretch rounded-full bg-blue-500 flex-shrink-0" />
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z" />
          </svg>
          <div className="flex-1 min-w-0 py-1.5">
            <p className="text-[13px] font-semibold text-blue-900">{t("dash.setupPixel")}</p>
            <p className="text-[11px] text-blue-700/80 mt-0.5 hidden sm:block">{t("dash.setupPixelDesc")}</p>
          </div>
          <Link
            href="/dashboard/profile"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            {t("dash.configure")}
          </Link>
          <button
            onClick={() => setDismissedPixel(true)}
            className="flex-shrink-0 p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!dismissedSheets && !activeStore?.sheetsWebhookUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 ps-1 pe-2 py-1 mb-6">
          <div className="w-1 self-stretch rounded-full bg-emerald-500 flex-shrink-0" />
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 11V9H11V5H9V9H5V11H9V19H11V11H19M19 3C19.5 3 20 3.2 20.39 3.61C20.8 4 21 4.5 21 5V19C21 19.5 20.8 20 20.39 20.39C20 20.8 19.5 21 19 21H5C4.5 21 4 20.8 3.61 20.39C3.2 20 3 19.5 3 19V5C3 4.5 3.2 4 3.61 3.61C4 3.2 4.5 3 5 3H19Z" />
          </svg>
          <div className="flex-1 min-w-0 py-1.5">
            <p className="text-[13px] font-semibold text-emerald-900">
              {t("dash.setupSheets")}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#303030] text-white text-[9px] font-bold ms-1.5 align-middle">
                <Sparkles size={8} className="text-lime-400" />PRO
              </span>
            </p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5 hidden sm:block">{t("dash.setupSheetsDesc")}</p>
          </div>
          <Link
            href="/dashboard/profile"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            {t("dash.configure")}
          </Link>
          <button
            onClick={() => setDismissedSheets(true)}
            className="flex-shrink-0 p-1 rounded-md text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Tools: Profit Calculator + Currency Converter ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Profit Calculator */}
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-d-text-sub" />
            <h2 className="text-[14px] font-semibold text-d-text">{t("dash.profitCalc")}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[11px] text-d-text-muted block mb-1">{t("dash.costPrice")}</label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-d-border bg-d-surface text-d-text focus:outline-none focus:ring-1 focus:ring-d-text/20 tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-d-text-muted block mb-1">{t("dash.sellingPrice")}</label>
              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-d-border bg-d-surface text-d-text focus:outline-none focus:ring-1 focus:ring-d-text/20 tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-d-text-muted block mb-1">{t("dash.quantity")}</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-d-border bg-d-surface text-d-text focus:outline-none focus:ring-1 focus:ring-d-text/20 tabular-nums"
              />
            </div>
          </div>
          {hasProfitInput ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-d-border">
              <div className="text-center">
                <p className="text-[11px] text-d-text-muted mb-0.5">{t("dash.margin")}</p>
                <p className={`text-lg font-bold tabular-nums ${margin >= 0 ? "text-d-text" : "text-red-500"}`}>
                  {margin.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-d-text-muted mb-0.5">{t("dash.profitPerUnit")}</p>
                <p className={`text-lg font-bold tabular-nums ${profitPerUnit >= 0 ? "text-d-text" : "text-red-500"}`}>
                  {fmt(profitPerUnit)} {t("common.da")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-d-text-muted mb-0.5">{t("dash.totalProfit")}</p>
                <p className={`text-lg font-bold tabular-nums ${totalProfit >= 0 ? "text-d-text" : "text-red-500"}`}>
                  {fmt(totalProfit)} {t("common.da")}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-d-text-muted text-center pt-3 border-t border-d-border">
              {t("dash.costPrice")} &amp; {t("dash.sellingPrice")}
            </p>
          )}
        </div>

        {/* Currency Converter */}
        <div className="bg-d-surface rounded-xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="w-4 h-4 text-d-text-sub" />
            <h2 className="text-[14px] font-semibold text-d-text">{t("dash.currencyConv")}</h2>
          </div>
          {ratesLoading ? (
            <p className="text-[13px] text-d-text-muted text-center py-8">{t("dash.loadingRates")}</p>
          ) : ratesError || !rates ? (
            <p className="text-[13px] text-d-text-muted text-center py-8">{t("dash.rateError")}</p>
          ) : (
            <>
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[11px] text-d-text-muted block mb-1">{t("dash.amount")}</label>
                  <input
                    type="number"
                    min="0"
                    value={convAmount}
                    onChange={(e) => setConvAmount(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 text-[13px] rounded-lg border border-d-border bg-d-surface text-d-text focus:outline-none focus:ring-1 focus:ring-d-text/20 tabular-nums"
                  />
                </div>
                <div className="w-28">
                  <label className="text-[11px] text-d-text-muted block mb-1">&nbsp;</label>
                  <div className="flex rounded-lg border border-d-border overflow-hidden">
                    <button
                      onClick={() => setConvCurrency("usd")}
                      className={`flex-1 px-3 py-2 text-[12px] font-medium transition-colors ${
                        convCurrency === "usd"
                          ? "bg-d-text text-white"
                          : "bg-d-surface text-d-text-sub hover:bg-d-hover-bg"
                      }`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => setConvCurrency("eur")}
                      className={`flex-1 px-3 py-2 text-[12px] font-medium transition-colors ${
                        convCurrency === "eur"
                          ? "bg-d-text text-white"
                          : "bg-d-surface text-d-text-sub hover:bg-d-hover-bg"
                      }`}
                    >
                      EUR
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-d-border mb-3">
                <div className="text-center">
                  <p className="text-[11px] text-d-text-muted mb-0.5">{t("dash.buyRate")}</p>
                  <p className="text-lg font-bold text-d-text tabular-nums">
                    {fmt(Math.round(convResultBuy))} {t("common.da")}
                  </p>
                  <p className="text-[10px] text-d-text-muted tabular-nums">1 {convCurrency.toUpperCase()} = {selectedRate?.buy || 0} {t("common.da")}</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-d-text-muted mb-0.5">{t("dash.sellRate")}</p>
                  <p className="text-lg font-bold text-d-text tabular-nums">
                    {fmt(Math.round(convResultSell))} {t("common.da")}
                  </p>
                  <p className="text-[10px] text-d-text-muted tabular-nums">1 {convCurrency.toUpperCase()} = {selectedRate?.sell || 0} {t("common.da")}</p>
                </div>
              </div>
              <p className="text-[10px] text-d-text-muted text-center">
                {t("dash.ratesFrom")} devisesquare.com
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Two-column: Recent + Right sidebar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

        {/* Recent orders — 3/5 */}
        <div className="lg:col-span-3 bg-d-surface rounded-xl shadow-card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-[14px] font-semibold text-d-text">{t("dash.recentOrders")}</h2>
            <Link href="/dashboard/orders" className="text-[12px] text-d-link hover:underline">{t("dash.viewAll")}</Link>
          </div>
          {(orders?.recentOrders || []).length > 0 ? (
            <div className="divide-y divide-d-border">
              {orders!.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 bg-d-text"
                    style={{ opacity: o.status === "DELIVERED" ? 0.3 : o.status === "PENDING" ? 1 : 0.6 }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-d-text truncate">{o.productTitle}</p>
                    <p className="text-[11px] text-d-text-muted">x{o.quantity} &middot; {relativeTime(o.createdAt, t)}</p>
                  </div>
                  <span className="text-[11px] font-medium text-d-text-sub bg-d-surface-secondary px-2.5 py-1 rounded-md flex-shrink-0">
                    {statusLabel[o.status]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-d-text-muted text-center py-10 pb-8">{t("dash.noOrdersYet")}</p>
          )}
        </div>

        {/* Right column — 2/5 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stock alerts */}
          <div className="bg-d-surface rounded-xl shadow-card">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-[14px] font-semibold text-d-text">{t("dash.stockAlerts")}</h2>
              {(products?.lowStockProducts || []).length > 0 && (
                <span className="text-[11px] font-bold text-d-text-sub bg-d-surface-secondary px-2 py-0.5 rounded-md">
                  {products!.lowStockProducts.length}
                </span>
              )}
            </div>
            {(products?.lowStockProducts || []).length > 0 ? (
              <div className="divide-y divide-d-border">
                {products!.lowStockProducts.map((p) => {
                  const pct = p.lowStockThreshold > 0
                    ? Math.min((p.stockQuantity / p.lowStockThreshold) * 100, 100) : 0;
                  const isOut = p.stockQuantity === 0;
                  return (
                    <Link
                      key={p.id}
                      href={`/dashboard/products/${p.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-d-hover-bg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-d-text truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-d-surface-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-d-text transition-all"
                              style={{ width: `${pct}%`, opacity: isOut ? 0.2 : 0.45 }}
                            />
                          </div>
                          <span className="text-[10px] text-d-text-muted tabular-nums w-6 text-end">{p.stockQuantity}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                        isOut ? "bg-d-surface-secondary text-d-text" : "bg-d-surface-secondary text-d-text-sub"
                      }`}>
                        {isOut ? t("dash.outOfStock") : t("dash.lowStock")}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center px-5 py-10 pb-8">
                <Package className="w-6 h-6 text-d-text-muted mx-auto mb-2" />
                <p className="text-[13px] text-d-text-muted">{t("dash.stockHealthy")}</p>
              </div>
            )}
          </div>

          {/* Top products */}
          <div className="bg-d-surface rounded-xl shadow-card">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-[14px] font-semibold text-d-text">{t("dash.productPerformance")}</h2>
            </div>
            {(stats?.topProducts || []).length > 0 ? (
              <div className="divide-y divide-d-border">
                {stats!.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 h-5 rounded bg-d-surface-secondary flex items-center justify-center text-[11px] font-bold text-d-text-sub">
                      {i + 1}
                    </span>
                    <p className="flex-1 min-w-0 text-[13px] font-medium text-d-text truncate">{p.title}</p>
                    <span className="text-[12px] font-semibold text-d-text-sub tabular-nums">{p.orderCount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center px-5 py-10 pb-8">
                <BarChart3 className="w-6 h-6 text-d-text-muted mx-auto mb-2" />
                <p className="text-[13px] text-d-text-muted">{t("dash.noProductData")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Orders by status (compact) ─────────────────────── */}
      {(orders?.total || 0) > 0 && (
        <div className="bg-d-surface rounded-xl shadow-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-d-text">{t("dash.ordersOverview")}</h2>
            <Link href="/dashboard/orders" className="text-[12px] text-d-link hover:underline">{t("dash.viewAll")}</Link>
          </div>
          {isPro && analytics && chart7.some((v) => v > 0) ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-t border-d-border" />
                  ))}
                </div>
                <div className="relative flex items-end gap-2 h-24">
                  {chart7.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      {v > 0 && (
                        <span className="text-[9px] text-d-text-sub font-medium tabular-nums mb-0.5">{v}</span>
                      )}
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${Math.max((v / chart7Max) * 100, v > 0 ? 4 : 0)}%`,
                          backgroundColor: v > 0 ? "var(--d-text)" : "var(--d-border)",
                          opacity: v > 0 ? 0.65 : 0.2,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex mt-1.5">
                {chart7Labels.map((l, i) => (
                  <span key={i} className="flex-1 text-center text-[9px] text-d-text-muted">{l}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {STATUS_KEYS.map((s) => {
                const count = orders?.byStatus[s] || 0;
                const pct = (count / totalByStatus) * 100;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="text-[11px] text-d-text-sub w-24 truncate">{statusLabel[s]}</span>
                    <div className="flex-1 h-1.5 bg-d-surface-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-d-text transition-all"
                        style={{ width: `${pct}%`, opacity: 0.5 }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-d-text tabular-nums w-8 text-end">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Welcome Modal ────────────────────────────────────── */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-d-surface shadow-2xl border border-d-border overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-lime-400 to-emerald-500" />
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 end-4 text-d-text-muted hover:text-d-text transition-colors"
            >
              <X size={20} />
            </button>
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <PartyPopper size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-d-text mb-2">{t("welcome.title")}</h2>
              <p className="text-sm text-d-text-sub mb-6">{t("welcome.subtitle")}</p>
              <div className="flex items-center justify-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Coins size={20} className="text-amber-600" />
                </div>
                <div className="text-start">
                  <p className="text-sm font-bold text-amber-800">{t("welcome.bonusTitle")}</p>
                  <p className="text-xs text-amber-600">{t("welcome.bonusDesc")}</p>
                </div>
              </div>
              <div className="space-y-2 text-start mb-6">
                {["welcome.tip1", "welcome.tip2", "welcome.tip3"].map((key) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-d-text-sub">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {t(key)}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors bg-gradient-to-b from-[#3a3a3a] to-[#262626] hover:from-[#404040] hover:to-[#2b2b2b] border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
              >
                {t("welcome.getStarted")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
