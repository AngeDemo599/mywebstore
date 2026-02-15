"use client";

import { useTranslation } from "@/components/language-provider";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === "ar" ? "fr" : "ar")}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-d-hover-bg text-d-text-sub hover:text-d-text ${className}`}
      title={locale === "ar" ? "Français" : "عربي"}
    >
      <Globe size={16} />
      <span>{locale === "ar" ? "FR" : "عربي"}</span>
    </button>
  );
}
