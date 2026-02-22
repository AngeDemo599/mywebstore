"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Plus } from "lucide-react";
import { useTranslation } from "@/components/language-provider";

const MetaPixelIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0 text-lime-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z" />
  </svg>
);
const GoogleSheetsIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0 text-lime-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20M8 15H16V17H8V15M8 11H16V13H8V11Z" />
  </svg>
);
const MarketplaceImportIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0 text-lime-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7V9H22V7L12 2M6 10V16H8V10H6M10 10V16H14V10H10M16 10V16H18V10H16M2 18V20H22V18H2Z" />
  </svg>
);

export default function ProCTA() {
  const { t } = useTranslation();

  const features: Array<{ label: string; icon?: React.ReactNode }> = [
    { label: t("proCta.allOrders") },
    { label: t("proCta.100products") },
    { label: t("proCta.200tokens") },
    { label: t("proCta.analytics") },
    { label: t("proCta.customPages") },
    { label: t("proCta.metaPixel"), icon: <MetaPixelIcon /> },
    { label: t("proCta.googleSheets"), icon: <GoogleSheetsIcon /> },
    { label: t("proCta.marketplaceImport"), icon: <MarketplaceImportIcon /> },
    { label: t("proCta.adFree") },
  ];

  return (
    <Link
      href="/dashboard/upgrade"
      className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl bg-gradient-to-r from-[#2c2c2c] to-[#1a1a1a] border border-white/[0.08] p-3 sm:p-3.5 hover:from-[#333] hover:to-[#222] transition-all group overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-lime-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-lime-400/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-lime-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lime-400 text-[11px] font-bold tracking-wider">PRO</span>
            <span className="text-white/70 text-[12px] sm:text-[13px] font-semibold">{t("proCta.title")}</span>
          </div>
          <p className="text-white/35 text-[10px] sm:text-[11px] mt-0.5 hidden sm:block">{t("proCta.subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 sm:gap-1.5 flex-1 min-w-0">
        {features.map(({ label, icon }) => (
          <span key={label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] text-[9px] sm:text-[10px] font-medium text-white/60 whitespace-nowrap">
            {icon || <Plus size={8} className="text-lime-400 flex-shrink-0" />}
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
        <div className="text-end">
          <span className="text-white font-bold text-sm sm:text-base leading-none">5,000</span>
          <span className="text-white/35 text-[9px] sm:text-[10px] font-medium ms-0.5">{t("common.da")}/{t("common.perMonth")}</span>
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-lime-400 flex items-center justify-center flex-shrink-0 group-hover:bg-lime-300 transition-colors shadow-[0_0_12px_rgba(200,240,63,0.3)] group-hover:shadow-[0_0_20px_rgba(200,240,63,0.5)]">
          <ArrowRight size={14} className="text-[#1a1a1a]" />
        </div>
      </div>
    </Link>
  );
}
