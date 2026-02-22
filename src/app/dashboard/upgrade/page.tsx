"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { formatPrice } from "@/lib/utils";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";
import { useToast } from "@/components/toast";

interface UpgradeRequest {
  id: string;
  paymentProof: string;
  duration: "MONTHLY" | "YEARLY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const FREE_FEATURE_KEYS = [
  "upgrade.free.5products",
  "upgrade.free.unlimitedOrders",
  "upgrade.free.blurred",
  "upgrade.free.basicTemplate",
  "upgrade.free.standardPrice",
];

const PRO_FEATURE_KEYS = [
  "upgrade.pro.100products",
  "upgrade.pro.unlimitedOrders",
  "upgrade.pro.fullDetails",
  "upgrade.pro.statusManagement",
  "upgrade.pro.bonusTokens",
  "upgrade.pro.discount",
  "upgrade.pro.templates",
  "upgrade.pro.analytics",
  "upgrade.pro.adFree",
  "upgrade.pro.support",
];

export default function UpgradePage() {
  const { t } = useTranslation();
  const { effectivePlan, plan, planExpiresAt, remainingDays, isExpired, status } = useEffectivePlan();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [PRICES, setPRICES] = useState<Record<string, number>>({ MONTHLY: 5000, YEARLY: 50000 });
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [duration, setDuration] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  const pendingRequest = requests.find((r) => r.status === "PENDING");
  const isRenewal = plan === "PRO";

  useEffect(() => {
    if (status === "loading") return;

    Promise.all([
      fetch("/api/upgrade").then((res) => res.json()),
      fetch("/api/config").then((res) => res.ok ? res.json() : null),
    ])
      .then(([reqData, cfgData]) => {
        setRequests(Array.isArray(reqData) ? reqData : []);
        if (cfgData?.subscriptionPrices) {
          setPRICES({
            MONTHLY: cfgData.subscriptionPrices.monthly,
            YEARLY: cfgData.subscriptionPrices.yearly,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  const uploadProof = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError(t("tokens.uploadImage")); return; }
    if (file.size > 5 * 1024 * 1024) { setError(t("tokens.fileTooLarge")); return; }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setProofUrl(data.url);
      }
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!proofUrl) { setError(t("upgrade.uploadPlease")); return; }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentProof: proofUrl, duration }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      toastError(t("toast.upgradeSubmitFailed"));
    } else {
      setSuccess(true);
      setRequests((prev) => [data, ...prev]);
      setProofUrl("");
      toastSuccess(t("toast.upgradeSubmitted"), t("toast.upgradeSubmittedDesc"), "upgrade");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div>
        <p className="text-d-text-sub">{t("common.loading")}</p>
      </div>
    );
  }

  // Active PRO subscription status section
  const subscriptionStatus = effectivePlan === "PRO" && planExpiresAt && (
    <div className={`rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 ${
      remainingDays <= 7
        ? "bg-red-50 border border-red-200"
        : remainingDays <= 14
          ? "bg-amber-50 border border-amber-200"
          : "bg-green-50 border border-green-200"
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className={`text-base sm:text-lg font-semibold ${
            remainingDays <= 7 ? "text-red-800" : remainingDays <= 14 ? "text-amber-800" : "text-green-800"
          }`}>
            {remainingDays <= 7 ? t("upgrade.subscriptionExpiring") : remainingDays <= 14 ? t("upgrade.subscriptionExpiringSoon") : t("upgrade.proActive")}
          </h2>
          <p className={`text-xs sm:text-sm ${
            remainingDays <= 7 ? "text-red-600" : remainingDays <= 14 ? "text-amber-600" : "text-green-600"
          }`}>
            {t("upgrade.expiresOn")} {planExpiresAt.toLocaleDateString()} ({remainingDays} {t("upgrade.remaining")})
          </p>
        </div>
        {remainingDays <= 14 && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
            remainingDays <= 7 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
          }`}>
            {t("common.renewNow")}
          </span>
        )}
      </div>
    </div>
  );

  // Expired subscription notice
  const expiredNotice = isExpired && (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-lg font-semibold text-red-800 mb-1">{t("upgrade.subscriptionExpired")}</h2>
      <p className="text-sm text-red-600">
        {t("upgrade.expiredOn")} {planExpiresAt?.toLocaleDateString()}{t("upgrade.expiredRenew")}
      </p>
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-semibold text-d-text mb-6">
        {isRenewal ? t("upgrade.renewTitle") : t("upgrade.title")}
      </h1>

      {subscriptionStatus}
      {expiredNotice}

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* FREE Plan */}
        <div className="bg-d-surface rounded-xl shadow-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-d-text">{t("upgrade.free")}</h2>
            {effectivePlan === "FREE" && !isRenewal && (
              <span className="bg-d-subtle-bg text-d-text px-2.5 py-0.5 rounded-full text-xs font-medium">
                {t("common.currentPlan")}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-d-text mb-1">0 {t("common.da")}</p>
          <p className="text-sm text-d-text-sub mb-6">{t("common.foreverFree")}</p>
          <ul className="space-y-3">
            {FREE_FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm text-d-text-sub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {/* PRO Plan */}
        <div className="bg-d-surface rounded-xl shadow-card border-2 border-d-text p-4 sm:p-6 relative">
          <div className="absolute -top-3 left-6 bg-[#303030] text-white px-3 py-0.5 rounded-full text-xs font-medium">
            {isRenewal ? t("common.currentPlan") : t("common.recommended")}
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-d-text">{t("upgrade.pro")}</h2>
          </div>

          {/* Duration Toggle */}
          <div className="flex bg-d-surface-secondary rounded-lg p-1 mb-4">
            <button
              onClick={() => setDuration("MONTHLY")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                duration === "MONTHLY" ? "bg-d-surface text-d-text shadow-sm" : "text-d-text-sub"
              }`}
            >
              {t("upgrade.monthly")}
            </button>
            <button
              onClick={() => setDuration("YEARLY")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                duration === "YEARLY" ? "bg-d-surface text-d-text shadow-sm" : "text-d-text-sub"
              }`}
            >
              {t("upgrade.yearly")}
              <span className="ms-1 text-xs text-green-600 font-medium">{t("upgrade.savePercent")}</span>
            </button>
          </div>

          <p className="text-3xl font-bold text-d-text mb-1">{formatPrice(PRICES[duration])}</p>
          <p className="text-sm text-d-text-sub mb-6">
            {duration === "MONTHLY" ? t("upgrade.perMonthLabel") : t("upgrade.perYearLabel")}
          </p>
          <ul className="space-y-3">
            {PRO_FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm text-d-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-d-text">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pending Request Notice */}
      {pendingRequest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">
                {isRenewal ? t("upgrade.pendingRenewal") : t("upgrade.pendingUpgrade")}
              </h3>
              <p className="text-sm text-yellow-700">
                {t("upgrade.pendingDesc")}
              </p>
              <div className="mt-3">
                <img
                  src={pendingRequest.paymentProof}
                  alt="Payment proof"
                  className="w-32 h-32 object-cover rounded-lg border border-yellow-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Request Notice */}
      {requests.some((r) => r.status === "REJECTED") && !pendingRequest && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-red-800 mb-1">{t("upgrade.previousRejected")}</h3>
          <p className="text-sm text-red-700">
            {requests.find((r) => r.status === "REJECTED")?.rejectionReason || t("upgrade.rejectedDefault")}
          </p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-green-800 mb-1">{t("upgrade.requestSubmitted")}</h3>
          <p className="text-sm text-green-700">
            {t("upgrade.requestSubmittedDesc")}
          </p>
        </div>
      )}

      {/* Payment & Upload Form */}
      {!pendingRequest && !success && (
        <div className="bg-d-surface rounded-xl shadow-card p-4 sm:p-6">
          <h2 className="text-base font-semibold text-d-text mb-4">
            {isRenewal ? t("upgrade.howToRenew") : t("upgrade.howToUpgrade")}
          </h2>

          {/* Steps */}
          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-d-subtle-bg text-d-text rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-d-text mb-1">{t("upgrade.sendPayment")}</h3>
                <p className="text-sm text-d-text-sub mb-3">
                  {t("upgrade.transferAmount")}
                </p>
                <div className="bg-d-surface-secondary rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-d-text-sub uppercase tracking-wide">{t("tokens.ccpAccount")}</p>
                    <p className="text-sm font-mono text-d-text mt-1">0023456789 / 42</p>
                    <p className="text-xs text-d-text-sub mt-0.5">{t("upgrade.accountHolder")}</p>
                  </div>
                  <div className="border-t border-d-border pt-3">
                    <p className="text-xs font-medium text-d-text-sub uppercase tracking-wide">{t("tokens.baridiMob")}</p>
                    <p className="text-sm font-mono text-d-text mt-1">00799999 0023456789 42</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-d-subtle-bg text-d-text rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-d-text mb-1">{t("upgrade.uploadReceipt")}</h3>
                <p className="text-sm text-d-text-sub mb-3">
                  {t("upgrade.uploadReceiptDesc")}
                </p>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded mb-3 text-sm">{error}</div>
                )}

                {proofUrl ? (
                  <div className="flex items-start gap-4">
                    <img
                      src={proofUrl}
                      alt="Payment proof"
                      className="w-40 h-40 object-cover rounded-lg border border-d-border"
                    />
                    <StyledButton
                      variant="danger"
                      size="sm"
                      onClick={() => setProofUrl("")}
                    >
                      {t("upgrade.removeReupload")}
                    </StyledButton>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-d-border rounded-lg p-6 text-center cursor-pointer hover:border-d-text transition-colors"
                  >
                    {uploading ? (
                      <p className="text-sm text-d-text">{t("common.uploading")}</p>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="mx-auto mb-2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="17,8 12,3 7,8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p className="text-sm text-d-text-sub">{t("upgrade.clickToUpload")}</p>
                        <p className="text-xs text-d-text-sub mt-1">{t("tokens.fileFormats")}</p>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadProof(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-d-subtle-bg text-d-text rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-d-text mb-1">{t("upgrade.submitAndWait")}</h3>
                <p className="text-sm text-d-text-sub">
                  {t("upgrade.submitAndWaitDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <StyledButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!proofUrl || submitting || uploading}
            isLoading={submitting}
            className="w-full"
          >
            {submitting
              ? t("common.submitting")
              : isRenewal
                ? `${t("upgrade.submitRenewal")} (${duration === "YEARLY" ? t("upgrade.yearly") : t("upgrade.monthly")} — ${formatPrice(PRICES[duration])})`
                : `${t("upgrade.submitUpgrade")} (${duration === "YEARLY" ? t("upgrade.yearly") : t("upgrade.monthly")} — ${formatPrice(PRICES[duration])})`
            }
          </StyledButton>
        </div>
      )}

      {/* Request History */}
      {requests.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-base sm:text-lg font-bold text-d-text mb-3 sm:mb-4">{t("upgrade.requestHistory")}</h2>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-d-surface rounded-xl shadow-card p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-d-text-sub">{new Date(req.createdAt).toLocaleDateString()}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                    req.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    req.status === "APPROVED" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                    req.duration === "YEARLY" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {req.duration === "YEARLY" ? t("upgrade.yearly") : t("upgrade.monthly")} — {formatPrice(PRICES[req.duration])}
                  </span>
                </div>
                <p className="text-xs text-d-text-sub">
                  {req.status === "PENDING" && t("upgrade.awaitingReview")}
                  {req.status === "APPROVED" && t("upgrade.planUpgraded")}
                  {req.status === "REJECTED" && (req.rejectionReason || t("upgrade.requestRejected"))}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-d-surface rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-d-surface-secondary border-b border-d-border">
                  <tr>
                    <th className="text-start px-4 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.date")}</th>
                    <th className="text-start px-4 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.duration")}</th>
                    <th className="text-start px-4 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.status")}</th>
                    <th className="text-start px-4 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.note")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-d-border">
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 text-sm text-d-text">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          req.duration === "YEARLY" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {req.duration === "YEARLY" ? t("upgrade.yearly") : t("upgrade.monthly")} — {formatPrice(PRICES[req.duration])}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          req.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          req.status === "APPROVED" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-d-text-sub">
                        {req.status === "PENDING" && t("upgrade.awaitingReview")}
                        {req.status === "APPROVED" && t("upgrade.planUpgraded")}
                        {req.status === "REJECTED" && (req.rejectionReason || t("upgrade.requestRejected"))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
