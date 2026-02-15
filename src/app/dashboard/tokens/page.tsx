"use client";

import { useEffect, useState, useRef } from "react";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { useTokenBalance } from "@/lib/use-token-balance";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Upload,
  ShieldCheck,
  Sparkles,
  Check,
  X,
  FileText,
  CreditCard,
  Info,
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  Palette,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import ProCTA from "@/components/pro-cta";
import { useTranslation } from "@/components/language-provider";

interface TokenPurchase {
  id: string;
  packId: string;
  tokens: number;
  priceDA: number;
  paymentProof: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface TokenTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const PACKS = [
  { id: "small", name: "Small", tokens: 100, priceDA: 1000, proTokens: 120, isBestValue: false },
  { id: "medium", name: "Medium", tokens: 500, priceDA: 4500, proTokens: 625, isBestValue: true },
  { id: "large", name: "Large", tokens: 1000, priceDA: 8500, proTokens: 1250, isBestValue: false },
];

export default function TokensPage() {
  const { t } = useTranslation();
  const { effectivePlan, status } = useEffectivePlan();
  const { balance, transactions, loading: balanceLoading } = useTokenBalance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(PACKS[1]); // default medium
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isPro = effectivePlan === "PRO";
  const pendingPurchase = purchases.find((p) => p.status === "PENDING");

  useEffect(() => {
    if (status === "loading") return;
    fetch("/api/user/tokens/purchase")
      .then((res) => res.json())
      .then((data) => {
        setPurchases(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const uploadProof = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError(t("tokens.uploadImage")); return; }
    if (file.size > 5 * 1024 * 1024) { setError(t("tokens.fileTooLarge")); return; }

    setUploading(true);
    setError("");
    setProofFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(data.error || "Upload failed");
        setProofFileName("");
      } else {
        setProofUrl(data.url);
      }
    } catch {
      setError("Upload failed. Please try again.");
      setProofFileName("");
    }
    setUploading(false);
  };

  const resetUpload = () => {
    setProofUrl("");
    setProofFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedPack || !proofUrl) { setError("Please upload payment proof"); return; }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/user/tokens/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId: selectedPack.id, paymentProof: proofUrl }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setSuccess(true);
      setPurchases((prev) => [data, ...prev]);
      resetUpload();
    }
  };

  if (status === "loading" || loading || balanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  const tokensForSelected = isPro ? selectedPack.proTokens : selectedPack.tokens;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-d-text">{t("tokens.title")}</h1>
        <p className="mt-1 text-d-text-sub text-sm">
          {t("tokens.subtitle")}
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-b from-[#3a3a3a] to-[#262626] rounded-xl p-8 text-white relative overflow-hidden border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-[80px] opacity-[0.04] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-lime-400 rounded-full filter blur-[60px] opacity-[0.06] -translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-white/50 text-sm font-medium mb-1 flex items-center gap-2">
              <Coins size={16} /> {t("tokens.currentBalance")}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold tracking-tight">{balance}</span>
              <span className="text-white/50 text-xl font-medium">{t("tokens.tokens")}</span>
            </div>
          </div>
          {isPro && (
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-sm font-medium text-white/70 flex items-center gap-2">
              <Sparkles size={14} className="text-lime-400" />
              {t("tokens.proBonusActive")}
            </div>
          )}
        </div>
      </div>

      {/* Pending Purchase Notice */}
      {pendingPurchase && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">{t("tokens.pendingReview")}</h3>
              <p className="text-sm text-yellow-700">
                {t("tokens.pendingReviewDesc")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800 mb-1">{t("tokens.requestSubmitted")}</h3>
              <p className="text-sm text-green-700">
                {t("tokens.requestSubmittedDesc")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Left Column — Pack Selection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-d-text">{t("tokens.selectPackage")}</h2>
            <span className="text-sm font-medium text-d-text bg-d-surface-tertiary px-3 py-1 rounded-full">
              {PACKS.length} {t("common.options")}
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {PACKS.map((pack) => {
              const tokens = isPro ? pack.proTokens : pack.tokens;
              const perToken = (pack.priceDA / tokens).toFixed(1);
              const isSelected = selectedPack.id === pack.id;

              return (
                <button
                  key={pack.id}
                  onClick={() => {
                    setSelectedPack(pack);
                    setSuccess(false);
                    setError("");
                  }}
                  disabled={!!pendingPurchase}
                  className={`relative group cursor-pointer transition-all border-2 rounded-xl p-6 flex flex-col gap-4 h-full text-left disabled:opacity-50 ${
                    isSelected
                      ? "border-d-text bg-d-surface-secondary shadow-lg"
                      : "border-d-border bg-d-surface hover:border-d-input-border hover:shadow-md"
                  }`}
                >
                  {pack.isBestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#303030] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                      <Sparkles size={10} />
                      {t("tokens.bestValue").toUpperCase()}
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-[#303030] text-white"
                        : "bg-d-surface-tertiary text-d-text-sub group-hover:bg-d-border group-hover:text-d-text"
                    }`}>
                      <Coins size={22} />
                    </div>
                    {isSelected && (
                      <div className="bg-[#303030] text-white rounded-full p-1">
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-d-text-sub font-medium text-xs uppercase tracking-wider">{pack.id === "small" ? t("tokens.smallPack") : pack.id === "medium" ? t("tokens.mediumPack") : t("tokens.largePack")}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-d-text">{tokens.toLocaleString()}</span>
                      <span className="text-d-text-sub font-medium text-sm">{t("tokens.tokens")}</span>
                    </div>
                    {isPro && pack.tokens !== pack.proTokens && (
                      <p className="text-xs text-d-text font-medium mt-1 flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-500" />
                        +{pack.proTokens - pack.tokens} {t("tokens.bonus")}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-d-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xl font-bold text-d-text">
                        {pack.priceDA.toLocaleString()} <span className="text-sm font-normal text-d-text-sub">DA</span>
                      </span>
                    </div>
                    <p className="text-xs font-medium text-d-text-muted">
                      {perToken} {t("tokens.perToken")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info banner */}
          <div className="bg-d-surface-secondary border border-d-border rounded-xl p-5 flex gap-4 items-start">
            <div className="bg-d-border p-2 rounded-lg text-d-text shrink-0">
              <Info size={18} />
            </div>
            <div>
              <h4 className="text-d-text font-semibold text-sm">{t("tokens.howTokensWork")}</h4>
              <p className="text-d-text-sub text-sm mt-1">
                {t("tokens.howTokensWorkDesc")} {isPro ? t("tokens.howTokensWorkPro") : t("tokens.howTokensWorkFree")}
              </p>
            </div>
          </div>

          {/* PRO CTA — only for FREE users */}
          {!isPro && <ProCTA />}
        </div>

        {/* Right Column — Payment Panel */}
        <div className="lg:col-span-5">
          <div className="bg-d-surface rounded-xl shadow-card border border-d-border overflow-hidden sticky top-24">
            {/* Panel Header */}
            <div className="p-6 bg-d-surface-secondary border-b border-d-border">
              <h2 className="text-base font-bold text-d-text flex items-center gap-2">
                <CreditCard size={18} className="text-d-text" />
                {t("tokens.orderSummary")}
              </h2>
              <div className="mt-4 flex justify-between items-center bg-d-surface p-3 rounded-xl border border-d-border">
                <div>
                  <p className="text-xs text-d-text-sub">{t("tokens.selectedPackage")}</p>
                  <p className="font-bold text-d-text text-sm">{selectedPack.id === "small" ? t("tokens.smallPack") : selectedPack.id === "medium" ? t("tokens.mediumPack") : t("tokens.largePack")} ({tokensForSelected} {t("tokens.tokens")})</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-d-text-sub">{t("tokens.totalDue")}</p>
                  <p className="text-lg font-bold text-d-text">{selectedPack.priceDA.toLocaleString()} DA</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Payment Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#303030] text-white text-xs font-bold">1</div>
                  <h3 className="font-semibold text-d-text text-sm">{t("tokens.sendPayment")}</h3>
                </div>

                <p className="text-sm text-d-text-sub">
                  {t("tokens.transferTo")}
                </p>

                <div className="space-y-3">
                  {/* CCP */}
                  <div className="relative p-4 rounded-xl border border-d-border bg-d-surface-secondary hover:border-d-input-border transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-d-text uppercase tracking-wider">{t("tokens.ccpAccount")}</span>
                      <button
                        onClick={() => handleCopy("0023456789/42", "ccp")}
                        className="text-d-text-muted hover:text-d-text transition-colors"
                        title="Copy"
                      >
                        {copiedField === "ccp" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="font-mono text-base font-medium text-d-text">0023456789 / 42</p>
                    <p className="text-xs text-d-text-sub mt-1">{t("tokens.holder")}</p>
                  </div>

                  {/* BaridiMob */}
                  <div className="relative p-4 rounded-xl border border-d-border bg-d-surface-secondary hover:border-d-input-border transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-d-text uppercase tracking-wider">{t("tokens.baridiMob")}</span>
                      <button
                        onClick={() => handleCopy("00799999002345678942", "baridi")}
                        className="text-d-text-muted hover:text-d-text transition-colors"
                        title="Copy"
                      >
                        {copiedField === "baridi" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="font-mono text-base font-medium text-d-text">00799999 0023456789 42</p>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-d-border" />

              {/* Step 2: Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#303030] text-white text-xs font-bold">2</div>
                  <h3 className="font-semibold text-d-text text-sm">{t("tokens.uploadReceipt")}</h3>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadProof(file);
                    if (e.target) e.target.value = "";
                  }}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="file-upload"
                />

                {!proofUrl && !uploading && (
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-d-border rounded-xl cursor-pointer hover:border-d-input-border hover:bg-d-hover-bg transition-all group"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-d-surface-tertiary rounded-full mb-3 group-hover:bg-d-border transition-colors">
                        <Upload className="w-5 h-5 text-d-text" />
                      </div>
                      <p className="text-sm text-d-text font-medium">{t("tokens.clickToUpload")}</p>
                      <p className="text-xs text-d-text-muted mt-1">{t("tokens.fileFormats")}</p>
                    </div>
                  </label>
                )}

                {uploading && (
                  <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-d-border rounded-xl bg-d-surface-secondary">
                    <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin mb-2" />
                    <p className="text-sm font-medium text-d-text-sub">{t("common.uploading")}</p>
                  </div>
                )}

                {proofUrl && !uploading && (
                  <div className="flex flex-col items-center justify-center w-full p-4 border-2 border-green-200 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">{t("tokens.uploadedSuccessfully")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-d-surface rounded-full border border-green-200">
                      <FileText size={12} className="text-green-600" />
                      <span className="text-xs text-green-700 truncate max-w-[150px]">{proofFileName || "receipt.jpg"}</span>
                      <button onClick={resetUpload} className="ml-1 text-green-400 hover:text-green-600">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!proofUrl || submitting || uploading || !!pendingPurchase}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  proofUrl && !submitting && !pendingPurchase
                    ? "bg-[#303030] text-white hover:bg-[#404040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)] active:scale-[0.98]"
                    : "bg-d-border text-d-text-muted cursor-not-allowed"
                }`}
              >
                <ShieldCheck size={18} />
                {submitting
                  ? t("common.submitting")
                  : pendingPurchase
                    ? t("tokens.purchasePending")
                    : proofUrl
                      ? t("tokens.confirmPurchase")
                      : t("tokens.uploadToContinue")
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      {purchases.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-d-text mb-4">{t("tokens.purchaseHistory")}</h2>
          <div className="bg-d-surface rounded-xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-d-surface-secondary border-b border-d-border">
                <tr>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.date")}</th>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("tokens.pack")}</th>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("tokens.tokens")}</th>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.price")}</th>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-d-border">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 text-sm text-d-text">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-d-text capitalize">{purchase.packId}</td>
                    <td className="px-6 py-4 text-sm text-d-text">{purchase.tokens}</td>
                    <td className="px-6 py-4 text-sm text-d-text">{formatPrice(purchase.priceDA)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        purchase.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        purchase.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {purchase.status === "PENDING" && <Clock size={10} />}
                        {purchase.status === "APPROVED" && <CheckCircle size={10} />}
                        {purchase.status === "REJECTED" && <XCircle size={10} />}
                        {purchase.status}
                      </span>
                      {purchase.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">{purchase.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-d-text mb-4">{t("tokens.transactionHistory")}</h2>
          <div className="bg-d-surface rounded-xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-d-surface-secondary border-b border-d-border">
                <tr>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.date")}</th>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.description")}</th>
                  <th className="text-left px-6 py-3 text-[13px] font-[450] text-d-text normal-case">{t("common.amount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-d-border">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 text-sm text-d-text">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-d-text">{tx.description}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {tx.amount > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
