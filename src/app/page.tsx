"use client";

import Navbar from "@/components/navbar";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Palette,
  BarChart3,
  MapPin,
  Smartphone,
  MessageCircle,
  Search,
  MapPinOff,
  TrendingDown,
  ArrowRight,
  Check,
  Sparkles,
  Play,
  ChevronDown,
  ChevronUp,
  Store,
  Upload,
  Bell,
  Star,
  Facebook,
  Sheet,
  Target,
  Globe,
  FileSpreadsheet,
  Link2,
  BoxesIcon,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

/* ─── FAQ Accordion Item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-d-border rounded-xl overflow-hidden bg-d-surface">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-d-hover-bg transition-colors"
      >
        <span className="text-[14px] font-semibold text-d-text">{q}</span>
        {open ? <ChevronUp size={18} className="text-d-text-muted flex-shrink-0 ms-3" /> : <ChevronDown size={18} className="text-d-text-muted flex-shrink-0 ms-3" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-[13px] text-d-text-sub leading-relaxed animate-tab-in">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Navbar />
      <main className="overflow-hidden">

        {/* ════════════════════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════════════════ */}
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#f1f1f1] pointer-events-none" />
          {/* Brand glow orb */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C8F03F]/[0.07] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center animate-tab-in">
            {/* Trust chip */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-d-surface border border-d-border shadow-card text-[12px] text-d-text-sub font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t("landing.heroBadge")}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-d-text leading-tight tracking-tight mb-5">
              {t("landing.heroTitle")}
            </h1>

            <p className="text-base sm:text-lg text-d-text-sub leading-relaxed max-w-xl mx-auto mb-8">
              {t("landing.heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <StyledButton variant="primary" size="lg" href="/auth/register" icon={<ArrowRight size={18} />}>
                {t("landing.heroCta")}
              </StyledButton>
              <StyledButton variant="secondary" size="lg" href="#how-it-works">
                {t("landing.heroCtaSecondary")}
              </StyledButton>
            </div>

            <p className="text-[12px] text-d-text-muted">
              {t("landing.heroTrust")}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            PROBLEM SECTION
        ════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text mb-4">
              {t("landing.problemTitle")}
            </h2>
            <p className="text-d-text-sub text-[14px] mb-10 max-w-lg mx-auto">
              {t("landing.problemSubtitle")}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {[
                { icon: MessageCircle, key: "landing.problem1" },
                { icon: Search, key: "landing.problem2" },
                { icon: BarChart3, key: "landing.problem3" },
                { icon: MapPinOff, key: "landing.problem4" },
                { icon: TrendingDown, key: "landing.problem5" },
              ].map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <Icon size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[13px] text-d-text font-medium">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            SOLUTION SECTION
        ════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#f1f1f1]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8F03F]/20 text-[11px] font-bold text-[#5a7010] mb-5">
              <Sparkles size={12} />
              {t("landing.solutionBadge")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text mb-4">
              {t("landing.solutionTitle")}
            </h2>
            <p className="text-d-text-sub text-[14px] leading-relaxed max-w-lg mx-auto">
              {t("landing.solutionDesc")}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            HOW IT WORKS — 3 STEPS
        ════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text text-center mb-14">
              {t("landing.stepsTitle")}
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { num: "1", icon: Store, titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
                { num: "2", icon: Upload, titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
                { num: "3", icon: Bell, titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
              ].map(({ num, icon: Icon, titleKey, descKey }) => (
                <div key={num} className="relative text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-b from-[#3a3a3a] to-[#262626] border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)] flex items-center justify-center">
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="text-[11px] font-bold text-d-text-muted uppercase tracking-wider mb-2">
                    {t("landing.step")} {num}
                  </div>
                  <h3 className="text-[15px] font-bold text-d-text mb-2">{t(titleKey)}</h3>
                  <p className="text-[13px] text-d-text-sub leading-relaxed">{t(descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FEATURES GRID
        ════════════════════════════════════════════════════ */}
        {/* ════════════════════════════════════════════════════
            FEATURES — Apple/Stripe style, one feature per block
        ════════════════════════════════════════════════════ */}
        <div id="features">

          {/* ── Feature 1: Storefront ── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 mb-4">
                  <ShoppingBag size={12} />
                  {t("landing.feat1Title")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-d-text leading-tight mb-4">
                  {t("landing.feat1Headline")}
                </h2>
                <p className="text-[14px] text-d-text-sub leading-relaxed">
                  {t("landing.feat1Desc")}
                </p>
              </div>
              {/* Image placeholder — replace src with your screenshot */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag size={48} className="text-blue-300" />
                </div>
              </div>
            </div>
          </section>

          {/* ── Feature 2: Orders ── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#f1f1f1]">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="order-2 md:order-1 relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package size={48} className="text-emerald-300" />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 mb-4">
                  <Package size={12} />
                  {t("landing.feat2Title")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-d-text leading-tight mb-4">
                  {t("landing.feat2Headline")}
                </h2>
                <p className="text-[14px] text-d-text-sub leading-relaxed">
                  {t("landing.feat2Desc")}
                </p>
              </div>
            </div>
          </section>

          {/* ── Feature 3: Customizable Design ── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[11px] font-bold text-purple-700 mb-4">
                  <Palette size={12} />
                  {t("landing.feat3Title")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-d-text leading-tight mb-4">
                  {t("landing.feat3Headline")}
                </h2>
                <p className="text-[14px] text-d-text-sub leading-relaxed">
                  {t("landing.feat3Desc")}
                </p>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50 shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Palette size={48} className="text-purple-300" />
                </div>
              </div>
            </div>
          </section>

          {/* ── Feature 4: Dashboard ── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#f1f1f1]">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="order-2 md:order-1 relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <BarChart3 size={48} className="text-amber-300" />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-[11px] font-bold text-amber-700 mb-4">
                  <BarChart3 size={12} />
                  {t("landing.feat4Title")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-d-text leading-tight mb-4">
                  {t("landing.feat4Headline")}
                </h2>
                <p className="text-[14px] text-d-text-sub leading-relaxed">
                  {t("landing.feat4Desc")}
                </p>
              </div>
            </div>
          </section>

          {/* ── Feature 5: Integrations (FB Import, Meta Pixel, Sheets) ── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 mb-4">
                  <Link2 size={12} />
                  {t("landing.feat16Title")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-d-text leading-tight mb-4">
                  {t("landing.feat16Headline")}
                </h2>
                <p className="text-[14px] text-d-text-sub leading-relaxed mb-6">
                  {t("landing.feat16Desc")}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Facebook, key: "landing.feat7Title" },
                    { icon: Target, key: "landing.feat8Title" },
                    { icon: Sheet, key: "landing.feat9Title" },
                    { icon: FileSpreadsheet, key: "landing.feat10Title" },
                  ].map(({ icon: Icon, key }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-indigo-500" />
                      </div>
                      <span className="text-[13px] font-medium text-d-text">{t(key)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/50 shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  <Facebook size={36} className="text-indigo-300" />
                  <Target size={36} className="text-indigo-200" />
                  <Sheet size={36} className="text-indigo-300" />
                </div>
              </div>
            </div>
          </section>

          {/* ── Feature 6: More tools — compact strip ── */}
          <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#f1f1f1]">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-d-text mb-10">
                {t("landing.featMoreTitle")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { icon: MapPin, key: "landing.feat5Title" },
                  { icon: Smartphone, key: "landing.feat6Title" },
                  { icon: BoxesIcon, key: "landing.feat11Title" },
                  { icon: Globe, key: "landing.feat13Title" },
                  { icon: Calculator, key: "landing.feat14Title" },
                  { icon: RefreshCw, key: "landing.feat15Title" },
                  { icon: Link2, key: "landing.feat12Title" },
                ].map(({ icon: Icon, key }) => (
                  <div key={key} className="flex flex-col items-center gap-2 p-4 bg-d-surface rounded-xl shadow-card border border-d-border">
                    <div className="w-10 h-10 rounded-xl bg-d-surface-secondary flex items-center justify-center">
                      <Icon size={20} className="text-d-text-sub" />
                    </div>
                    <span className="text-[12px] font-semibold text-d-text text-center leading-snug">{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ════════════════════════════════════════════════════
            SOCIAL PROOF (placeholder)
        ════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text mb-4">
              {t("landing.socialTitle")}
            </h2>
            <p className="text-d-text-muted text-[13px] mb-10">
              {t("landing.socialPlaceholder")}
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-d-surface rounded-xl shadow-card p-6 border border-d-border">
                  <div className="flex gap-0.5 mb-3 justify-center">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <div className="h-3 bg-d-surface-secondary rounded-full w-4/5 mx-auto mb-2" />
                  <div className="h-3 bg-d-surface-secondary rounded-full w-3/5 mx-auto mb-4" />
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-8 h-8 rounded-full bg-d-surface-tertiary" />
                    <div className="h-3 bg-d-surface-secondary rounded-full w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            DEMO SECTION
        ════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#f1f1f1]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text mb-4">
              {t("landing.demoTitle")}
            </h2>
            <p className="text-d-text-sub text-[14px] mb-8 max-w-lg mx-auto">
              {t("landing.demoDesc")}
            </p>

            <div className="relative aspect-video bg-d-surface rounded-2xl shadow-card border border-d-border overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={28} className="text-white ms-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[12px] text-white/60 font-medium">{t("landing.demoVideo")}</span>
                <span className="text-[12px] text-white/40">0:45</span>
              </div>
            </div>

            <div className="mt-6">
              <StyledButton variant="secondary" size="md" href="/store/demo">
                {t("landing.demoStore")}
              </StyledButton>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            PRICING SECTION
        ════════════════════════════════════════════════════ */}
        <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text text-center mb-3">
              {t("landing.pricingTitle")}
            </h2>
            <p className="text-d-text-sub text-[14px] text-center mb-14 max-w-md mx-auto">
              {t("landing.pricingSubtitle")}
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* FREE Plan */}
              <div className="bg-d-surface rounded-xl shadow-card border border-d-border p-7">
                <h3 className="text-lg font-bold text-d-text mb-1">{t("landing.planFreeTitle")}</h3>
                <p className="text-[12px] text-d-text-muted mb-5">{t("landing.planFreeDesc")}</p>
                <div className="text-3xl font-bold text-d-text mb-6">
                  {t("landing.planFreePrice")}
                </div>
                {[
                  "landing.planFree1",
                  "landing.planFree2",
                  "landing.planFree3",
                  "landing.planFree4",
                ].map((key) => (
                  <div key={key} className="flex items-center gap-2.5 mb-3">
                    <div className="w-5 h-5 rounded-full bg-d-surface-secondary flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-d-text-sub" />
                    </div>
                    <span className="text-[13px] text-d-text">{t(key)}</span>
                  </div>
                ))}
                <StyledButton variant="secondary" size="md" href="/auth/register" className="w-full mt-6">
                  {t("landing.planFreeCta")}
                </StyledButton>
              </div>

              {/* PRO Plan */}
              <div className="relative bg-d-surface rounded-xl shadow-card border-2 border-d-text p-7">
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#303030] text-white text-[11px] font-bold">
                  <Sparkles size={10} className="text-lime-400" />
                  PRO
                </div>
                <h3 className="text-lg font-bold text-d-text mb-1 mt-1">{t("landing.planProTitle")}</h3>
                <p className="text-[12px] text-d-text-muted mb-5">{t("landing.planProDesc")}</p>
                <div className="text-3xl font-bold text-d-text mb-1">
                  5,000 <span className="text-base font-medium text-d-text-sub">DA/{t("landing.month")}</span>
                </div>
                <p className="text-[11px] text-d-text-muted mb-6">{t("landing.planProYearly")}</p>
                {[
                  "landing.planPro1",
                  "landing.planPro2",
                  "landing.planPro3",
                  "landing.planPro4",
                  "landing.planPro5",
                  "landing.planPro6",
                ].map((key) => (
                  <div key={key} className="flex items-center gap-2.5 mb-3">
                    <div className="w-5 h-5 rounded-full bg-lime-100 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-lime-700" />
                    </div>
                    <span className="text-[13px] text-d-text">{t(key)}</span>
                  </div>
                ))}
                <StyledButton variant="primary" size="md" href="/auth/register" className="w-full mt-6" icon={<Sparkles size={16} />}>
                  {t("landing.planProCta")}
                </StyledButton>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            LOCAL TRUST SECTION
        ════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#f1f1f1]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-4xl mb-4">&#x1F1E9;&#x1F1FF;</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text mb-4">
              {t("landing.trustTitle")}
            </h2>
            <p className="text-d-text-sub text-[14px] mb-10 max-w-lg mx-auto leading-relaxed">
              {t("landing.trustDesc")}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              {[
                "landing.trust1",
                "landing.trust2",
                "landing.trust3",
                "landing.trust4",
              ].map((key) => (
                <div key={key} className="flex items-center gap-3 p-4 bg-d-surface rounded-xl shadow-card">
                  <div className="w-8 h-8 rounded-lg bg-[#C8F03F]/20 flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-[#5a7010]" />
                  </div>
                  <span className="text-[13px] font-medium text-d-text">{t(key)}</span>
                </div>
              ))}
            </div>

            <p className="text-[13px] text-d-text-sub mt-8 italic">
              {t("landing.trustFooter")}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FOUNDER SECTION
        ════════════════════════════════════════════════════ */}
        <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text mb-4">
              {t("landing.founderTitle")}
            </h2>

            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#3a3a3a] to-[#262626] mx-auto mb-6 flex items-center justify-center border-2 border-d-border shadow-lg">
              <span className="text-2xl text-white font-bold">S</span>
            </div>

            <p className="text-[14px] text-d-text-sub leading-relaxed mb-6 max-w-lg mx-auto">
              {t("landing.founderDesc")}
            </p>
            <p className="text-[14px] text-d-text font-semibold leading-relaxed max-w-md mx-auto">
              {t("landing.founderMission")}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FAQ SECTION
        ════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#f1f1f1]">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-d-text text-center mb-12">
              {t("landing.faqTitle")}
            </h2>

            <div className="space-y-3">
              {[
                { q: "landing.faq1Q", a: "landing.faq1A" },
                { q: "landing.faq2Q", a: "landing.faq2A" },
                { q: "landing.faq3Q", a: "landing.faq3A" },
                { q: "landing.faq4Q", a: "landing.faq4A" },
                { q: "landing.faq5Q", a: "landing.faq5A" },
              ].map(({ q, a }) => (
                <FaqItem key={q} q={t(q)} a={t(a)} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FINAL CTA SECTION
        ════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-white to-[#f1f1f1] relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#C8F03F]/[0.06] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-d-text mb-4">
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-d-text-sub text-[14px] leading-relaxed mb-8 max-w-md mx-auto">
              {t("landing.ctaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <StyledButton variant="primary" size="lg" href="/auth/register" icon={<ArrowRight size={18} />}>
                {t("landing.heroCta")}
              </StyledButton>
              <StyledButton variant="outline" size="lg" href="/store/demo">
                {t("landing.demoStore")}
              </StyledButton>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════ */}
        <footer className="border-t border-d-border bg-white py-10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
              <div className="text-center md:text-left">
                <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={130} height={36} className="h-8 w-auto mx-auto md:mx-0 mb-3" />
                <p className="text-[12px] text-d-text-muted max-w-xs">
                  {t("landing.footerTagline")}
                </p>
              </div>

              <div className="flex gap-8 text-[13px]">
                <div className="space-y-2">
                  <a href="#features" className="block text-d-text-sub hover:text-d-text transition-colors">{t("navbar.features")}</a>
                  <a href="#pricing" className="block text-d-text-sub hover:text-d-text transition-colors">{t("navbar.pricing")}</a>
                  <a href="#about" className="block text-d-text-sub hover:text-d-text transition-colors">{t("navbar.about")}</a>
                </div>
                <div className="space-y-2">
                  <Link href="/store/demo" className="block text-d-text-sub hover:text-d-text transition-colors">{t("navbar.demo")}</Link>
                  <Link href="/auth/login" className="block text-d-text-sub hover:text-d-text transition-colors">{t("navbar.login")}</Link>
                  <Link href="/auth/register" className="block text-d-text-sub hover:text-d-text transition-colors">{t("navbar.register")}</Link>
                </div>
              </div>
            </div>

            <div className="border-t border-d-border mt-8 pt-6 text-center">
              <p className="text-[11px] text-d-text-muted">
                {t("landing.footerMade")}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
