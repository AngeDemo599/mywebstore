"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Palette,
  Sparkles,
  Lock,
  Check,
  Save,
  Type,
  LayoutGrid,
  MousePointer,
  FormInput,
  Paintbrush,
  ShoppingBag,
} from "lucide-react";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { useStoreContext } from "@/lib/store-context";
import { useTranslation } from "@/components/language-provider";
import { useToast } from "@/components/toast";
import { resolveStyle, styleToCSS, getStyleClasses, getFontUrl } from "@/lib/theme";
import {
  StoreStyle,
  PRESET_SOUQFLOW,
  PRESET_CORPORATE,
  PRESET_ECOMMERCE,
  RADIUS_MAP,
  FONT_MAP,
} from "@/types/store";

const TABS = [
  { id: "presets", icon: Sparkles },
  { id: "colors", icon: Paintbrush },
  { id: "buttons", icon: MousePointer },
  { id: "form", icon: FormInput },
  { id: "layout", icon: LayoutGrid },
  { id: "typography", icon: Type },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Locked Screen ──
function LockedScreen({ t }: { t: (k: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-d-surface-secondary border border-d-border flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-d-text-muted" />
      </div>
      <h2 className="text-xl font-bold text-d-text mb-2">{t("style.locked")}</h2>
      <p className="text-d-text-sub text-sm text-center max-w-md mb-6">
        {t("style.lockedDesc")}
      </p>
      <Link
        href="/dashboard/upgrade"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all bg-gradient-to-b from-[#3a3a3a] to-[#262626] border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)] hover:from-[#404040] hover:to-[#2b2b2b]"
      >
        <Sparkles className="w-4 h-4" />
        {t("style.upgradeToPro")}
      </Link>
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg w-full opacity-40 pointer-events-none select-none">
        {[PRESET_SOUQFLOW, PRESET_CORPORATE, PRESET_ECOMMERCE].map((p) => (
          <div key={p.preset} className="bg-d-surface rounded-xl shadow-card p-3">
            <div className="flex gap-1 mb-2">
              {[p.colors.primary, p.colors.secondary, p.colors.accent].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <p className="text-[10px] text-d-text-muted capitalize">{p.preset}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Color Picker Field ──
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-d-text-sub mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-d-input-border cursor-pointer flex-shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 border border-d-input-border rounded-lg bg-d-input-bg text-[11px] min-h-[28px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
        />
      </div>
    </div>
  );
}

// ── Option Card (radio-like) ──
function OptionCard({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3 rounded-xl border-2 text-start transition-all ${
        active
          ? "border-d-text bg-d-surface-tertiary"
          : "border-d-border hover:border-d-text-sub"
      }`}
    >
      {active && (
        <div className="absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-d-text flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-d-surface" />
        </div>
      )}
      {children}
      <p className="text-[11px] font-medium text-d-text mt-1">{label}</p>
    </button>
  );
}

// ── Preset Card ──
function PresetCard({
  preset,
  active,
  onClick,
  name,
  desc,
}: {
  preset: StoreStyle;
  active: boolean;
  onClick: () => void;
  name: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 text-start transition-all w-full ${
        active
          ? "border-d-text bg-d-surface-tertiary shadow-sm"
          : "border-d-border hover:border-d-text-sub"
      }`}
    >
      {active && (
        <div className="absolute top-2.5 end-2.5 w-5 h-5 rounded-full bg-d-text flex items-center justify-center">
          <Check className="w-3 h-3 text-d-surface" />
        </div>
      )}
      <div className="flex gap-1.5 mb-3">
        {[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.background, preset.colors.surface].map(
          (c, i) => (
            <div key={i} className="w-6 h-6 rounded-full border border-gray-200" style={{ background: c }} />
          )
        )}
      </div>
      <p className="text-sm font-semibold text-d-text">{name}</p>
      <p className="text-[11px] text-d-text-sub mt-0.5">{desc}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-d-surface-secondary text-d-text-sub">
          {preset.buttons.style}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-d-surface-secondary text-d-text-sub">
          {preset.layout.cardStyle}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-d-surface-secondary text-d-text-sub">
          {preset.typography.font}
        </span>
      </div>
    </button>
  );
}

// ── Phone Preview ──
function StylePreview({ style }: { style: StoreStyle }) {
  const classes = getStyleClasses(style);
  const fontUrl = getFontUrl(style.typography.font);
  const fontFamily = FONT_MAP[style.typography.font] || FONT_MAP.system;

  return (
    <div className="relative mx-auto" style={{ width: 280 }}>
      {/* Phone frame */}
      <div className="rounded-[36px] border-[6px] border-[#1a1a1a] bg-[#1a1a1a] shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center py-1.5 bg-[#1a1a1a]">
          <div className="w-20 h-5 rounded-full bg-[#0a0a0a]" />
        </div>
        {/* Screen */}
        <div
          className="overflow-y-auto"
          style={{
            height: 520,
            background: style.colors.background,
            color: style.colors.text,
            fontFamily,
          }}
        >
          {fontUrl && (
            // eslint-disable-next-line @next/next/no-css-tags
            <link rel="stylesheet" href={fontUrl} />
          )}
          {/* Cover — adapts to headerStyle */}
          {style.layout.headerStyle === "minimal" ? (
            <div className="px-3 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${style.colors.border}` }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold" style={{ background: style.colors.primary }}>S</div>
                <span className="text-xs font-bold" style={{ color: style.colors.text }}>My Store</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: style.colors.primary, background: `${style.colors.primary}15` }}>3 products</span>
            </div>
          ) : style.layout.headerStyle === "centered" ? (
            <div className="relative overflow-hidden" style={{
              background:
                style.layout.coverStyle === "solid" ? style.colors.primary
                : `linear-gradient(135deg, ${style.colors.primary}dd, ${style.colors.secondary}aa)`,
              minHeight: "100px",
            }}>
              <div className="flex flex-col items-center justify-center py-5 relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold mb-1.5" style={{ background: "rgba(255,255,255,0.2)" }}>S</div>
                <span className="text-white text-sm font-bold drop-shadow">My Store</span>
                <span className="text-white/60 text-[9px] mt-1 px-2 py-0.5 rounded-full bg-white/10">3 products</span>
              </div>
            </div>
          ) : style.layout.headerStyle === "hero" ? (
            <div className="relative overflow-hidden" style={{
              background:
                style.layout.coverStyle === "solid" ? style.colors.primary
                : `linear-gradient(135deg, ${style.colors.primary}dd, ${style.colors.secondary}aa)`,
              minHeight: "120px",
            }}>
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,1) 8px, rgba(255,255,255,1) 9px)`,
              }} />
              <div className="flex flex-col items-center justify-center py-6 relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold mb-2" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>S</div>
                <span className="text-white text-base font-extrabold drop-shadow tracking-tight">My Store</span>
                <span className="text-white/70 text-[9px] mt-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-400" /> 3 products
                </span>
              </div>
            </div>
          ) : (
            <div
              className="h-28 relative"
              style={{
                background:
                  style.layout.coverStyle === "solid" ? style.colors.primary
                  : style.layout.coverStyle === "wave" ? `linear-gradient(160deg, ${style.colors.primary} 40%, ${style.colors.secondary} 100%)`
                  : `linear-gradient(135deg, ${style.colors.primary}dd 0%, ${style.colors.secondary}aa 50%, ${style.colors.primary}66 100%)`,
              }}
            >
              {style.layout.headerStyle === "banner" && (
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }} />
              )}
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
                  >
                    S
                  </div>
                  <span className="text-white text-sm font-semibold drop-shadow">My Store</span>
                </div>
              </div>
            </div>
          )}

          {/* Product image placeholder */}
          <div
            className="mx-3 mt-3 overflow-hidden"
            style={{
              ...classes.cardStyle,
              aspectRatio: style.layout.imageAspect === "square" ? "1/1" : style.layout.imageAspect === "portrait" ? "3/4" : "16/9",
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${style.colors.primary}20, ${style.colors.secondary}15)` }}
            >
              <span className="text-3xl font-bold" style={{ color: style.colors.primary, opacity: 0.3 }}>
                P
              </span>
            </div>
          </div>

          {/* Title & price */}
          <div className="px-4 mt-3">
            <h3 className="text-base" style={{ ...classes.headingStyle, color: style.colors.text }}>
              Product Title
            </h3>
            <p className="text-lg font-bold mt-0.5" style={{ color: style.colors.primary }}>
              2,500 DA
            </p>
            <p className="text-[11px] mt-1" style={{ color: style.colors.textMuted }}>
              A short product description goes here with some details.
            </p>
          </div>

          {/* Mini form */}
          <div className="px-4 mt-3 space-y-2">
            <input
              readOnly
              placeholder="Full Name"
              className="w-full px-3 py-1.5 text-[11px]"
              style={{
                ...classes.inputStyle,
                color: style.colors.text,
                fontSize: "11px",
              }}
            />
            <input
              readOnly
              placeholder="0555 123 456"
              className="w-full px-3 py-1.5 text-[11px]"
              style={{
                ...classes.inputStyle,
                color: style.colors.text,
                fontSize: "11px",
              }}
            />
          </div>

          {/* Summary */}
          <div className="px-4 mt-3">
            <div className="p-3 space-y-1" style={classes.summaryCardStyle}>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: style.colors.textMuted }}>Subtotal</span>
                <span style={{ color: style.colors.text }}>2,500 DA</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: style.colors.textMuted }}>Shipping</span>
                <span style={{ color: style.colors.text }}>Free</span>
              </div>
              <div
                className="flex justify-between text-[11px] font-bold pt-1 mt-1"
                style={{ borderTop: `1px solid ${style.colors.border}` }}
              >
                <span>Total</span>
                <span style={{ color: style.colors.primary }}>2,500 DA</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="px-4 mt-3 pb-4">
            <button
              type="button"
              className="w-full py-2.5 text-[12px] flex items-center justify-center gap-1.5 transition-all"
              style={classes.buttonStyle}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {style.buttons.uppercase ? "ORDER NOW" : "Order Now"} - 2,500 DA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function SouqStylePage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePlan } = useEffectivePlan();
  const { activeStore, refreshStores } = useStoreContext();

  const { success: toastSuccess, error: toastError } = useToast();

  const [style, setStyle] = useState<StoreStyle>(PRESET_SOUQFLOW);
  const [activeTab, setActiveTab] = useState<TabId>("presets");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current style from store
  useEffect(() => {
    if (activeStore?.theme) {
      setStyle(resolveStyle(activeStore.theme));
    }
  }, [activeStore]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/auth/login");
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  if (effectivePlan !== "PRO") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-d-text">{t("style.title")}</h1>
        </div>
        <LockedScreen t={t} />
      </div>
    );
  }

  const updateColors = (key: string, value: string) => {
    setStyle((s) => ({
      ...s,
      preset: "custom" as const,
      colors: { ...s.colors, [key]: value },
    }));
    setSaved(false);
  };

  const updateButtons = (key: string, value: unknown) => {
    setStyle((s) => ({
      ...s,
      preset: "custom" as const,
      buttons: { ...s.buttons, [key]: value } as StoreStyle["buttons"],
    }));
    setSaved(false);
  };

  const updateForm = (key: string, value: string) => {
    setStyle((s) => ({
      ...s,
      preset: "custom" as const,
      form: { ...s.form, [key]: value } as StoreStyle["form"],
    }));
    setSaved(false);
  };

  const updateLayout = (key: string, value: unknown) => {
    setStyle((s) => ({
      ...s,
      preset: "custom" as const,
      layout: { ...s.layout, [key]: value } as StoreStyle["layout"],
    }));
    setSaved(false);
  };

  const updateTypography = (key: string, value: string) => {
    setStyle((s) => ({
      ...s,
      preset: "custom" as const,
      typography: { ...s.typography, [key]: value } as StoreStyle["typography"],
    }));
    setSaved(false);
  };

  const applyPreset = (preset: StoreStyle) => {
    setStyle({ ...preset });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!activeStore) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/stores/${activeStore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeStore.name,
          theme: style,
        }),
      });
      if (res.ok) {
        setSaved(true);
        await refreshStores();
        toastSuccess(t("toast.styleSaved"), undefined, "style");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toastError(t("toast.styleSaveFailed"));
      }
    } catch {
      toastError(t("toast.styleSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-d-text">{t("style.title")}</h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#303030] text-white text-[11px] font-bold">
            <Sparkles size={11} className="text-lime-400" />
            PRO
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? "bg-green-600 text-white"
              : "bg-gradient-to-b from-[#3a3a3a] to-[#262626] text-white border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)] hover:from-[#404040] hover:to-[#2b2b2b]"
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("common.saving")}
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              {t("style.saved")}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t("style.save")}
            </>
          )}
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,340px] gap-6">
        {/* Left Panel */}
        <div className="min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-d-surface rounded-xl p-1 border border-d-border overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-d-surface-tertiary text-d-text shadow-sm"
                      : "text-d-text-sub hover:text-d-text hover:bg-d-hover-bg"
                  }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span>{t(`style.tab.${tab.id}`)}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-d-surface rounded-xl border border-d-border p-5">
            {/* Presets Tab */}
            {activeTab === "presets" && (
              <div className="space-y-3">
                <p className="text-[13px] text-d-text-sub mb-4">{t("style.presetsDesc")}</p>
                <PresetCard
                  preset={PRESET_SOUQFLOW}
                  active={style.preset === "souqflow"}
                  onClick={() => applyPreset(PRESET_SOUQFLOW)}
                  name={t("style.preset.souqflow")}
                  desc={t("style.preset.souqflowDesc")}
                />
                <PresetCard
                  preset={PRESET_CORPORATE}
                  active={style.preset === "corporate"}
                  onClick={() => applyPreset(PRESET_CORPORATE)}
                  name={t("style.preset.corporate")}
                  desc={t("style.preset.corporateDesc")}
                />
                <PresetCard
                  preset={PRESET_ECOMMERCE}
                  active={style.preset === "ecommerce"}
                  onClick={() => applyPreset(PRESET_ECOMMERCE)}
                  name={t("style.preset.ecommerce")}
                  desc={t("style.preset.ecommerceDesc")}
                />
                {style.preset === "custom" && (
                  <div className="p-3 rounded-xl border-2 border-dashed border-d-border text-center">
                    <Palette className="w-5 h-5 text-d-text-sub mx-auto mb-1" />
                    <p className="text-[12px] font-medium text-d-text">{t("style.preset.custom")}</p>
                    <p className="text-[10px] text-d-text-sub">{t("style.preset.customDesc")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === "colors" && (
              <div>
                <p className="text-[13px] text-d-text-sub mb-4">{t("style.colorsDesc")}</p>
                <div className="grid grid-cols-2 gap-4">
                  <ColorField label={t("style.color.primary")} value={style.colors.primary} onChange={(v) => updateColors("primary", v)} />
                  <ColorField label={t("style.color.secondary")} value={style.colors.secondary} onChange={(v) => updateColors("secondary", v)} />
                  <ColorField label={t("style.color.background")} value={style.colors.background} onChange={(v) => updateColors("background", v)} />
                  <ColorField label={t("style.color.text")} value={style.colors.text} onChange={(v) => updateColors("text", v)} />
                  <ColorField label={t("style.color.textMuted")} value={style.colors.textMuted} onChange={(v) => updateColors("textMuted", v)} />
                  <ColorField label={t("style.color.surface")} value={style.colors.surface} onChange={(v) => updateColors("surface", v)} />
                  <ColorField label={t("style.color.border")} value={style.colors.border} onChange={(v) => updateColors("border", v)} />
                  <ColorField label={t("style.color.accent")} value={style.colors.accent} onChange={(v) => updateColors("accent", v)} />
                </div>
              </div>
            )}

            {/* Buttons Tab */}
            {activeTab === "buttons" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.btn.style")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["filled", "gradient", "outline", "pill"] as const).map((s) => (
                      <OptionCard key={s} label={t(`style.btn.${s}`)} active={style.buttons.style === s} onClick={() => updateButtons("style", s)}>
                        <div className="h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold" style={
                          s === "gradient" ? { background: `linear-gradient(135deg, ${style.colors.primary}, ${style.colors.accent})`, color: "#fff" }
                          : s === "outline" ? { border: `2px solid ${style.colors.primary}`, color: style.colors.primary }
                          : s === "pill" ? { background: style.colors.primary, color: "#fff", borderRadius: "9999px" }
                          : { background: style.colors.primary, color: "#fff" }
                        }>
                          Button
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.btn.radius")}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {(["none", "sm", "md", "lg", "full"] as const).map((r) => (
                      <OptionCard key={r} label={r} active={style.buttons.radius === r} onClick={() => updateButtons("radius", r)}>
                        <div className="h-6 bg-d-surface-secondary" style={{ borderRadius: RADIUS_MAP[r] }} />
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.btn.shadow")}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(["none", "sm", "md", "lg"] as const).map((s) => (
                      <OptionCard key={s} label={s} active={style.buttons.shadow === s} onClick={() => updateButtons("shadow", s)}>
                        <div className="h-6 rounded bg-d-surface-secondary" />
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-d-text">{t("style.btn.uppercase")}</span>
                  <button
                    type="button"
                    onClick={() => updateButtons("uppercase", !style.buttons.uppercase)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      style.buttons.uppercase ? "bg-d-text" : "bg-d-surface-secondary border border-d-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        style.buttons.uppercase ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Form Tab */}
            {activeTab === "form" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.form.inputStyle")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["default", "underline", "filled"] as const).map((s) => (
                      <OptionCard key={s} label={t(`style.form.${s}`)} active={style.form.inputStyle === s} onClick={() => updateForm("inputStyle", s)}>
                        <div
                          className="h-7 px-2 flex items-center text-[10px]"
                          style={
                            s === "underline" ? { borderBottom: `2px solid ${style.colors.border}` }
                            : s === "filled" ? { background: style.colors.surface, borderRadius: "4px" }
                            : { border: `1px solid ${style.colors.border}`, borderRadius: "4px" }
                          }
                        >
                          <span className="text-d-text-sub">Text...</span>
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.form.inputRadius")}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(["none", "sm", "md", "lg"] as const).map((r) => (
                      <OptionCard key={r} label={r} active={style.form.inputRadius === r} onClick={() => updateForm("inputRadius", r)}>
                        <div className="h-6 border border-d-border" style={{ borderRadius: RADIUS_MAP[r] }} />
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.form.summaryStyle")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["card", "minimal", "bordered"] as const).map((s) => (
                      <OptionCard key={s} label={t(`style.form.summary.${s}`)} active={style.form.summaryStyle === s} onClick={() => updateForm("summaryStyle", s)}>
                        <div
                          className="h-8 rounded-lg p-1"
                          style={
                            s === "bordered" ? { border: `1px solid ${style.colors.border}` }
                            : s === "minimal" ? {}
                            : { background: style.colors.surface, border: `1px solid ${style.colors.border}` }
                          }
                        >
                          <div className="flex justify-between text-[8px] text-d-text-sub">
                            <span>Total</span>
                            <span>2,500</span>
                          </div>
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Layout Tab */}
            {activeTab === "layout" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.layout.cardStyle")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["flat", "shadow", "bordered", "glass"] as const).map((s) => (
                      <OptionCard key={s} label={t(`style.layout.card.${s}`)} active={style.layout.cardStyle === s} onClick={() => updateLayout("cardStyle", s)}>
                        <div
                          className="h-10 rounded-lg"
                          style={
                            s === "shadow" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
                            : s === "bordered" ? { border: `1px solid ${style.colors.border}` }
                            : s === "glass" ? { background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }
                            : { background: style.colors.surface }
                          }
                        />
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.layout.imageAspect")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["square", "video", "portrait"] as const).map((a) => (
                      <OptionCard key={a} label={t(`style.layout.aspect.${a}`)} active={style.layout.imageAspect === a} onClick={() => updateLayout("imageAspect", a)}>
                        <div
                          className="bg-d-surface-secondary rounded"
                          style={{
                            aspectRatio: a === "square" ? "1/1" : a === "portrait" ? "3/4" : "16/9",
                            maxHeight: "40px",
                            width: "100%",
                          }}
                        />
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.layout.coverStyle")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["gradient", "blur", "solid", "wave"] as const).map((c) => (
                      <OptionCard key={c} label={t(`style.layout.cover.${c}`)} active={style.layout.coverStyle === c} onClick={() => updateLayout("coverStyle", c)}>
                        <div
                          className="h-8 rounded"
                          style={{
                            background:
                              c === "solid" ? style.colors.primary
                              : c === "wave" ? `linear-gradient(160deg, ${style.colors.primary} 40%, ${style.colors.secondary} 100%)`
                              : `linear-gradient(135deg, ${style.colors.primary}dd, ${style.colors.secondary}aa)`,
                          }}
                        />
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.layout.headerStyle")}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(["classic", "centered", "banner", "minimal", "hero"] as const).map((h) => (
                      <OptionCard key={h} label={t(`style.layout.header.${h}`)} active={style.layout.headerStyle === h} onClick={() => updateLayout("headerStyle", h)}>
                        <div className="h-14 rounded-lg overflow-hidden relative" style={{ background: style.colors.surface }}>
                          {/* Mini header preview */}
                          <div
                            className="absolute inset-x-0 top-0"
                            style={{
                              height: h === "minimal" ? "20%" : h === "hero" ? "100%" : h === "banner" ? "70%" : "55%",
                              background:
                                style.layout.coverStyle === "solid" ? style.colors.primary
                                : `linear-gradient(135deg, ${style.colors.primary}dd, ${style.colors.secondary}aa)`,
                            }}
                          />
                          <div className="relative z-10 h-full flex items-center px-2" style={{
                            justifyContent: h === "centered" ? "center" : "flex-start",
                            paddingTop: h === "minimal" ? "2px" : h === "banner" ? "4px" : "12px",
                          }}>
                            {h === "centered" ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-4 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
                                <div className="w-10 h-1 rounded" style={{ background: "rgba(255,255,255,0.7)" }} />
                              </div>
                            ) : h === "minimal" ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded" style={{ background: style.colors.primary }} />
                                <div className="w-8 h-1 rounded" style={{ background: style.colors.text }} />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded" style={{ background: "rgba(255,255,255,0.3)" }} />
                                <div className="w-10 h-1 rounded" style={{ background: "rgba(255,255,255,0.7)" }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.layout.productGrid")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([2, 3] as const).map((n) => (
                      <OptionCard key={n} label={`${n} ${t("style.layout.columns")}`} active={style.layout.productGrid === n} onClick={() => updateLayout("productGrid", n)}>
                        <div className="flex gap-1 h-6">
                          {Array.from({ length: n }).map((_, i) => (
                            <div key={i} className="flex-1 bg-d-surface-secondary rounded" />
                          ))}
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeTab === "typography" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.typo.font")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["system", "cairo", "inter", "tajawal"] as const).map((f) => (
                      <OptionCard key={f} label={t(`style.typo.font.${f}`)} active={style.typography.font === f} onClick={() => updateTypography("font", f)}>
                        <p className="text-[12px] font-semibold" style={{ fontFamily: FONT_MAP[f] }}>Aa Bb 123</p>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.typo.headingWeight")}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(["600", "700", "800", "900"] as const).map((w) => (
                      <OptionCard key={w} label={w} active={style.typography.headingWeight === w} onClick={() => updateTypography("headingWeight", w)}>
                        <p className="text-[14px]" style={{ fontWeight: Number(w) }}>Aa</p>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-d-text mb-2">{t("style.typo.bodySize")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sm", "base", "lg"] as const).map((s) => (
                      <OptionCard key={s} label={t(`style.typo.size.${s}`)} active={style.typography.bodySize === s} onClick={() => updateTypography("bodySize", s)}>
                        <p style={{ fontSize: s === "sm" ? "11px" : s === "lg" ? "14px" : "12px" }}>Sample text</p>
                      </OptionCard>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Phone Preview */}
        <div className="hidden xl:block">
          <div className="sticky top-0 pt-2">
            <StylePreview style={style} />
          </div>
        </div>
      </div>

      {/* Mobile preview toggle */}
      <div className="xl:hidden mt-6">
        <details className="bg-d-surface rounded-xl border border-d-border">
          <summary className="px-5 py-3 text-sm font-medium text-d-text cursor-pointer">{t("style.showPreview")}</summary>
          <div className="px-5 pb-5 flex justify-center">
            <StylePreview style={style} />
          </div>
        </details>
      </div>
    </div>
  );
}
