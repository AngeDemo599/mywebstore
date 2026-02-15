"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Coins,
  TrendingUp,
  UserPlus,
  Copy,
  Check,
  Lightbulb,
  Gift,
  Share2,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "@/components/language-provider";

interface AffiliateData {
  referralCode: string;
  stats: {
    totalReferrals: number;
    totalTokensEarned: number;
    thisMonthEarnings: number;
    activeReferrals: number;
  };
  referrals: Array<{
    id: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  earnings: Array<{
    id: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
  chart: {
    weekly: Array<{ label: string; value: number }>;
    monthly: Array<{ label: string; value: number }>;
  };
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color = "#303030",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="bg-d-surface rounded-xl shadow-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "12" }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-[13px] font-medium text-d-text-sub">{label}</span>
      </div>
      <p className="text-2xl font-bold text-d-text">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {subtext && (
        <p className="text-[11px] text-d-text-muted mt-0.5">{subtext}</p>
      )}
    </div>
  );
}

function BarChart({
  data,
  maxVal,
  color = "#303030",
  labels,
}: {
  data: number[];
  maxVal: number;
  color?: string;
  labels: string[];
}) {
  return (
    <div>
      <div className="flex items-end gap-[3px] h-28">
        {data.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-all hover:opacity-80"
            style={{
              height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`,
              minHeight: val > 0 ? "4px" : "0",
              backgroundColor: color,
            }}
            title={`${labels[i]}: ${val} tokens`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-d-text-muted">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

export default function AffiliatesDashboard() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [chartMode, setChartMode] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/affiliates/me");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/register?ref=${data.referralCode}`
      : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = referralUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encodedUrl = encodeURIComponent(referralUrl);
  const shareText = encodeURIComponent(
    t("affiliates.shareMessage")
  );

  const chartData =
    chartMode === "weekly" ? data.chart.weekly : data.chart.monthly;
  const chartValues = chartData.map((d) => d.value);
  const chartLabels = chartData.map((d) => d.label);
  const maxChart = Math.max(...chartValues, 1);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-d-text">
              {t("affiliates.title")}
            </h1>
            {data.stats.totalTokensEarned > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">
                <Coins size={11} />
                {data.stats.totalTokensEarned} {t("affiliates.earned")}
              </span>
            )}
          </div>
          <p className="text-[13px] text-d-text-sub mt-0.5">
            {t("affiliates.subtitle")}
          </p>
        </div>
      </div>

      {/* Referral Link Hero Card */}
      <div className="rounded-xl p-6 mb-6 bg-gradient-to-b from-[#3a3a3a] to-[#262626] border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs font-medium mb-1">
              {t("affiliates.referralLink")}
            </p>
            <p className="text-white text-sm font-mono truncate">
              {referralUrl}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#303030] text-sm font-semibold transition-colors hover:bg-white/90 shrink-0"
          >
            {copied ? (
              <>
                <Check size={16} />
                {t("common.copied")}
              </>
            ) : (
              <>
                <Copy size={16} />
                {t("common.copyLink")}
              </>
            )}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <span className="text-white/40 text-xs mr-1">{t("common.shareVia")}</span>
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${shareText}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#25D366" }}
            title="Share on WhatsApp"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1877F2" }}
            title="Share on Facebook"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#0088cc" }}
            title="Share on Telegram"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label={t("affiliates.totalReferrals")}
          value={data.stats.totalReferrals}
          subtext={t("affiliates.allTimeSignups")}
          color="#2563eb"
        />
        <StatCard
          icon={<Coins className="w-4 h-4" />}
          label={t("affiliates.tokensEarned")}
          value={data.stats.totalTokensEarned}
          subtext={t("affiliates.totalEarnings")}
          color="#16a34a"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label={t("affiliates.thisMonth")}
          value={data.stats.thisMonthEarnings}
          subtext={t("affiliates.tokensThisMonth")}
          color="#ea580c"
        />
        <StatCard
          icon={<UserPlus className="w-4 h-4" />}
          label={t("affiliates.activeReferrals")}
          value={data.stats.activeReferrals}
          subtext={t("affiliates.signedUpUsers")}
          color="#7c3aed"
        />
      </div>

      {/* Earnings Chart */}
      <div className="bg-d-surface rounded-xl shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-d-text">
              {t("affiliates.earningsOverview")}
            </h2>
            <p className="text-[11px] text-d-text-muted">
              {t("affiliates.tokensOverTime")}
            </p>
          </div>
          <div className="flex rounded-lg border border-d-border overflow-hidden">
            <button
              onClick={() => setChartMode("weekly")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                chartMode === "weekly"
                  ? "bg-d-surface-tertiary text-d-text"
                  : "text-d-text-sub hover:bg-d-hover-bg"
              }`}
            >
              {t("affiliates.weekly")}
            </button>
            <button
              onClick={() => setChartMode("monthly")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                chartMode === "monthly"
                  ? "bg-d-surface-tertiary text-d-text"
                  : "text-d-text-sub hover:bg-d-hover-bg"
              }`}
            >
              {t("affiliates.monthly")}
            </button>
          </div>
        </div>
        {chartValues.some((v) => v > 0) ? (
          <BarChart
            data={chartValues}
            maxVal={maxChart}
            color="#16a34a"
            labels={chartLabels}
          />
        ) : (
          <p className="text-sm text-d-text-muted text-center py-8">
            {t("affiliates.noEarningsYet")}
          </p>
        )}
      </div>

      {/* Referrals List */}
      <div className="bg-d-surface rounded-xl shadow-card p-5 mb-6">
        <h2 className="text-base font-semibold text-d-text mb-4">
          {t("affiliates.yourReferrals")}
        </h2>
        {data.referrals.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-d-text-sub bg-d-surface-secondary">
                    <th className="px-3 py-2 font-medium rounded-l-lg">
                      {t("affiliates.user")}
                    </th>
                    <th className="px-3 py-2 font-medium">{t("affiliates.status")}</th>
                    <th className="px-3 py-2 font-medium rounded-r-lg text-right">
                      {t("affiliates.date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrals.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-d-border last:border-0"
                    >
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-d-text">
                          {maskEmail(r.email)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {r.status === "SIGNED_UP" ? t("affiliates.signedUp") : r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-d-text-sub text-xs">
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="sm:hidden space-y-3">
              {data.referrals.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg bg-d-surface-secondary"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-d-text">
                      {maskEmail(r.email)}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      {r.status === "SIGNED_UP" ? t("affiliates.signedUp") : r.status}
                    </span>
                  </div>
                  <p className="text-xs text-d-text-muted">
                    {formatDate(r.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-d-text-muted text-center py-8">
            {t("affiliates.noReferralsYet")}
          </p>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-d-surface rounded-xl shadow-card p-5 mb-6">
        <h2 className="text-base font-semibold text-d-text mb-4">
          {t("affiliates.recentActivity")}
        </h2>
        {data.earnings.length > 0 ? (
          <div className="space-y-0">
            {data.earnings.slice(0, 10).map((e, i) => (
              <div key={e.id} className="flex gap-3">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  {i < Math.min(data.earnings.length, 10) - 1 && (
                    <div className="w-px flex-1 bg-d-border" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-d-text truncate">
                      {e.description}
                    </p>
                    <span className="text-sm font-semibold text-green-600 shrink-0">
                      +{e.amount} {t("common.tokens")}
                    </span>
                  </div>
                  <p className="text-xs text-d-text-muted mt-0.5">
                    {formatDate(e.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-d-text-muted text-center py-8">
            {t("affiliates.noActivityYet")}
          </p>
        )}
      </div>

      {/* How to Earn More */}
      <div className="bg-d-surface rounded-xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-base font-semibold text-d-text">
            {t("affiliates.howToEarnMore")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-d-surface-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-d-text-sub" />
              <span className="text-sm font-medium text-d-text">
                {t("affiliates.shareOnSocial")}
              </span>
            </div>
            <p className="text-xs text-d-text-muted">
              {t("affiliates.shareOnSocialDesc")}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-d-surface-secondary">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-d-text-sub" />
              <span className="text-sm font-medium text-d-text">
                {t("affiliates.tellFriends")}
              </span>
            </div>
            <p className="text-xs text-d-text-muted">
              {t("affiliates.tellFriendsDesc")}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-d-surface-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-d-text-sub" />
              <span className="text-sm font-medium text-d-text">
                {t("affiliates.earn50Each")}
              </span>
            </div>
            <p className="text-xs text-d-text-muted">
              {t("affiliates.earn50EachDesc")}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-d-surface-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-d-text-sub" />
              <span className="text-sm font-medium text-d-text">
                {t("affiliates.joinCommunities")}
              </span>
            </div>
            <p className="text-xs text-d-text-muted">
              {t("affiliates.joinCommunitiesDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
