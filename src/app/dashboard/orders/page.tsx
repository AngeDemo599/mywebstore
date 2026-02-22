"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { useTokenBalance } from "@/lib/use-token-balance";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Lock,
  Unlock,
  Coins,
  X,
  Sparkles,
  ShieldCheck,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Calendar,
} from "lucide-react";
import { StyledButton } from "@/components/styled-button";
import ProCTA from "@/components/pro-cta";
import { useTranslation } from "@/components/language-provider";
import { useToast } from "@/components/toast";

interface Order {
  id: string;
  name: string;
  phone: string;
  address: string;
  quantity: number;
  variants: Record<string, string> | null;
  status: "PENDING" | "CONFIRMED" | "IN_DELIVERY" | "DELIVERED" | "RETURNED";
  createdAt: string;
  product: { title: string; slug: string };
  isUnlocked: boolean;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
  CONFIRMED: { bg: "bg-indigo-100", text: "text-indigo-800" },
  IN_DELIVERY: { bg: "bg-blue-100", text: "text-blue-800" },
  DELIVERED: { bg: "bg-green-200", text: "text-green-700" },
  RETURNED: { bg: "bg-red-100", text: "text-red-700" },
};

const ITEMS_PER_PAGE = 8;

export default function OrdersPage() {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const { effectivePlan, status } = useEffectivePlan();
  const { balance: tokenBalance, refresh: refreshTokens } = useTokenBalance();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [unlockModal, setUnlockModal] = useState<Order | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyPhone = (orderId: string, phone: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(phone);
    } else {
      const ta = document.createElement("textarea");
      ta.value = phone;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(orderId);
    toastSuccess(t("toast.phoneCopied"), undefined, "copy");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isFree = effectivePlan === "FREE";

  useEffect(() => {
    if (status === "loading") return;

    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
        // Mark all orders as seen
        localStorage.setItem("_mws_orders_seen_at", new Date().toISOString());
        window.dispatchEvent(new Event("orders-seen"));
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  const updateStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      setUpdating(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === updated.id ? { ...o, status: updated.status } : o
          )
        );
        toastSuccess(t("toast.orderStatusUpdated"), undefined, "order");
      } else {
        toastError(t("toast.orderStatusFailed"));
      }
      setUpdating(null);
    },
    [toastSuccess, toastError, t]
  );

  const handleUnlock = useCallback(
    async (order: Order) => {
      setUnlocking(true);
      try {
        const res = await fetch(`/api/orders/${order.id}/unlock`, {
          method: "POST",
        });
        if (res.ok) {
          const unlockedOrder = await res.json();
          setOrders((prev) =>
            prev.map((o) =>
              o.id === unlockedOrder.id ? { ...o, ...unlockedOrder } : o
            )
          );
          refreshTokens();
          setUnlockModal(null);
          toastSuccess(t("toast.orderUnlocked"), undefined, "order");
        } else {
          const data = await res.json();
          toastError(data.error || t("toast.orderUnlockFailed"));
        }
      } catch {
        toastError(t("toast.orderUnlockFailed"));
      } finally {
        setUnlocking(false);
      }
    },
    [refreshTokens]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      IN_DELIVERY: 0,
      DELIVERED: 0,
      RETURNED: 0,
    };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const productNames = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => set.add(o.product.title));
    return Array.from(set).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;

    if (activeTab !== "all") {
      result = result.filter((o) => o.status === activeTab);
    }

    // Filter by product
    if (filterProduct !== "all") {
      result = result.filter((o) => o.product.title === filterProduct);
    }

    // Filter by period
    if (filterPeriod !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (filterPeriod) {
        case "today":
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "7days":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90days":
          cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      result = result.filter((o) => new Date(o.createdAt) >= cutoff);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.product.title.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "product":
          cmp = a.product.title.localeCompare(b.product.title);
          break;
        case "customer":
          cmp = a.name.localeCompare(b.name);
          break;
        case "quantity":
          cmp = a.quantity - b.quantity;
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
  }, [orders, activeTab, filterProduct, filterPeriod, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const setSearchAndReset = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const setTabAndReset = (value: string) => {
    setActiveTab(value);
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
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((o) => o.id)));
    }
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Product",
      "Customer",
      "Phone",
      "Address",
      "Qty",
      "Status",
      "Date",
    ];
    const rows = filtered.map((o) => [
      o.id,
      o.product.title,
      isFree && !o.isUnlocked ? o.name + "***" : o.name,
      isFree && !o.isUnlocked ? "***" : o.phone,
      isFree && !o.isUnlocked ? "***" : o.address,
      o.quantity.toString(),
      o.status,
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess(t("toast.exportDone"), undefined, "download");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-2.5 sm:p-4 bg-d-surface rounded-xl shadow-card flex flex-col gap-3 sm:gap-6 overflow-hidden max-w-full">
      {/* Header — search with inline filter & export */}
      <div className="relative" ref={filterRef}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-d-input-border">
          <Search className="w-4 h-4 text-d-text-sub flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchAndReset(e.target.value)}
            placeholder={t("orders.searchPlaceholder")}
            className="flex-1 text-sm text-d-text placeholder-d-text-sub outline-none bg-transparent min-w-0"
          />
          <div className="w-px h-5 bg-d-border flex-shrink-0" />
          <button
            onClick={() => setShowFilterDropdown((v) => !v)}
            className="relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-d-hover-bg transition-colors"
          >
            <SlidersHorizontal size={15} className="text-d-text-sub" />
            {(filterProduct !== "all" || filterPeriod !== "all") && (
              <span className="absolute top-0.5 end-0.5 w-1.5 h-1.5 rounded-full bg-d-link" />
            )}
          </button>
          <button
            onClick={exportCSV}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-d-hover-bg transition-colors"
          >
            <Download size={15} className="text-d-text-sub" />
          </button>
        </div>

        {/* Filter dropdown */}
        {showFilterDropdown && (
          <div className="absolute start-0 sm:end-0 sm:start-auto top-full mt-1.5 w-[calc(100vw-2rem)] sm:w-72 max-w-sm bg-d-surface rounded-xl border border-d-border shadow-lg z-30 py-3 px-3 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-d-text-sub uppercase mb-1.5">
                {t("orders.product")}
              </label>
              <select
                value={filterProduct}
                onChange={(e) => {
                  setFilterProduct(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-d-input-border text-d-text text-sm outline-none bg-transparent"
              >
                <option value="all">{t("orders.allProducts")}</option>
                {productNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-d-text-sub uppercase mb-1.5">
                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {t("orders.filterByPeriod")}</span>
              </label>
              <select
                value={filterPeriod}
                onChange={(e) => {
                  setFilterPeriod(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-d-input-border text-d-text text-sm outline-none bg-transparent"
              >
                <option value="all">{t("orders.allPeriods")}</option>
                <option value="today">{t("orders.today")}</option>
                <option value="7days">{t("orders.last7days")}</option>
                <option value="30days">{t("orders.last30days")}</option>
                <option value="90days">{t("orders.last90days")}</option>
              </select>
            </div>
            {(filterProduct !== "all" || filterPeriod !== "all") && (
              <button
                onClick={() => {
                  setFilterProduct("all");
                  setFilterPeriod("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-d-link hover:underline text-start"
              >
                {t("orders.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>

      {isFree ? (
        orders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 sm:p-4 rounded-xl text-xs sm:text-sm">
            <span className="sm:hidden">
              <strong>FREE</strong> plan — details hidden. Use tokens to unlock orders or upgrade to <strong>PRO</strong>.
            </span>
            <span className="hidden sm:inline">
              You are on the <strong>FREE</strong> plan. Customer details are hidden and order status management is locked.
              Use tokens to unlock individual orders (10 tokens each),
              or upgrade to <strong>PRO</strong> for full access and status management.
            </span>
          </div>
        )
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-3 sm:p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#303030] text-white text-[10px] sm:text-[11px] font-bold flex-shrink-0">
            <Sparkles size={10} className="text-lime-400" />
            PRO
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-800 min-w-0">
            <ShieldCheck size={14} className="flex-shrink-0" />
            <span className="sm:hidden">Full access — all details visible.</span>
            <span className="hidden sm:inline">Full access — all customer details visible and order management unlocked.</span>
          </div>
        </div>
      )}

      {/* Status Filter — dropdown on mobile, tabs on desktop */}
      {(() => {
        const tabs = [
          { key: "all", label: t("orders.all") },
          { key: "PENDING", label: t("orders.pending") },
          { key: "CONFIRMED", label: t("orders.confirmed") },
          { key: "IN_DELIVERY", label: t("orders.inDelivery") },
          { key: "DELIVERED", label: t("orders.delivered") },
          { key: "RETURNED", label: t("orders.returned") },
        ];
        return (
          <>
            {/* Mobile: dropdown */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setTabAndReset(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-d-text text-sm font-semibold outline-none"
              >
                {tabs.map((tab) => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label} ({statusCounts[tab.key] || 0})
                  </option>
                ))}
              </select>
            </div>
            {/* Desktop: tabs */}
            <div className="hidden sm:block">
              <div className="px-3 py-2 bg-d-surface rounded-xl border border-d-border flex items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTabAndReset(tab.key)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-bold text-center transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "bg-d-surface-tertiary text-d-text font-[550]"
                        : "text-d-text-sub hover:text-d-text"
                    }`}
                  >
                    {tab.label} ({statusCounts[tab.key] || 0})
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Table / Cards */}
      {orders.length === 0 ? (
        <div className="bg-d-surface rounded-xl shadow-card p-6 sm:p-8 text-center">
          <p className="text-d-text-sub text-sm">{t("orders.noOrders")}</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Cards ── */}
          <div className="lg:hidden space-y-2.5">
            {paginated.length === 0 ? (
              <div className="p-6 text-center text-d-text-sub text-sm">No orders match your search.</div>
            ) : (
              paginated.map((order) => {
                const colors = statusStyles[order.status];
                const isLocked = isFree && !order.isUnlocked;
                return (
                  <div key={order.id} className="bg-d-surface rounded-xl border border-d-border p-3 space-y-2.5">
                    {/* Top: product + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-d-text truncate">{order.product.title}</p>
                        {order.variants && Object.keys(order.variants).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(order.variants).map(([key, val]) => (
                              <span key={key} className="bg-d-surface-secondary text-d-text-sub px-1.5 py-0.5 rounded text-[10px]">{key}: {val}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => {
                          if (isFree) { e.target.value = order.status; setShowProModal(true); }
                          else { updateStatus(order.id, e.target.value); }
                        }}
                        disabled={updating === order.id}
                        className={`text-[10px] font-semibold rounded-md px-1.5 py-0.5 outline-none disabled:opacity-50 cursor-pointer border-0 appearance-none flex-shrink-0 ${colors.bg} ${colors.text}`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 3px center", paddingRight: "14px" }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="IN_DELIVERY">IN DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="RETURNED">RETURNED</option>
                      </select>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-1.5 text-[11px] text-d-text-sub">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 min-w-0 truncate">
                          {isLocked ? (
                            <><span className="text-d-text truncate">{order.name}</span><span className="blur-sm select-none">S</span><Lock size={9} className="flex-shrink-0" /></>
                          ) : (
                            <span className="text-d-text truncate">{order.name}</span>
                          )}
                        </span>
                        <span className="flex-shrink-0">x{order.quantity}</span>
                        <span className="flex-shrink-0 ms-auto">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={10} className="flex-shrink-0 text-d-text-sub" />
                        {isLocked ? (
                          <span className="flex items-center gap-1"><span className="blur-sm select-none">0555***</span><Lock size={9} className="flex-shrink-0" /></span>
                        ) : (
                          <span className="text-d-text truncate">{order.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-d-text-sub"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {isLocked ? (
                          <span className="flex items-center gap-1"><span className="blur-sm select-none truncate">Alger, ***</span><Lock size={9} className="flex-shrink-0" /></span>
                        ) : (
                          <span className="text-d-text truncate">{order.address}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-d-border">
                      {isLocked ? (
                        <button onClick={() => setUnlockModal(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors">
                          <Coins size={13} /> {t("orders.unlock")}
                        </button>
                      ) : (
                        <>
                          <a href={`tel:${order.phone}`} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-50 text-green-700 text-[11px] font-medium hover:bg-green-100 transition-colors">
                            <Phone size={12} /> {t("orders.phone")}
                          </a>
                          <a href={`https://wa.me/${order.phone.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-colors">
                            <MessageCircle size={12} /> WhatsApp
                          </a>
                          <button onClick={() => copyPhone(order.id, order.phone)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-d-surface-secondary text-d-text-sub hover:bg-d-hover-bg transition-colors flex-shrink-0">
                            {copiedId === order.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden lg:block bg-d-surface rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="flex items-center bg-d-surface-secondary rounded-t-xl border-b border-d-border min-w-[900px]">
              <div className="w-10 shrink-0 p-2 flex items-center justify-center">
                <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-d-border text-d-text focus:ring-d-link cursor-pointer" />
              </div>
              <button onClick={() => toggleSort("product")} className="w-[160px] shrink-0 p-2.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="text-d-text text-xs font-medium">{t("orders.product")}</span>
                <ChevronsUpDown className="w-3 h-3 text-d-text-sub flex-shrink-0" />
              </button>
              <button onClick={() => toggleSort("customer")} className="w-[120px] shrink-0 p-2.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="text-d-text text-xs font-medium">{t("orders.customer")}</span>
                <ChevronsUpDown className="w-3 h-3 text-d-text-sub flex-shrink-0" />
              </button>
              <div className="w-[120px] shrink-0 p-2.5">
                <span className="text-d-text text-xs font-medium">{t("orders.phone")}</span>
              </div>
              <div className="w-[160px] shrink-0 p-2.5">
                <span className="text-d-text text-xs font-medium">{t("orders.address")}</span>
              </div>
              <button onClick={() => toggleSort("quantity")} className="w-12 shrink-0 p-2.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="text-d-text text-xs font-medium">{t("orders.quantity")}</span>
              </button>
              <button onClick={() => toggleSort("createdAt")} className="w-20 shrink-0 p-2.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="text-d-text text-xs font-medium">{t("orders.date")}</span>
                <ChevronsUpDown className="w-3 h-3 text-d-text-sub flex-shrink-0" />
              </button>
              <div className="w-28 shrink-0 p-2.5"><span className="text-d-text text-xs font-medium">{t("orders.status")}</span></div>
              <div className="w-24 shrink-0 p-2.5"><span className="text-d-text text-xs font-medium">{t("common.action")}</span></div>
            </div>

            {/* Table Rows */}
            {paginated.length === 0 ? (
              <div className="p-8 text-center text-d-text-sub text-sm">No orders match your search.</div>
            ) : (
              paginated.map((order, i) => {
                const colors = statusStyles[order.status];
                const isLocked = isFree && !order.isUnlocked;
                return (
                  <div key={order.id}>
                    {i > 0 && <div className="border-t border-d-border" />}
                    <div className="flex items-center hover:bg-d-hover-bg transition-colors min-w-[900px]">
                      <div className="w-10 shrink-0 p-2 flex items-center justify-center">
                        <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} className="w-4 h-4 rounded border-d-border text-d-text focus:ring-d-link cursor-pointer" />
                      </div>
                      <div className="w-[160px] shrink-0 p-2.5 min-w-0">
                        <p className="text-d-text text-xs font-medium truncate">{order.product.title}</p>
                        {order.variants && Object.keys(order.variants).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {Object.entries(order.variants).map(([key, val]) => (
                              <span key={key} className="bg-d-surface-secondary text-d-text-sub px-1 py-0.5 rounded text-[10px]">{key}: {val}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="w-[120px] shrink-0 p-2.5">
                        <span className="text-d-text text-xs truncate block">
                          {isLocked ? (
                            <span className="flex items-center gap-1">{order.name}<span className="blur-sm select-none">S</span><Lock size={11} className="text-d-text-sub flex-shrink-0" /></span>
                          ) : (
                            <span className="flex items-center gap-1 truncate">{order.name}{isFree && order.isUnlocked && <Unlock size={11} className="text-green-500 flex-shrink-0" />}</span>
                          )}
                        </span>
                      </div>
                      <div className="w-[120px] shrink-0 p-2.5">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-xs text-d-text-sub">
                            <span className="blur-sm select-none">0555***</span>
                            <Lock size={11} className="flex-shrink-0" />
                          </span>
                        ) : (
                          <span className="text-d-text text-xs truncate block">{order.phone}</span>
                        )}
                      </div>
                      <div className="w-[160px] shrink-0 p-2.5">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-xs text-d-text-sub">
                            <span className="blur-sm select-none truncate">Alger, ***</span>
                            <Lock size={11} className="flex-shrink-0" />
                          </span>
                        ) : (
                          <span className="text-d-text text-xs truncate block" title={order.address}>{order.address}</span>
                        )}
                      </div>
                      <div className="w-12 shrink-0 p-2.5"><span className="text-d-text text-xs">{order.quantity}</span></div>
                      <div className="w-20 shrink-0 p-2.5">
                        <span className="text-d-text text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="w-28 shrink-0 p-2.5">
                        <select
                          value={order.status}
                          onChange={(e) => { if (isFree) { e.target.value = order.status; setShowProModal(true); } else { updateStatus(order.id, e.target.value); } }}
                          disabled={updating === order.id}
                          className={`text-[11px] font-medium rounded-md px-1.5 py-1 outline-none focus:ring-2 focus:ring-d-link disabled:opacity-50 cursor-pointer border-0 appearance-none w-full ${colors.bg} ${colors.text}`}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center", paddingRight: "16px" }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="IN_DELIVERY">IN DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="RETURNED">RETURNED</option>
                        </select>
                      </div>
                      <div className="w-24 shrink-0 p-2.5">
                        {isLocked ? (
                          <button onClick={() => setUnlockModal(order)} className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-medium">
                            <Coins size={13} /> {t("orders.unlock")}
                          </button>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <a href={`tel:${order.phone}`} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-green-100 text-green-600 transition-colors" title="Call"><Phone size={13} /></a>
                            <a href={`https://wa.me/${order.phone.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-emerald-100 text-emerald-600 transition-colors" title="WhatsApp"><MessageCircle size={13} /></a>
                            <button onClick={() => copyPhone(order.id, order.phone)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-d-active-bg text-d-text-sub transition-colors" title={t("orders.copyPhone")}>
                              {copiedId === order.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-sm text-d-text-sub">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} {t("common.of")} {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="px-1.5 py-1 rounded-lg border border-d-input-border text-d-text text-xs sm:text-sm outline-none cursor-pointer"
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <StyledButton
              variant="outline"
              size="icon"
              icon={<ChevronLeft className="w-4 h-4" />}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            />
            <StyledButton
              variant="outline"
              size="icon"
              icon={<ChevronRight className="w-4 h-4" />}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            />
          </div>
        </div>
      )}

      {/* Unlock Confirmation Modal */}
      {unlockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-d-surface rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Lock size={20} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-d-text">
                  {t("orders.unlockConfirm")}
                </h3>
              </div>
              <StyledButton
                variant="ghost"
                size="icon"
                icon={<X size={20} />}
                onClick={() => setUnlockModal(null)}
              />
            </div>

            <div className="bg-d-surface-secondary rounded-xl p-4 mb-4">
              <p className="text-sm text-d-text-sub">
                Order for <strong>{unlockModal.product.title}</strong>
              </p>
            </div>

            <p className="text-sm text-d-text-sub mb-4">
              {t("orders.unlockDesc")}
            </p>

            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              <span className="text-sm text-amber-800 font-medium">{t("orders.unlockCost")}</span>
              <span className="text-sm text-amber-600">{t("orders.yourBalance")} {tokenBalance}</span>
            </div>

            {tokenBalance < 10 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">
                {t("orders.insufficientTokens")}
              </div>
            )}

            <div className="flex gap-3">
              <StyledButton
                variant="secondary"
                onClick={() => setUnlockModal(null)}
                className="flex-1"
              >
                {t("common.cancel")}
              </StyledButton>
              <StyledButton
                variant="primary"
                icon={<Coins size={16} />}
                onClick={() => handleUnlock(unlockModal)}
                disabled={unlocking || tokenBalance < 10}
                isLoading={unlocking}
                className="flex-1"
              >
                {unlocking ? t("orders.unlocking") : t("orders.unlockButton")}
              </StyledButton>
            </div>
          </div>
        </div>
      )}

      {/* PRO CTA */}
      {isFree && <ProCTA />}

      {/* PRO Upgrade Modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowProModal(false)}>
          <div className="bg-d-surface rounded-xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-d-subtle-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={22} className="text-d-text" />
            </div>
            <h3 className="text-lg font-bold text-d-text mb-2">{t("orders.proFeature")}</h3>
            <p className="text-sm text-d-text-sub mb-6">
              {t("orders.proFeatureDesc")}
            </p>
            <div className="flex gap-3">
              <StyledButton
                variant="secondary"
                onClick={() => setShowProModal(false)}
                className="flex-1"
              >
                {t("common.cancel")}
              </StyledButton>
              <StyledButton
                variant="primary"
                onClick={() => router.push("/dashboard/upgrade")}
                className="flex-1"
              >
                {t("orders.upgradeToPro")}
              </StyledButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
