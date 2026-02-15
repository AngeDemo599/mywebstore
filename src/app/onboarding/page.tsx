"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { StoreTheme, DEFAULT_THEME } from "@/types/store";
import { useStoreContext } from "@/lib/store-context";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeStore, loading: storeLoading, refreshStores } = useStoreContext();
  const { t } = useTranslation();

  const STEPS = [t("stores.new.stepName"), t("stores.new.stepLogo"), t("stores.new.stepTheme")];

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState<StoreTheme>({ ...DEFAULT_THEME });
  const [language, setLanguage] = useState("ar");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Redirect to dashboard if user already has a store
  useEffect(() => {
    if (!storeLoading && activeStore) {
      router.replace("/dashboard");
    }
  }, [storeLoading, activeStore, router]);

  if (status === "loading" || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
        <div className="w-6 h-6 border-2 border-[#303030] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  if (activeStore) return null;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("stores.new.errorImageOnly"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("stores.new.errorFileSize"));
      return;
    }

    setError("");
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setUploading(false);

      if (!res.ok) {
        setError(data.error || t("stores.new.errorUpload"));
        setLogoPreview(null);
      } else {
        setLogo(data.url);
      }
    } catch {
      setUploading(false);
      setError(t("stores.new.errorUploadRetry"));
      setLogoPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    setError("");
    setSaving(true);

    const isDefaultTheme =
      theme.primaryColor === DEFAULT_THEME.primaryColor &&
      theme.secondaryColor === DEFAULT_THEME.secondaryColor &&
      theme.backgroundColor === DEFAULT_THEME.backgroundColor &&
      theme.textColor === DEFAULT_THEME.textColor;

    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        ...(logo ? { logo } : {}),
        ...(!isDefaultTheme ? { theme } : {}),
        language,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      await refreshStores();
      localStorage.setItem("_mws_show_welcome", "1");
      router.push("/dashboard");
    }
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else handleSubmit();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const skip = () => {
    if (step < 2) setStep(step + 1);
    else handleSubmit();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/Logo SouqMaker.svg" alt="SouqMaker" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#303030]">{t("onboarding.title")}</h1>
          <p className="text-sm text-[#616161] mt-1">{t("onboarding.subtitle")}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-medium ${
                  i <= step ? "text-[#303030]" : "text-[#8a8a8a]"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="w-full bg-[#e3e3e3] rounded-full h-2">
            <div
              className="bg-[#303030] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-[#e3e3e3] p-6">
          {/* Step 1: Store Name + Language */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-[13px] font-[450] text-[#303030] mb-1">
                  {t("stores.new.storeName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#d1d1d1] rounded-lg bg-white text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#303030] focus:border-[#303030] text-[#303030]"
                  placeholder={t("stores.new.namePlaceholder")}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-[13px] font-[450] text-[#303030] mb-1">
                  {t("stores.new.storeLang")}
                </label>
                <p className="text-xs text-[#616161] mb-2">{t("stores.new.storeLangDesc")}</p>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#d1d1d1] rounded-lg bg-white text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#303030] focus:border-[#303030] text-[#303030]"
                >
                  <option value="ar">عربي (Arabic)</option>
                  <option value="fr">Français (French)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Logo Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-[13px] font-[450] text-[#303030] mb-1">
                {t("stores.new.storeLogo")} <span className="text-[#8a8a8a]">({t("common.optional")})</span>
              </label>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-[#303030] bg-[#f0f0f0]"
                    : "border-[#d1d1d1] hover:border-[#303030]"
                }`}
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-contain rounded-lg"
                    />
                    {uploading ? (
                      <p className="text-sm text-[#303030]">{t("stores.new.uploading")}</p>
                    ) : (
                      <p className="text-sm text-[#616161]">{t("stores.new.clickOrDragReplace")}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl text-[#8a8a8a] mb-2">&#128247;</div>
                    <p className="text-sm text-[#616161]">
                      {t("stores.new.dragDrop")}
                    </p>
                    <p className="text-xs text-[#8a8a8a] mt-1">
                      {t("stores.new.fileTypes")}
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {logo && (
                <button
                  type="button"
                  onClick={() => { setLogo(null); setLogoPreview(null); }}
                  className="text-sm text-red-600 hover:underline"
                >
                  {t("stores.new.removeLogo")}
                </button>
              )}
            </div>
          )}

          {/* Step 3: Theme Colors */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-[13px] font-[450] text-[#303030]">
                {t("stores.new.themeColors")} <span className="text-[#8a8a8a]">({t("common.optional")})</span>
              </p>

              <div className="grid grid-cols-2 gap-4">
                {([
                  { key: "primaryColor" as const, label: t("stores.new.primaryColor") },
                  { key: "secondaryColor" as const, label: t("stores.new.secondaryColor") },
                  { key: "backgroundColor" as const, label: t("stores.new.backgroundColor") },
                  { key: "textColor" as const, label: t("stores.new.textColor") },
                ]).map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[13px] text-[#303030] mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme[key]}
                        onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                        className="w-10 h-10 rounded border border-[#d1d1d1] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme[key]}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                            setTheme({ ...theme, [key]: val });
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-[#d1d1d1] rounded-lg text-sm font-mono text-[#303030]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live preview */}
              <div>
                <p className="text-sm text-[#616161] mb-2">{t("stores.new.preview")}</p>
                <div
                  className="rounded-lg border p-4"
                  style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain rounded" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        {name.charAt(0).toUpperCase() || "S"}
                      </div>
                    )}
                    <span className="font-semibold">{name || t("stores.new.storeName")}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      {t("stores.new.primaryButton")}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: theme.secondaryColor }}
                    >
                      {t("stores.new.secondaryButton")}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTheme({ ...DEFAULT_THEME })}
                className="text-sm text-[#616161] hover:underline"
              >
                {t("stores.new.resetDefaults")}
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t border-[#e3e3e3]">
            <div>
              {step > 0 && (
                <StyledButton variant="secondary" type="button" onClick={back}>
                  {t("common.back")}
                </StyledButton>
              )}
            </div>
            <div className="flex gap-2">
              {step > 0 && step < 2 && (
                <StyledButton variant="ghost" type="button" onClick={skip}>
                  {t("common.skip")}
                </StyledButton>
              )}
              <StyledButton
                variant="primary"
                type="button"
                onClick={next}
                disabled={!canNext() || saving || uploading}
                isLoading={saving}
              >
                {saving
                  ? t("stores.new.creating")
                  : step === 2
                  ? t("onboarding.finish")
                  : t("common.next")}
              </StyledButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
