"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Mail, Lock, Store, Upload, Globe, Palette, ArrowRight, ExternalLink, Sheet, ChevronDown, Check, Link2, Copy, User, Plug } from "lucide-react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";
import { useStoreContext } from "@/lib/store-context";
import { useToast } from "@/components/toast";

interface UserData {
  id: string;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
}

type Tab = "account" | "store" | "integrations";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { activeStore, refreshStores } = useStoreContext();
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Store settings state
  const [storeName, setStoreName] = useState("");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState<string | null>(null);
  const [storeLanguage, setStoreLanguage] = useState("ar");
  const [storeMetaPixelId, setStoreMetaPixelId] = useState("");
  const [storeWebhookUrl, setStoreWebhookUrl] = useState("");
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSheetsSetup, setShowSheetsSetup] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [sheetsSaving, setSheetsSaving] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activeStore) {
      setStoreName(activeStore.name || "");
      setStoreLanguage(activeStore.language || "ar");
      setStoreMetaPixelId(activeStore.metaPixelId || "");
      setStoreWebhookUrl(activeStore.sheetsWebhookUrl || "");
      setStoreLogo(activeStore.logo || null);
      setStoreLogoPreview(activeStore.logo || null);
    }
  }, [activeStore]);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setEmail(data.user.email);
      }
    }
    loadProfile();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setStoreError(t("profile.invalidFileType")); return; }
    if (file.size > 5 * 1024 * 1024) { setStoreError(t("profile.fileTooLarge")); return; }

    const localPreview = URL.createObjectURL(file);
    setStoreLogoPreview(localPreview);
    setStoreError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setStoreLogo(data.url);
        setStoreLogoPreview(data.url);
        if (activeStore) {
          const saveRes = await fetch(`/api/stores/${activeStore.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: storeName || activeStore.name, logo: data.url }),
          });
          if (saveRes.ok) { await refreshStores(); setStoreSuccess(t("profile.logoUpdated")); toastSuccess(t("toast.logoUploaded"), undefined, "upload"); }
          else { const errData = await saveRes.json(); setStoreError(errData.error || "Failed to save logo"); toastError(t("toast.logoUploadFailed")); }
        }
      } else {
        const errData = await res.json();
        setStoreError(errData.error || "Upload failed");
        setStoreLogoPreview(storeLogo);
      }
    } catch { setStoreError("Upload failed."); setStoreLogoPreview(storeLogo); }
    finally { setUploading(false); }
  };

  const handleStoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    setStoreSuccess(null); setStoreError(null); setStoreSaving(true);
    try {
      const res = await fetch(`/api/stores/${activeStore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storeName, language: storeLanguage, logo: storeLogo, metaPixelId: storeMetaPixelId || null, sheetsWebhookUrl: storeWebhookUrl || null }),
      });
      if (res.ok) { setStoreSuccess(t("profile.storeUpdated")); await refreshStores(); toastSuccess(t("toast.storeUpdated"), undefined, "profile"); }
      else { const data = await res.json(); setStoreError(data.error || "An error occurred"); toastError(t("toast.storeUpdateFailed")); }
    } catch { setStoreError("An error occurred"); }
    finally { setStoreSaving(false); }
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword && newPassword !== confirmPassword) { setMessage({ type: "error", text: t("profile.passwordsMismatch") }); return; }
    if (newPassword && newPassword.length < 6) { setMessage({ type: "error", text: "New password must be at least 6 characters" }); return; }
    if (newPassword && !currentPassword) { setMessage({ type: "error", text: "Current password is required to change password" }); return; }

    const body: Record<string, string> = {};
    if (userData && email !== userData.email) body.email = email;
    if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
    if (Object.keys(body).length === 0) { setMessage({ type: "error", text: "No changes to save" }); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error || "An error occurred" }); toastError(t("toast.profileUpdateFailed")); }
      else { setUserData(data.user); setEmail(data.user.email); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setMessage({ type: "success", text: "Profile updated successfully" }); toastSuccess(t("toast.profileUpdated"), undefined, "profile"); }
    } catch { setMessage({ type: "error", text: "An error occurred" }); }
    finally { setSaving(false); }
  };

  // Sliding indicator for active tab
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<Tab, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const btn = tabRefs.current.get(activeTab);
    const container = tabsContainerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicator({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-d-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const planExpiresAt = userData.planExpiresAt ? new Date(userData.planExpiresAt) : null;
  const isPro = userData.plan === "PRO" && (!planExpiresAt || planExpiresAt > new Date());

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "account", label: t("profile.tabAccount"), icon: <User size={15} /> },
    { id: "store", label: t("profile.tabStore"), icon: <Store size={15} /> },
    { id: "integrations", label: t("profile.tabIntegrations"), icon: <Plug size={15} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-d-text mb-5">{t("profile.title")}</h1>

      {/* Tabs */}
      <div ref={tabsContainerRef} className="relative flex gap-1 bg-d-subtle-bg rounded-xl p-1 mb-5">
        {/* Sliding background indicator */}
        <div
          className="absolute top-1 bottom-1 bg-d-surface rounded-lg shadow-sm transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el); }}
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? "text-d-text"
                : "text-d-text-sub hover:text-d-text"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ ACCOUNT TAB ═══════ */}
      {activeTab === "account" && (
        <div key="account" className="animate-tab-in">
        <div className="bg-d-surface rounded-xl shadow-card">
          <form onSubmit={handleAccountSave} className="p-5 space-y-5">
            {message && (
              <div className={`rounded-lg px-3 py-2 text-[12px] font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message.text}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-d-text mb-1.5">{t("profile.email")}</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-d-text-sub" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full ps-9 pe-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link" required />
              </div>
            </div>

            {/* Password section */}
            <div className="border-t border-d-border pt-5">
              <p className="text-[12px] font-medium text-d-text mb-3 flex items-center gap-1.5">
                <Lock size={13} className="text-d-text-sub" />
                {t("profile.changePassword")}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-d-text mb-1.5">{t("profile.currentPassword")}</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t("profile.leaveBlank")} className="w-full px-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-d-text mb-1.5">{t("profile.newPassword")}</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full px-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-d-text mb-1.5">{t("profile.confirmNewPassword")}</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat" className="w-full px-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link" />
                  </div>
                </div>
              </div>
            </div>

            {/* Account info */}
            <div className="border-t border-d-border pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-d-text-sub">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span>{userData.role}</span>
                <span className={`font-medium ${isPro ? "text-green-600" : ""}`}>{isPro ? "PRO" : "FREE"}</span>
                {planExpiresAt && isPro && <span>{t("profile.expiresAt")} {planExpiresAt.toLocaleDateString()}</span>}
                <span>{t("profile.joinedAt")} {new Date(userData.createdAt).toLocaleDateString()}</span>
              </div>
              <StyledButton variant="primary" type="submit" isLoading={saving}>{t("profile.save")}</StyledButton>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* ═══════ STORE TAB ═══════ */}
      {activeTab === "store" && activeStore && (
        <div key="store" className="animate-tab-in">
        <div className="bg-d-surface rounded-xl shadow-card">
          <form onSubmit={handleStoreSave} className="p-5 space-y-5">
            {storeSuccess && (
              <div className="rounded-lg px-3 py-2 text-[12px] font-medium bg-green-50 text-green-700 border border-green-200">{storeSuccess}</div>
            )}
            {storeError && (
              <div className="rounded-lg px-3 py-2 text-[12px] font-medium bg-red-50 text-red-700 border border-red-200">{storeError}</div>
            )}

            {/* Logo + Name */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-d-border hover:border-d-link transition-colors flex items-center justify-center overflow-hidden bg-d-subtle-bg disabled:opacity-50"
                >
                  {storeLogoPreview ? (
                    <img src={storeLogoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={22} className="text-d-text-sub" />
                  )}
                </button>
                <p className="text-[9px] text-d-text-sub mt-1 text-center">{uploading ? t("common.uploading") : t("profile.storeLogo")}</p>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-d-text mb-1.5">{t("profile.storeName")}</label>
                  <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full px-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link" required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-d-text mb-1.5">{t("profile.storeLang")}</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-d-text-sub" />
                    <select value={storeLanguage} onChange={(e) => setStoreLanguage(e.target.value)} className="w-full ps-9 pe-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link appearance-none">
                      <option value="ar">العربية</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Style Builder link */}
            <Link href="/dashboard/style" className="flex items-center justify-between px-4 py-3 rounded-lg border border-d-border bg-d-surface-secondary hover:bg-d-hover-bg transition-colors group">
              <div className="flex items-center gap-2.5">
                <Palette size={16} className="text-d-text-sub" />
                <div>
                  <p className="text-[12px] font-medium text-d-text">{t("profile.customizeStyle")}</p>
                  <p className="text-[10px] text-d-text-sub">{t("profile.customizeStyleDesc")}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-d-text-sub group-hover:text-d-text transition-colors" />
            </Link>

            <div className="flex justify-end">
              <StyledButton variant="primary" type="submit" isLoading={storeSaving}>{t("profile.save")}</StyledButton>
            </div>
          </form>
        </div>
        </div>
      )}
      {activeTab === "store" && !activeStore && (
        <div key="store-empty" className="animate-tab-in">
        <div className="bg-d-surface rounded-xl shadow-card p-8 text-center">
          <Store size={32} className="mx-auto text-d-text-sub mb-3" />
          <p className="text-[13px] text-d-text-sub">{t("sidebar.selectStore")}</p>
        </div>
        </div>
      )}

      {/* ═══════ INTEGRATIONS TAB ═══════ */}
      {activeTab === "integrations" && activeStore && (
        <div key="integrations" className="animate-tab-in">
        <div className="space-y-4">

          {/* Meta Pixel — free for everyone */}
          <div className="bg-d-surface rounded-xl shadow-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <svg className="text-blue-600 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <div>
                <h3 className="text-[13px] font-semibold text-d-text">{t("profile.metaPixelId")}</h3>
                <p className="text-[10px] text-d-text-sub">{t("profile.metaPixelHelp")}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={storeMetaPixelId}
                onChange={(e) => setStoreMetaPixelId(e.target.value)}
                placeholder={t("profile.metaPixelPlaceholder")}
                className="flex-1 px-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
              />
              <button
                type="button"
                disabled={storeSaving}
                onClick={async () => {
                  setStoreSaving(true);
                  try {
                    const res = await fetch(`/api/stores/${activeStore.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: storeName || activeStore.name, metaPixelId: storeMetaPixelId || null }),
                    });
                    if (res.ok) await refreshStores();
                  } catch {}
                  finally { setStoreSaving(false); }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {storeSaving ? "..." : t("profile.save")}
              </button>
              {activeStore?.metaPixelId && (
                <a href={`/store/${activeStore.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[12px] hover:bg-d-subtle-bg transition-colors text-d-text whitespace-nowrap">
                  <ExternalLink size={12} />
                  {t("profile.metaPixelTest")}
                </a>
              )}
            </div>
          </div>

          {/* Google Sheets — PRO only */}
          <div className="bg-d-surface rounded-xl shadow-card relative overflow-hidden">
            {!isPro && (
              <div className="absolute inset-0 z-10 bg-d-surface/80 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-d-subtle-bg border border-d-border text-[12px] font-medium text-d-text-sub">
                    <Lock size={13} />
                    {t("profile.sheetsProOnly")}
                  </div>
                  <Link href="/dashboard/upgrade" className="text-[11px] text-d-link hover:underline mt-2 inline-block">
                    {t("orders.upgradeToPro")}
                  </Link>
                </div>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                    <Sheet size={14} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-d-text">{t("profile.sheetsSync")}</h3>
                    <p className="text-[10px] text-d-text-sub">{t("profile.sheetsSyncDesc")}</p>
                  </div>
                </div>
                {activeStore.sheetsWebhookUrl ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10px] font-medium text-green-700">
                    <Check size={10} />
                    {t("profile.sheetsConnected")}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-d-subtle-bg border border-d-border text-[10px] font-medium text-d-text-sub">
                    {t("profile.sheetsNotConnected")}
                  </span>
                )}
              </div>

              {/* URL + Save */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={storeWebhookUrl}
                  onChange={(e) => { setStoreWebhookUrl(e.target.value); setWebhookTestResult(null); }}
                  placeholder={t("profile.sheetsWebhookPlaceholder")}
                  className="flex-1 px-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  disabled={sheetsSaving}
                  onClick={async () => {
                    setSheetsSaving(true); setWebhookTestResult(null);
                    try {
                      const res = await fetch(`/api/stores/${activeStore.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: storeName || activeStore.name, sheetsWebhookUrl: storeWebhookUrl || null }),
                      });
                      if (res.ok) { await refreshStores(); setWebhookTestResult({ type: "success", text: t("profile.sheetsSaved") }); }
                      else { const errData = await res.json(); setWebhookTestResult({ type: "error", text: errData.error || t("profile.sheetsTestError") }); }
                    } catch { setWebhookTestResult({ type: "error", text: t("profile.sheetsTestError") }); }
                    finally { setSheetsSaving(false); }
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-[12px] font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sheetsSaving ? "..." : t("profile.save")}
                </button>
              </div>

              {/* Test + status */}
              <div className="flex items-center justify-between mt-2">
                {webhookTestResult ? (
                  <p className={`text-[11px] font-medium ${webhookTestResult.type === "success" ? "text-green-600" : "text-red-500"}`}>{webhookTestResult.text}</p>
                ) : <span />}
                <button
                  type="button"
                  disabled={webhookTesting || !activeStore.sheetsWebhookUrl}
                  onClick={async () => {
                    setWebhookTesting(true); setWebhookTestResult(null);
                    try {
                      const res = await fetch(`/api/stores/${activeStore.id}/test-webhook`, { method: "POST" });
                      setWebhookTestResult(res.ok ? { type: "success", text: t("profile.sheetsTestSuccess") } : { type: "error", text: t("profile.sheetsTestError") });
                    } catch { setWebhookTestResult({ type: "error", text: t("profile.sheetsTestError") }); }
                    finally { setWebhookTesting(false); }
                  }}
                  className="flex items-center gap-1 text-[11px] text-d-link hover:underline disabled:opacity-40"
                >
                  {webhookTesting ? "..." : t("profile.sheetsTest")}
                  <ExternalLink size={10} />
                </button>
              </div>

              {/* Setup instructions */}
              <div className="mt-4 border-t border-d-border pt-3">
                <button type="button" onClick={() => setShowSheetsSetup(!showSheetsSetup)} className="flex items-center gap-2 w-full text-start">
                  <ChevronDown size={13} className={`text-d-text-sub transition-transform ${showSheetsSetup ? "rotate-180" : ""}`} />
                  <span className="text-[12px] font-medium text-d-text">{t("profile.sheetsSetup")}</span>
                </button>

                {showSheetsSetup && (
                  <div className="mt-3 space-y-2.5">
                    {[t("profile.sheetsSetupStep1"), t("profile.sheetsSetupStep2"), t("profile.sheetsSetupStep3")].map((step, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <p className="text-[11px] text-d-text-sub">{step}</p>
                      </div>
                    ))}
                    <div className="ms-7 relative">
                      <pre className="p-3 rounded-lg bg-d-subtle-bg border border-d-border text-[10px] overflow-x-auto whitespace-pre text-d-text-sub leading-relaxed">{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Order ID","Date","Product",
      "Customer","Phone","Address",
      "Quantity","Variants","Status"]);
  }
  sheet.appendRow([
    data.orderId, data.date, data.productTitle,
    data.customerName, data.phone, data.address,
    data.quantity, data.variants, data.status
  ]);
  return ContentService.createTextOutput("OK");
}`}</pre>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`function doPost(e) {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();\n  var data = JSON.parse(e.postData.contents);\n  if (sheet.getLastRow() === 0) {\n    sheet.appendRow(["Order ID", "Date", "Product", "Customer", "Phone", "Address", "Quantity", "Variants", "Status"]);\n  }\n  sheet.appendRow([data.orderId, data.date, data.productTitle, data.customerName, data.phone, data.address, data.quantity, data.variants, data.status]);\n  return ContentService.createTextOutput("OK");\n}`)}
                        className="absolute top-2 right-2 p-1 rounded bg-d-surface border border-d-border hover:bg-d-hover-bg transition-colors"
                        title={t("common.copyLink")}
                      >
                        <Copy size={11} className="text-d-text-sub" />
                      </button>
                    </div>
                    {[t("profile.sheetsSetupStep4"), t("profile.sheetsSetupStep5")].map((step, i) => (
                      <div key={i + 3} className="flex gap-2.5 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">{i + 4}</span>
                        <p className="text-[11px] text-d-text-sub">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
      {activeTab === "integrations" && !activeStore && (
        <div key="integrations-empty" className="animate-tab-in">
        <div className="bg-d-surface rounded-xl shadow-card p-8 text-center">
          <Plug size={32} className="mx-auto text-d-text-sub mb-3" />
          <p className="text-[13px] text-d-text-sub">{t("sidebar.selectStore")}</p>
        </div>
        </div>
      )}
    </div>
  );
}
