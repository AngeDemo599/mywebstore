"use client";

import Link from "next/link";
import {
  Sparkles,
  ShoppingCart,
  Package,
  Coins,
  BarChart3,
  Palette,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/components/language-provider";

export default function ProCTA() {
  const { t } = useTranslation();

  const features = [
    { icon: ShoppingCart, label: t("proCta.allOrders") },
    { icon: Package, label: t("proCta.100products") },
    { icon: Coins, label: t("proCta.200tokens") },
    { icon: BarChart3, label: t("proCta.analytics") },
    { icon: Palette, label: t("proCta.customPages") },
  ];

  return (
    <Link
      href="/dashboard/upgrade"
      className="block rounded-xl overflow-hidden bg-gradient-to-b from-[#3a3a3a] to-[#262626] border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.3)] hover:from-[#404040] hover:to-[#2b2b2b] transition-all group"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-lime-400" />
          <h3 className="text-white font-bold text-lg">{t("proCta.title")}</h3>
        </div>
        <p className="text-white/60 text-sm mb-5">
          {t("proCta.subtitle")}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 bg-white/[0.07] rounded-lg px-3 py-2.5 border border-white/[0.08]">
              <Icon size={16} className="text-lime-400 flex-shrink-0" />
              <span className="text-white/90 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-2xl">5,000</span>
            <span className="text-white/50 text-sm font-medium">{t("common.da")} {t("common.perMonth")}</span>
          </div>
          <div className="flex items-center gap-2 bg-white text-[#303030] px-4 py-2.5 rounded-lg text-sm font-bold group-hover:bg-[#f1f1f1] transition-colors">
            {t("proCta.upgrade")}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
