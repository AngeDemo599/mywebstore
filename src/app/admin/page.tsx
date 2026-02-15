"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Coins,
  X,
} from "lucide-react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

interface User {
  id: string;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
  tokens: number;
}

interface UpgradeRequest {
  id: string;
  userId: string;
  paymentProof: string;
  duration: "MONTHLY" | "YEARLY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    email: string;
    plan: string;
    planExpiresAt: string | null;
  };
}

interface TokenPurchase {
  id: string;
  userId: string;
  packId: string;
  tokens: number;
  priceDA: number;
  paymentProof: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    email: string;
    plan: string;
    planExpiresAt: string | null;
  };
}

const PRICES: Record<string, number> = { MONTHLY: 5000, YEARLY: 50000 };
const ITEMS_PER_PAGE = 8;

type TabType = "users" | "upgrades" | "token-purchases" | "tokens";


function formatExpiry(expiresAt: string | null, t: (key: string) => string): string | null {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const now = new Date();
  if (date <= now) return t("admin.expired");
  const days = Math.ceil(
    (date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );
  return `${date.toLocaleDateString()} (${days} ${t("admin.daysLeft")})`;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [upgrades, setUpgrades] = useState<UpgradeRequest[]>([]);
  const [tokenPurchases, setTokenPurchases] = useState<TokenPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Token management modal
  const [tokenModal, setTokenModal] = useState<User | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);

  // Token purchase reject modal
  const [tpRejectId, setTpRejectId] = useState<string | null>(null);
  const [tpRejectReason, setTpRejectReason] = useState("");

  const isAdmin =
    status === "authenticated" && session?.user?.role === "ADMIN";
  const pendingUpgradeCount = upgrades.filter((u) => u.status === "PENDING").length;
  const pendingTokenPurchaseCount = tokenPurchases.filter((p) => p.status === "PENDING").length;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }

    let cancelled = false;

    Promise.all([
      fetch("/api/admin/users").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/admin/upgrades").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/admin/tokens/purchases").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([usersData, upgradesData, tokenPurchasesData]) => {
        if (!cancelled) {
          setUsers(Array.isArray(usersData) ? usersData : []);
          setUpgrades(Array.isArray(upgradesData) ? upgradesData : []);
          setTokenPurchases(Array.isArray(tokenPurchasesData) ? tokenPurchasesData : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, isAdmin, router]);

  const togglePlan = useCallback(async (userId: string) => {
    setToggling(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? { ...u, plan: updated.plan, planExpiresAt: updated.planExpiresAt }
            : u
        )
      );
    }
    setToggling(null);
  }, []);

  const reviewUpgrade = useCallback(
    async (requestId: string, action: "approve" | "reject", reason?: string) => {
      setReviewing(requestId);
      const res = await fetch(`/api/admin/upgrades/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUpgrades((prev) =>
          prev.map((u) =>
            u.id === updated.id
              ? {
                  ...u,
                  status: updated.status,
                  rejectionReason: updated.rejectionReason,
                  reviewedAt: updated.reviewedAt,
                }
              : u
          )
        );
        if (action === "approve") {
          const req = upgrades.find((u) => u.id === requestId);
          if (req) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === req.userId ? { ...u, plan: "PRO" } : u
              )
            );
          }
        }
      }
      setReviewing(null);
      setRejectId(null);
      setRejectReason("");
    },
    [upgrades]
  );

  const reviewTokenPurchase = useCallback(
    async (purchaseId: string, action: "approve" | "reject", reason?: string) => {
      setReviewing(purchaseId);
      const res = await fetch(`/api/admin/tokens/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTokenPurchases((prev) =>
          prev.map((p) =>
            p.id === updated.id ? { ...p, ...updated } : p
          )
        );
        if (action === "approve") {
          // Update user token balance in the users list
          setUsers((prev) =>
            prev.map((u) =>
              u.id === updated.userId
                ? { ...u, tokens: u.tokens + updated.tokens }
                : u
            )
          );
        }
      }
      setReviewing(null);
      setTpRejectId(null);
      setTpRejectReason("");
    },
    []
  );

  const handleTokenAdjust = useCallback(async () => {
    if (!tokenModal || !tokenAmount || !tokenDescription) return;

    setTokenSubmitting(true);
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: tokenModal.id,
        amount: parseInt(tokenAmount),
        description: tokenDescription,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, tokens: data.balance } : u
        )
      );
      setTokenModal(null);
      setTokenAmount("");
      setTokenDescription("");
    }
    setTokenSubmitting(false);
  }, [tokenModal, tokenAmount, tokenDescription]);

  // Users filtering & sorting
  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.plan.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "role":
          cmp = a.role.localeCompare(b.role);
          break;
        case "plan":
          cmp = a.plan.localeCompare(b.plan);
          break;
        case "tokens":
          cmp = a.tokens - b.tokens;
          break;
        case "createdAt":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [users, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  );
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const setSearchAndReset = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const setTabAndReset = (value: TabType) => {
    setTab(value);
    setCurrentPage(1);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedUsers.map((u) => u.id)));
    }
  };

  const exportUsersCSV = () => {
    const headers = ["ID", "Email", "Role", "Plan", "Tokens", "Expires", "Created"];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.email,
      u.role,
      u.plan,
      u.tokens.toString(),
      u.planExpiresAt
        ? new Date(u.planExpiresAt).toLocaleDateString()
        : "",
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <p className="text-d-text-sub">{t("admin.redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-d-surface rounded-xl shadow-card flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="w-full max-w-[500px] px-4 py-2 rounded-lg border border-d-input-border flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchAndReset(e.target.value)}
            placeholder={
              tab === "users"
                ? t("admin.searchUsers")
                : t("admin.searchOther")
            }
            className="flex-1 text-sm text-d-text placeholder-gray-400 outline-none bg-transparent"
          />
          <Search className="w-5 h-5 text-d-text flex-shrink-0" />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StyledButton variant="outline" size="sm">
            <span className="flex items-center gap-1.5">
              {t("common.filter")}
              <SlidersHorizontal className="w-4 h-4" />
            </span>
          </StyledButton>
          {tab === "users" && (
            <StyledButton variant="outline" size="sm" onClick={exportUsersCSV}>
              <span className="flex items-center gap-1.5">
                {t("common.export")}
                <Download className="w-4 h-4" />
              </span>
            </StyledButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 bg-d-surface rounded-xl border border-d-border flex items-center gap-2">
        <button
          onClick={() => setTabAndReset("users")}
          className={`flex-1 px-1.5 py-1.5 rounded-lg text-sm font-bold text-center transition-colors ${
            tab === "users"
              ? "bg-d-surface-tertiary text-d-text font-[550]"
              : "text-d-text-sub hover:text-d-text"
          }`}
        >
          {t("admin.users")} ({users.length})
        </button>
        <button
          onClick={() => setTabAndReset("upgrades")}
          className={`flex-1 px-1.5 py-1.5 rounded-lg text-sm font-bold text-center transition-colors relative ${
            tab === "upgrades"
              ? "bg-d-surface-tertiary text-d-text font-[550]"
              : "text-d-text-sub hover:text-d-text"
          }`}
        >
          {t("admin.upgrades")}
          {pendingUpgradeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {pendingUpgradeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTabAndReset("token-purchases")}
          className={`flex-1 px-1.5 py-1.5 rounded-lg text-sm font-bold text-center transition-colors relative ${
            tab === "token-purchases"
              ? "bg-d-surface-tertiary text-d-text font-[550]"
              : "text-d-text-sub hover:text-d-text"
          }`}
        >
          {t("admin.tokenPurchases")}
          {pendingTokenPurchaseCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {pendingTokenPurchaseCount}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <>
          <div className="bg-d-surface rounded-xl shadow-card flex flex-col overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center bg-d-surface-secondary rounded-t-xl border-b border-d-border min-w-0">
              <div className="w-12 shrink-0 p-3 flex items-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedUsers.length > 0 &&
                    selectedIds.size === paginatedUsers.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-d-input-border text-d-text focus:ring-d-link cursor-pointer"
                />
              </div>
              <button
                onClick={() => toggleSort("email")}
                className="flex-1 p-3.5 flex items-center gap-1 text-left hover:bg-d-hover-bg transition-colors"
              >
                <span className="flex-1 text-d-text text-sm font-medium">
                  {t("admin.email")}
                </span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <button
                onClick={() => toggleSort("role")}
                className="w-24 shrink-0 p-3.5 flex items-center gap-1 text-left hover:bg-d-hover-bg transition-colors"
              >
                <span className="flex-1 text-d-text text-sm font-medium">
                  {t("admin.role")}
                </span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <button
                onClick={() => toggleSort("plan")}
                className="w-24 shrink-0 p-3.5 flex items-center gap-1 text-left hover:bg-d-hover-bg transition-colors"
              >
                <span className="flex-1 text-d-text text-sm font-medium">
                  {t("admin.plan")}
                </span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <button
                onClick={() => toggleSort("tokens")}
                className="w-24 shrink-0 p-3.5 flex items-center gap-1 text-left hover:bg-d-hover-bg transition-colors"
              >
                <span className="flex-1 text-d-text text-sm font-medium">
                  {t("admin.tokens")}
                </span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <div className="w-44 shrink-0 p-3.5 flex items-center">
                <span className="text-d-text text-sm font-medium">
                  {t("admin.expires")}
                </span>
              </div>
              <button
                onClick={() => toggleSort("createdAt")}
                className="w-36 shrink-0 p-3.5 flex items-center gap-1 text-left hover:bg-d-hover-bg transition-colors"
              >
                <span className="flex-1 text-d-text text-sm font-medium">
                  {t("admin.created")}
                </span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <div className="w-44 shrink-0 p-3.5 flex items-center">
                <span className="text-d-text text-sm font-medium">
                  {t("admin.actions")}
                </span>
              </div>
            </div>

            {/* Table Rows */}
            {paginatedUsers.length === 0 ? (
              <div className="p-8 text-center text-d-text-sub text-sm">
                {t("admin.noUsersMatch")}
              </div>
            ) : (
              paginatedUsers.map((user, i) => {
                const expiry = formatExpiry(user.planExpiresAt, t);
                return (
                  <div key={user.id}>
                    {i > 0 && <div className="border-t border-d-border" />}
                    <div className="flex items-center hover:bg-d-hover-bg transition-colors min-w-0">
                      <div className="w-12 shrink-0 p-3 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="w-4 h-4 rounded border-d-input-border text-d-text focus:ring-d-link cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 p-3 min-w-0">
                        <span className="text-d-text text-sm truncate block">
                          {user.email}
                        </span>
                      </div>
                      <div className="w-24 shrink-0 p-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-d-surface-secondary text-d-text"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="w-24 shrink-0 p-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                            user.plan === "PRO"
                              ? "bg-d-surface-secondary text-d-text"
                              : "bg-d-surface-secondary text-d-text-sub"
                          }`}
                        >
                          {user.plan}
                        </span>
                      </div>
                      <div className="w-24 shrink-0 p-3">
                        <button
                          onClick={() => setTokenModal(user)}
                          className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 font-medium"
                        >
                          <Coins size={14} className="text-amber-500" />
                          {user.tokens}
                        </button>
                      </div>
                      <div className="w-44 shrink-0 p-3">
                        <span className="text-d-text-sub text-sm">
                          {user.plan === "PRO" && expiry ? (
                            <span
                              className={
                                expiry === "Expired"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {expiry}
                            </span>
                          ) : (
                            "\u2014"
                          )}
                        </span>
                      </div>
                      <div className="w-36 shrink-0 p-3">
                        <span className="text-d-text text-sm leading-5">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "2-digit",
                          })}
                          <br />
                          <span className="text-d-text-sub text-xs">
                            {t("common.at")}{" "}
                            {new Date(user.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </span>
                        </span>
                      </div>
                      <div className="w-44 shrink-0 p-3">
                        <StyledButton
                          variant="outline"
                          size="sm"
                          onClick={() => togglePlan(user.id)}
                          disabled={toggling === user.id}
                          isLoading={toggling === user.id}
                        >
                          {`${t("admin.switchTo")} ${user.plan === "FREE" ? "PRO" : "FREE"}`}
                        </StyledButton>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-d-text font-semibold">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                <span className="text-d-text-sub">-</span>
                <span className="text-d-text-sub">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredUsers.length
                  )}
                </span>
                <span className="text-d-text-sub">{t("common.of")} {totalPages} {t("admin.pages")}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-d-text text-sm">{t("common.page")}</span>
                  <select
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="pl-2 pr-1 py-1 rounded-lg border border-d-input-border text-d-text text-sm outline-none cursor-pointer"
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <StyledButton
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </StyledButton>
                  <StyledButton
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </StyledButton>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upgrades Tab */}
      {tab === "upgrades" && (
        <>
          {upgrades.length === 0 ? (
            <div className="bg-d-surface rounded-xl shadow-card p-8 text-center">
              <p className="text-d-text-sub">{t("admin.noUpgradeRequests")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upgrades
                .filter((req) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    req.user.email.toLowerCase().includes(q) ||
                    req.status.toLowerCase().includes(q) ||
                    req.duration.toLowerCase().includes(q)
                  );
                })
                .map((req) => (
                  <div
                    key={req.id}
                    className={`bg-d-surface rounded-xl border-2 p-6 transition-colors ${
                      req.status === "PENDING"
                        ? "border-yellow-300"
                        : req.status === "APPROVED"
                          ? "border-green-200"
                          : "border-red-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-medium text-d-text">
                            {req.user.email}
                          </span>
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                              req.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : req.status === "APPROVED"
                                  ? "bg-green-200 text-green-700"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {req.status}
                          </span>
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                              req.duration === "YEARLY"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-d-surface-secondary text-d-text"
                            }`}
                          >
                            {req.duration === "YEARLY" ? t("admin.yearly") : t("admin.monthly")}{" "}
                            &mdash; {formatPrice(PRICES[req.duration])}
                          </span>
                          <span className="text-xs text-d-text-sub">
                            {new Date(req.createdAt).toLocaleDateString()} {t("common.at")}{" "}
                            {new Date(req.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {req.user.planExpiresAt && (
                          <p className="text-xs text-d-text-sub mb-1">
                            {t("admin.currentExpiry")}{" "}
                            {formatExpiry(req.user.planExpiresAt, t) || "\u2014"}
                          </p>
                        )}

                        {req.rejectionReason && (
                          <p className="text-sm text-red-600 mb-2">
                            {t("admin.reason")} {req.rejectionReason}
                          </p>
                        )}

                        {req.reviewedAt && (
                          <p className="text-xs text-d-text-sub">
                            {t("admin.reviewed")}{" "}
                            {new Date(req.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <img
                        src={req.paymentProof}
                        alt={t("admin.paymentProof")}
                        className="w-20 h-20 object-cover rounded-lg border border-d-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setProofPreview(req.paymentProof)}
                      />
                    </div>

                    {req.status === "PENDING" && (
                      <div className="mt-4 pt-4 border-t border-d-border">
                        {rejectId === req.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder={t("admin.rejectionReason")}
                              className="flex-1 px-3 py-1.5 border border-d-input-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-d-text"
                            />
                            <StyledButton
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                reviewUpgrade(req.id, "reject", rejectReason)
                              }
                              disabled={reviewing === req.id}
                              isLoading={reviewing === req.id}
                            >
                              {t("admin.confirmReject")}
                            </StyledButton>
                            <StyledButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRejectId(null);
                                setRejectReason("");
                              }}
                            >
                              {t("common.cancel")}
                            </StyledButton>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <StyledButton
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                reviewUpgrade(req.id, "approve")
                              }
                              disabled={reviewing === req.id}
                              isLoading={reviewing === req.id}
                            >
                              {`${t("admin.approve")} \u2014 ${req.duration === "YEARLY" ? t("admin.yearly") : t("admin.monthly")} PRO (${formatPrice(PRICES[req.duration])})`}
                            </StyledButton>
                            <StyledButton
                              variant="danger"
                              size="sm"
                              onClick={() => setRejectId(req.id)}
                            >
                              {t("admin.reject")}
                            </StyledButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Token Purchases Tab */}
      {tab === "token-purchases" && (
        <>
          {tokenPurchases.length === 0 ? (
            <div className="bg-d-surface rounded-xl shadow-card p-8 text-center">
              <p className="text-d-text-sub">{t("admin.noTokenPurchases")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokenPurchases
                .filter((req) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    req.user.email.toLowerCase().includes(q) ||
                    req.status.toLowerCase().includes(q) ||
                    req.packId.toLowerCase().includes(q)
                  );
                })
                .map((req) => (
                  <div
                    key={req.id}
                    className={`bg-d-surface rounded-xl border-2 p-6 transition-colors ${
                      req.status === "PENDING"
                        ? "border-amber-300"
                        : req.status === "APPROVED"
                          ? "border-green-200"
                          : "border-red-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-medium text-d-text">
                            {req.user.email}
                          </span>
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                              req.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : req.status === "APPROVED"
                                  ? "bg-green-200 text-green-700"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {req.status}
                          </span>
                          <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
                            {req.packId.charAt(0).toUpperCase() + req.packId.slice(1)} {t("admin.pack")} &mdash; {req.tokens} {t("admin.tokens")}
                          </span>
                          <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-d-surface-secondary text-d-text">
                            {formatPrice(req.priceDA)}
                          </span>
                          <span className="text-xs text-d-text-sub">
                            {new Date(req.createdAt).toLocaleDateString()} {t("common.at")}{" "}
                            {new Date(req.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {req.user.plan === "PRO" && (
                          <p className="text-xs text-indigo-600 font-medium mb-1">
                            {t("admin.proUserBonus")}
                          </p>
                        )}

                        {req.rejectionReason && (
                          <p className="text-sm text-red-600 mb-2">
                            {t("admin.reason")} {req.rejectionReason}
                          </p>
                        )}

                        {req.reviewedAt && (
                          <p className="text-xs text-d-text-sub">
                            {t("admin.reviewed")}{" "}
                            {new Date(req.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <img
                        src={req.paymentProof}
                        alt={t("admin.paymentProof")}
                        className="w-20 h-20 object-cover rounded-lg border border-d-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setProofPreview(req.paymentProof)}
                      />
                    </div>

                    {req.status === "PENDING" && (
                      <div className="mt-4 pt-4 border-t border-d-border">
                        {tpRejectId === req.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tpRejectReason}
                              onChange={(e) => setTpRejectReason(e.target.value)}
                              placeholder={t("admin.rejectionReason")}
                              className="flex-1 px-3 py-1.5 border border-d-input-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-d-text"
                            />
                            <StyledButton
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                reviewTokenPurchase(req.id, "reject", tpRejectReason)
                              }
                              disabled={reviewing === req.id}
                              isLoading={reviewing === req.id}
                            >
                              {t("admin.confirmReject")}
                            </StyledButton>
                            <StyledButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTpRejectId(null);
                                setTpRejectReason("");
                              }}
                            >
                              {t("common.cancel")}
                            </StyledButton>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <StyledButton
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                reviewTokenPurchase(req.id, "approve")
                              }
                              disabled={reviewing === req.id}
                              isLoading={reviewing === req.id}
                            >
                              {`${t("admin.approve")} \u2014 ${req.tokens} ${t("admin.tokens")} (${formatPrice(req.priceDA)})`}
                            </StyledButton>
                            <StyledButton
                              variant="danger"
                              size="sm"
                              onClick={() => setTpRejectId(req.id)}
                            >
                              {t("admin.reject")}
                            </StyledButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Proof Image Lightbox */}
      {proofPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setProofPreview(null)}
        >
          <StyledButton
            variant="ghost"
            size="icon"
            onClick={() => setProofPreview(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:opacity-70"
          >
            &times;
          </StyledButton>
          <img
            src={proofPreview}
            alt={t("admin.paymentProof")}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Token Adjustment Modal */}
      {tokenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-d-surface rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins size={20} className="text-amber-500" />
                <h3 className="text-lg font-semibold text-d-text">
                  {t("admin.manageTokens")}
                </h3>
              </div>
              <StyledButton
                variant="ghost"
                size="icon"
                onClick={() => {
                  setTokenModal(null);
                  setTokenAmount("");
                  setTokenDescription("");
                }}
              >
                <X size={20} className="text-d-text-sub" />
              </StyledButton>
            </div>

            <div className="bg-d-surface-secondary rounded-xl p-4 mb-4">
              <p className="text-sm text-d-text">
                <strong>{tokenModal.email}</strong>
              </p>
              <p className="text-sm text-d-text-sub mt-1">
                {t("admin.currentBalance")} <strong className="text-amber-600">{tokenModal.tokens} {t("admin.tokens")}</strong>
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[13px] font-[450] text-d-text mb-1">
                  {t("admin.amountLabel")}
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder={t("admin.amountPlaceholder")}
                  className="w-full px-3 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-2 focus:ring-amber-500 text-d-text"
                />
              </div>
              <div>
                <label className="block text-[13px] font-[450] text-d-text mb-1">
                  {t("common.description")}
                </label>
                <input
                  type="text"
                  value={tokenDescription}
                  onChange={(e) => setTokenDescription(e.target.value)}
                  placeholder={t("admin.descriptionPlaceholder")}
                  className="w-full px-3 py-1.5 border border-d-input-border rounded-lg bg-d-input-bg text-[13px] min-h-[32px] focus:outline-none focus:ring-2 focus:ring-amber-500 text-d-text"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <StyledButton
                variant="secondary"
                onClick={() => {
                  setTokenModal(null);
                  setTokenAmount("");
                  setTokenDescription("");
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </StyledButton>
              <StyledButton
                variant="primary"
                onClick={handleTokenAdjust}
                disabled={!tokenAmount || !tokenDescription}
                isLoading={tokenSubmitting}
                className="flex-1"
              >
                {t("admin.apply")}
              </StyledButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
