"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { useStoreContext } from "@/lib/store-context";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { useTranslation } from "@/components/language-provider";
import {
  X,
  Sparkles,
  ShoppingCart,
  Package,
  Coins,
  BarChart3,
  Palette,
  Check,
} from "lucide-react";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { effectivePlan } = useEffectivePlan();
  const { t } = useTranslation();
  const { activeStore, loading } = useStoreContext();
  const router = useRouter();

  const proFeatures = [
    { icon: ShoppingCart, label: t("proWelcome.allOrders") },
    { icon: Package, label: t("proWelcome.100products") },
    { icon: Coins, label: t("proWelcome.200tokens") },
    { icon: BarChart3, label: t("proWelcome.analytics") },
    { icon: Palette, label: t("proWelcome.customPages") },
  ];
  const [showProWelcome, setShowProWelcome] = useState(false);

  useEffect(() => {
    if (
      effectivePlan === "PRO" &&
      !localStorage.getItem("_mws_pro_welcome_seen")
    ) {
      setShowProWelcome(true);
    }
  }, [effectivePlan]);

  // Redirect to onboarding if user has no store
  useEffect(() => {
    if (!loading && !activeStore) {
      router.replace("/onboarding");
    }
  }, [loading, activeStore, router]);

  function dismissWelcome() {
    localStorage.setItem("_mws_pro_welcome_seen", "1");
    setShowProWelcome(false);
  }

  // Show loading while checking store
  if (loading || !activeStore) {
    return (
      <div className="flex h-screen items-center justify-center bg-d-bg">
        <div className="w-6 h-6 border-2 border-d-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${effectivePlan === "PRO" ? "pro-dark" : ""}`}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col ms-64">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-d-bg">{children}</main>
      </div>

      {showProWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-gradient-to-b from-[#3a3a3a] to-[#262626] border border-white/10 shadow-2xl p-8">
            <button
              onClick={dismissWelcome}
              className="absolute top-4 end-4 text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles size={22} className="text-lime-400" />
              <h2 className="text-white font-bold text-xl">
                {t("proWelcome.title")}
              </h2>
            </div>

            <p className="text-white/60 text-sm mb-6">
              {t("proWelcome.subtitle")}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {proFeatures.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 bg-white/[0.07] rounded-lg px-3 py-2.5 border border-white/[0.08]"
                >
                  <Check
                    size={16}
                    className="text-emerald-400 flex-shrink-0"
                  />
                  <span className="text-white/90 text-sm font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={dismissWelcome}
              className="w-full bg-white text-[#303030] py-3 rounded-lg text-sm font-bold hover:bg-[#f1f1f1] transition-colors"
            >
              {t("proWelcome.getStarted")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutInner>{children}</LayoutInner>
  );
}
