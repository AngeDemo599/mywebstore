"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Mail, Shield, Sparkles, Calendar, Lock, Store, Upload, Globe, Palette, ArrowRight } from "lucide-react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";
import { useStoreContext } from "@/lib/store-context";
// StoreTheme import removed — managed via SouqStyle Builder

interface UserData {
  id: string;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { activeStore, refreshStores } = useStoreContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Store settings state
  const [storeName, setStoreName] = useState("");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState<string | null>(null);
  const [storeLanguage, setStoreLanguage] = useState("ar");
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // storeTheme removed — managed via SouqStyle Builder now

  // Initialize store form state from activeStore
  useEffect(() => {
    if (activeStore) {
      setStoreName(activeStore.name || "");
      setStoreLanguage(activeStore.language || "ar");
      setStoreLogo(activeStore.logo || null);
      setStoreLogoPreview(activeStore.logo || null);
      // Theme is now managed via SouqStyle Builder at /dashboard/style
    }
  }, [activeStore]);

  // Handle logo file upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStoreError(t("profile.invalidFileType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStoreError(t("profile.fileTooLarge"));
      return;
    }

    // Show local preview immediately
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
        // Auto-save the logo immediately
        if (activeStore) {
          const saveRes = await fetch(`/api/stores/${activeStore.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: storeName || activeStore.name,
              logo: data.url,
            }),
          });
          if (saveRes.ok) {
            await refreshStores();
            setStoreSuccess(t("profile.logoUpdated"));
          } else {
            const errData = await saveRes.json();
            setStoreError(errData.error || "Failed to save logo");
          }
        }
      } else {
        const errData = await res.json();
        setStoreError(errData.error || "Upload failed");
        setStoreLogoPreview(storeLogo);
      }
    } catch {
      setStoreError("Upload failed. Please try again.");
      setStoreLogoPreview(storeLogo);
    } finally {
      setUploading(false);
    }
  };

  // Handle store settings save
  const handleStoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    setStoreSuccess(null);
    setStoreError(null);
    setStoreSaving(true);

    try {
      const res = await fetch(`/api/stores/${activeStore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeName,
          language: storeLanguage,
          logo: storeLogo,
        }),
      });

      if (res.ok) {
        setStoreSuccess(t("profile.storeUpdated"));
        await refreshStores();
      } else {
        const data = await res.json();
        setStoreError(data.error || "An error occurred");
      }
    } catch {
      setStoreError("An error occurred");
    } finally {
      setStoreSaving(false);
    }
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("profile.passwordsMismatch") });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage({
        type: "error",
        text: "Current password is required to change password",
      });
      return;
    }

    const body: Record<string, string> = {};
    if (userData && email !== userData.email) body.email = email;
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    if (Object.keys(body).length === 0) {
      setMessage({ type: "error", text: "No changes to save" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "An error occurred" });
      } else {
        setUserData(data.user);
        setEmail(data.user.email);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage({ type: "success", text: "Profile updated successfully" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-d-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const planExpiresAt = userData.planExpiresAt
    ? new Date(userData.planExpiresAt)
    : null;
  const isPro = userData.plan === "PRO" && (!planExpiresAt || planExpiresAt > new Date());

  return (
    <div>
      <h1 className="text-xl font-semibold text-d-text mb-6">{t("profile.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Edit form */}
        <div className="lg:col-span-2">
          <div className="bg-d-surface rounded-xl shadow-card">
            <div className="px-6 py-4 border-b border-d-border">
              <h2 className="text-base font-semibold text-d-text">
                {t("profile.title")}
              </h2>
              <p className="text-[13px] text-d-text-sub mt-0.5">
                Update your email or change your password
              </p>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {message && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[13px] font-[450] text-d-text mb-1.5">
                  {t("profile.email")}
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-d-text-sub"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-d-border pt-5">
                <h3 className="text-[13px] font-semibold text-d-text mb-4 flex items-center gap-2">
                  <Lock size={16} className="text-d-text-sub" />
                  Change Password
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-[450] text-d-text mb-1.5">
                      {t("profile.currentPassword")}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("profile.leaveBlank")}
                      className="w-full px-3 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-[450] text-d-text mb-1.5">
                      {t("profile.newPassword")}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-[450] text-d-text mb-1.5">
                      {t("profile.confirmNewPassword")}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <StyledButton
                  variant="primary"
                  type="submit"
                  isLoading={saving}
                >
                  {t("profile.save")}
                </StyledButton>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="space-y-6">
          {/* User card */}
          <div className="bg-d-surface rounded-xl shadow-card p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-d-subtle-bg flex items-center justify-center text-d-text text-2xl font-bold mb-3">
                {userData.email.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-d-text">
                {userData.email}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-d-text-sub">
                  <Shield size={14} />
                  {t("profile.role")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    userData.role === "ADMIN"
                      ? "bg-d-subtle-bg text-d-text"
                      : "bg-d-surface-secondary text-d-text"
                  }`}
                >
                  {userData.role}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-d-text-sub">
                  <Sparkles size={14} />
                  {t("profile.plan")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isPro
                      ? "bg-d-subtle-bg text-d-text"
                      : "bg-d-surface-secondary text-d-text"
                  }`}
                >
                  {isPro ? "PRO" : "FREE"}
                </span>
              </div>

              {planExpiresAt && isPro && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-d-text-sub">
                    <Calendar size={14} />
                    {t("profile.expiresAt")}
                  </span>
                  <span className="text-xs text-d-text">
                    {planExpiresAt.toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-d-text-sub">
                  <Calendar size={14} />
                  {t("profile.joinedAt")}
                </span>
                <span className="text-xs text-d-text">
                  {new Date(userData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Settings Section */}
      {activeStore && (
        <div className="mt-6">
          <div className="bg-d-surface rounded-xl shadow-card">
            <div className="px-6 py-4 border-b border-d-border">
              <h2 className="text-base font-semibold text-d-text flex items-center gap-2">
                <Store size={18} />
                {t("profile.storeSettings")}
              </h2>
            </div>

            <form onSubmit={handleStoreSave} className="p-6 space-y-5">
              {storeSuccess && (
                <div className="rounded-lg px-4 py-3 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                  {storeSuccess}
                </div>
              )}
              {storeError && (
                <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  {storeError}
                </div>
              )}

              {/* Store Name */}
              <div>
                <label className="block text-[13px] font-[450] text-d-text mb-1.5">
                  {t("profile.storeName")}
                </label>
                <div className="relative">
                  <Store
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-d-text-sub"
                  />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                    required
                  />
                </div>
              </div>

              {/* Store Language */}
              <div>
                <label className="block text-[13px] font-[450] text-d-text mb-1.5">
                  {t("profile.storeLang")}
                </label>
                <div className="relative">
                  <Globe
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-d-text-sub"
                  />
                  <select
                    value={storeLanguage}
                    onChange={(e) => setStoreLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link appearance-none"
                  >
                    <option value="ar">العربية</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              {/* Store Logo */}
              <div className="border-t border-d-border pt-5">
                <h3 className="text-[13px] font-semibold text-d-text mb-4 flex items-center gap-2">
                  <Upload size={16} className="text-d-text-sub" />
                  {t("profile.storeLogo")}
                </h3>
                <div className="flex items-center gap-4">
                  {storeLogoPreview ? (
                    <img
                      src={storeLogoPreview}
                      alt="Store logo"
                      className="w-16 h-16 rounded-lg object-cover border border-d-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-d-subtle-bg border border-d-border flex items-center justify-center text-d-text-sub">
                      <Store size={24} />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] hover:bg-d-subtle-bg transition-colors disabled:opacity-50"
                    >
                      {uploading ? t("common.uploading") : t("profile.storeLogo")}
                    </button>
                    <p className="text-[11px] text-d-text-sub mt-1">
                      JPEG, PNG, WebP, GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Style Builder Link */}
              <div className="border-t border-d-border pt-5">
                <h3 className="text-[13px] font-semibold text-d-text mb-3 flex items-center gap-2">
                  <Palette size={16} className="text-d-text-sub" />
                  {t("profile.storeTheme")}
                </h3>
                <Link
                  href="/dashboard/style"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-d-border bg-d-surface-secondary hover:bg-d-hover-bg transition-colors group"
                >
                  <div>
                    <p className="text-[13px] font-medium text-d-text">{t("profile.customizeStyle")}</p>
                    <p className="text-[11px] text-d-text-sub">{t("profile.customizeStyleDesc")}</p>
                  </div>
                  <ArrowRight size={16} className="text-d-text-sub group-hover:text-d-text transition-colors" />
                </Link>
              </div>

              <div className="flex justify-end pt-2">
                <StyledButton
                  variant="primary"
                  type="submit"
                  isLoading={storeSaving}
                >
                  {t("profile.save")}
                </StyledButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
