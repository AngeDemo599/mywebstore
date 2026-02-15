"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { PLAN_LIMITS } from "@/lib/auth-helpers";
import { Sparkles, PartyPopper, Coins, X } from "lucide-react";
import ProCTA from "@/components/pro-cta";
import { useTranslation } from "@/components/language-provider";

interface Stats {
  productCount: number;
  orderCount: number;
  newOrders: number;
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const {
    effectivePlan,
    remainingDays,
    isExpired,
    isExpiringSoon,
    isExpiringUrgent,
  } = useEffectivePlan();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("_mws_show_welcome") === "1") {
      localStorage.removeItem("_mws_show_welcome");
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/orders"),
        ]);

        const products = await productsRes.json();
        const orders = await ordersRes.json();

        const productsList = Array.isArray(products) ? products : [];
        const ordersList = Array.isArray(orders) ? orders : [];

        const lastSeen = localStorage.getItem("_mws_orders_seen_at") || "1970-01-01T00:00:00.000Z";
        const lastSeenDate = new Date(lastSeen).getTime();

        setStats({
          productCount: productsList.length,
          orderCount: ordersList.length,
          newOrders: ordersList.filter(
            (o: { createdAt: string }) => new Date(o.createdAt).getTime() > lastSeenDate
          ).length,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, sessionStatus, router]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  const limits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS];

  const isPro = effectivePlan === "PRO";

  const cards = [
    {
      title: t("dashboard.products"),
      href: "/dashboard/products",
      description: `${stats?.productCount ?? 0} / ${limits.maxProducts} ${t("common.products")}`,
      stat:
        (stats?.productCount ?? 0) >= limits.maxProducts
          ? t("common.limitReached")
          : t("common.manageProducts"),
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      title: t("dashboard.orders"),
      href: "/dashboard/orders",
      description: `${stats?.orderCount ?? 0} ${t("dashboard.total")}${stats?.newOrders ? `, ${stats.newOrders} ${t("common.new")}` : ""}`,
      stat: isPro
        ? t("common.fullAccess")
        : t("common.upgradeToSee"),
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-d-text">{t("dashboard.title")}</h1>
        {isPro && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#303030] text-white text-[11px] font-bold">
            <Sparkles size={11} className="text-lime-400" />
            PRO
          </span>
        )}
      </div>

      {/* Renewal warning banners for PRO users */}
      {isExpiringSoon && (
        <Link
          href="/dashboard/upgrade"
          className={`block rounded-lg p-6 mb-8 transition-all shadow-md ${
            isExpiringUrgent
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
              : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">
                {isExpiringUrgent
                  ? t("dashboard.subscriptionExpiring")
                  : t("dashboard.subscriptionExpiringSoon")}
              </h2>
              <p className="text-white/80 text-sm">
                {t("dashboard.expiresIn")} {remainingDays} {remainingDays !== 1 ? t("dashboard.days") : t("dashboard.day")}. {t("dashboard.renewToKeep")}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium">
                {t("common.renewNow")}
              </span>
            </div>
          </div>
        </Link>
      )}

      {effectivePlan === "FREE" && (
        <div className="mb-8">
          <ProCTA />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-d-surface rounded-xl shadow-card p-4 hover:shadow-md transition-shadow relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${card.color}`}
              >
                {card.title}
              </div>
              {card.title === "Orders" && (stats?.newOrders ?? 0) > 0 && (
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {(stats?.newOrders ?? 0) > 99 ? "99+" : stats?.newOrders}
                </span>
              )}
            </div>
            <p className="text-d-text font-medium">{card.description}</p>
            <p className="text-sm text-d-text-sub mt-1">{card.stat}</p>
          </Link>
        ))}
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-d-surface shadow-2xl border border-d-border overflow-hidden">
            {/* Gradient top bar */}
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

              <h2 className="text-xl font-bold text-d-text mb-2">
                {t("welcome.title")}
              </h2>
              <p className="text-sm text-d-text-sub mb-6">
                {t("welcome.subtitle")}
              </p>

              {/* Token bonus */}
              <div className="flex items-center justify-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Coins size={20} className="text-amber-600" />
                </div>
                <div className="text-start">
                  <p className="text-sm font-bold text-amber-800">
                    {t("welcome.bonusTitle")}
                  </p>
                  <p className="text-xs text-amber-600">
                    {t("welcome.bonusDesc")}
                  </p>
                </div>
              </div>

              {/* Tips */}
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
