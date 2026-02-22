"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Globe,
  Lock,
  X,
  ChevronDown,
  Link2,
  Check,
  ExternalLink,
  ImageIcon,
  Loader2,
  Package,
  Minus,
} from "lucide-react";
import { StyledButton } from "@/components/styled-button";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { PLAN_LIMITS } from "@/lib/auth-helpers";
import ProCTA from "@/components/pro-cta";
import { useTranslation } from "@/components/language-provider";
import { useStoreContext } from "@/lib/store-context";
import { useToast } from "@/components/toast";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number | null;
  category: string | null;
  images: string[];
  createdAt: string;
  isActive: boolean;
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  store: { id: string; name: string; slug: string };
  _count: { orders: number };
}

const ITEMS_PER_PAGE = 8;

export default function ProductsPage() {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStoreId, setImportStoreId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Inline stock edit state
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockEditQty, setStockEditQty] = useState("");
  const [stockEditCost, setStockEditCost] = useState("");
  const [stockEditSaving, setStockEditSaving] = useState(false);
  const stockEditRef = useRef<HTMLDivElement>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);

  // URL Import state
  const [showUrlImportModal, setShowUrlImportModal] = useState(false);
  const [importUrlValue, setImportUrlValue] = useState("");
  const [urlImporting, setUrlImporting] = useState(false);
  const [urlImportError, setUrlImportError] = useState("");
  const [urlImportStep, setUrlImportStep] = useState<"input" | "preview">("input");
  const [scrapedData, setScrapedData] = useState<{
    title: string | null;
    description: string | null;
    images: string[];
    siteName: string | null;
    sourceUrl: string;
    price: number | null;
  } | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedShippingFee, setEditedShippingFee] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [urlImportSuccess, setUrlImportSuccess] = useState("");
  const [importPlatform, setImportPlatform] = useState<"aliexpress" | "facebook">("aliexpress");

  const plan = session?.user?.plan || "FREE";
  const { effectivePlan } = useEffectivePlan();
  const { activeStore } = useStoreContext();
  const importRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (importRef.current && !importRef.current.contains(e.target as Node)) {
        setShowImportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleStockClickOutside = (e: MouseEvent) => {
      if (stockEditRef.current && !stockEditRef.current.contains(e.target as Node)) {
        setStockEditId(null);
      }
    };
    document.addEventListener("mousedown", handleStockClickOutside);
    return () => document.removeEventListener("mousedown", handleStockClickOutside);
  }, []);

  const handleQuickStockAdd = async (productId: string) => {
    const qty = parseInt(stockEditQty);
    const cost = parseFloat(stockEditCost);
    if (!qty || qty <= 0) return;

    setStockEditSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PURCHASE",
          quantity: qty,
          unitCost: cost || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, stockQuantity: data.stockQuantity } : p
          )
        );
        setStockEditId(null);
        setStockEditQty("");
        setStockEditCost("");
        toastSuccess(t("toast.stockUpdated"), undefined, "product");
      }
    } catch {}
    setStockEditSaving(false);
  };

  const handleToggleActive = async (product: Product) => {
    setTogglingActive(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, isActive: !p.isActive } : p
          )
        );
        toastSuccess(
          !product.isActive ? t("toast.productActivated") : t("toast.productDeactivated"),
          product.title,
          "product"
        );
      }
    } catch {}
    setTogglingActive(null);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status, router]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(id);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toastSuccess(t("toast.productDeleted"), deleteTarget.title, "delete");
    } else {
      toastError(t("toast.productDeleteFailed"));
    }
    setDeleting(null);
    setDeleteTarget(null);
  }, [deleteTarget, toastSuccess, toastError, t]);

  const limits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS];

  const checkLimit = () => {
    if (products.length >= limits.maxProducts) {
      setLimitMessage(t("products.freeLimitReached"));
      return true;
    }
    return false;
  };

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category || t("common.uncategorized");
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;

    if (activeCategory !== "all") {
      result = result.filter((p) => (p.category || t("common.uncategorized")) === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.store.name.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "price":
          cmp = (a.price || 0) - (b.price || 0);
          break;
        case "orders":
          cmp = a._count.orders - b._count.orders;
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
  }, [products, activeCategory, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const setSearchAndReset = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const setCategoryAndReset = (value: string) => {
    setActiveCategory(value);
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
      setSelectedIds(new Set(paginated.map((p) => p.id)));
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Title", "Price", "Store", "Orders", "Created"];
    const rows = filtered.map((p) => [
      p.id,
      p.title,
      p.price != null ? formatPrice(p.price) : "",
      p.store.name,
      p._count.orders.toString(),
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csv = [
      "title,description,price,category,shippingFee",
      '"Example Product","A great product",2500,"Electronics",300',
      '"Another Product","Description here",1500,"Clothing",200',
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            current += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ",") {
            fields.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
      }
      fields.push(current.trim());
      rows.push(fields);
    }
    return rows;
  };

  const openImportModal = () => {
    setShowImportDropdown(false);
    setShowImportModal(true);
    setImportError("");
    setImportSuccess("");
    setImportFile(null);
    setImportStoreId(activeStore?.id || "");
  };

  const openUrlImportModal = () => {
    setShowImportDropdown(false);
    setShowUrlImportModal(true);
    setImportUrlValue("");
    setUrlImportError("");
    setUrlImportSuccess("");
    setUrlImportStep("input");
    setScrapedData(null);
    setEditedTitle("");
    setEditedDescription("");
    setEditedPrice("");
    setEditedShippingFee("");
    setSelectedImages(new Set());
    setImportPlatform("aliexpress");
  };

  const handleUrlExtract = async () => {
    const trimmed = importUrlValue.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
      const isAli = /aliexpress\.com/i.test(trimmed);
      const isFb = /facebook\.com\/marketplace\/item\//i.test(trimmed) || /fb\.com\/marketplace\/item\//i.test(trimmed);
      if (!isAli && !isFb) {
        setUrlImportError(
          importPlatform === "facebook"
            ? t("products.importPlatform.urlPlaceholder.facebook")
            : t("products.importUrl.invalidUrl")
        );
        return;
      }
    } catch {
      setUrlImportError(t("products.importUrl.invalidUrl"));
      return;
    }

    setUrlImporting(true);
    setUrlImportError("");

    try {
      const res = await fetch("/api/products/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUrlImportError(data.error || "Failed to extract product data");
        setUrlImporting(false);
        return;
      }

      setScrapedData(data);
      setEditedTitle(data.title || "");
      setEditedDescription(data.description || "");
      setEditedPrice(data.price ? String(data.price) : "");
      setEditedShippingFee("");
      // Select all images by default
      setSelectedImages(new Set(data.images.map((_: string, i: number) => i)));
      setUrlImportStep("preview");
    } catch {
      setUrlImportError("Network error. Please try again.");
    }

    setUrlImporting(false);
  };

  const handleUrlImportConfirm = async () => {
    if (!scrapedData || !activeStore) return;

    if (!editedTitle.trim()) {
      setUrlImportError("Product title is required");
      return;
    }
    if (!editedDescription.trim()) {
      setUrlImportError("Product description is required");
      return;
    }

    setUrlImporting(true);
    setUrlImportError("");

    try {
      const imagesToImport = scrapedData.images.filter((_, i) => selectedImages.has(i));

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle.trim(),
          description: editedDescription.trim(),
          price: editedPrice ? Number(editedPrice) : null,
          shippingFee: editedShippingFee ? Number(editedShippingFee) : 0,
          images: imagesToImport,
          storeId: activeStore.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setUrlImportError(errData.error || `Failed to create product (HTTP ${res.status})`);
        setUrlImporting(false);
        return;
      }

      // Refresh products
      try {
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      } catch { /* keep existing */ }

      setUrlImportSuccess(t("products.importUrl.success"));
      setTimeout(() => setShowUrlImportModal(false), 1500);
    } catch {
      setUrlImportError("Network error. Please try again.");
    }

    setUrlImporting(false);
  };

  const handleImport = async () => {
    if (!importFile || !importStoreId) return;
    setImporting(true);
    setImportError("");
    setImportSuccess("");

    try {
      const text = await importFile.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setImportError("CSV file must have a header row and at least one data row.");
        setImporting(false);
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase().trim());
      const titleIdx = headers.indexOf("title");
      const descIdx = headers.indexOf("description");
      const priceIdx = headers.indexOf("price");
      const catIdx = headers.indexOf("category");
      const shipIdx = headers.indexOf("shippingfee");

      if (titleIdx === -1) {
        setImportError('CSV must have a "title" column.');
        setImporting(false);
        return;
      }

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const title = row[titleIdx] || "";
        if (!title) {
          errors.push(`Row ${i + 1}: Missing title, skipped.`);
          continue;
        }

        const body: Record<string, unknown> = {
          title,
          description: descIdx !== -1 ? row[descIdx] || "" : "",
          price: priceIdx !== -1 && row[priceIdx] ? Number(row[priceIdx]) : null,
          category: catIdx !== -1 ? row[catIdx] || "" : "",
          shippingFee: shipIdx !== -1 && row[shipIdx] ? Number(row[shipIdx]) : 0,
          storeId: importStoreId,
          images: [],
        };

        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            successCount++;
          } else {
            const errText = await res.text().catch(() => "");
            let errorMsg = `HTTP ${res.status}`;
            try {
              const errJson = JSON.parse(errText);
              if (errJson.error) errorMsg = errJson.error;
            } catch {
              if (errText) errorMsg = errText;
            }
            errors.push(`Row ${i + 1} ("${title}"): ${errorMsg}`);
          }
        } catch {
          errors.push(`Row ${i + 1} ("${title}"): Network error`);
        }
      }

      // Refresh products list
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch { /* keep existing list */ }

      if (successCount > 0) {
        setImportSuccess(`${successCount} product${successCount > 1 ? "s" : ""} imported successfully.`);
      }
      if (errors.length > 0) {
        setImportError(errors.join("\n"));
      }
      if (successCount > 0 && errors.length === 0) {
        setTimeout(() => setShowImportModal(false), 1500);
      }
    } catch {
      setImportError("Failed to read the CSV file.");
    }

    setImporting(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-d-surface rounded-xl shadow-card flex flex-col gap-4 sm:gap-6 overflow-hidden max-w-full">
      {/* Header */}
      <div className="relative flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:gap-3" ref={importRef}>
        {/* Search bar */}
        <div className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-d-input-border flex items-center gap-2">
          <Search className="w-4 h-4 text-d-text-sub flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchAndReset(e.target.value)}
            placeholder={t("products.searchPlaceholder")}
            className="flex-1 min-w-0 text-sm text-d-text placeholder-d-text-sub outline-none bg-transparent"
          />
        </div>

        {/* Action buttons row — stacks below search on mobile */}
        <div className="flex items-center gap-2 flex-wrap">
          <StyledButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" strokeWidth={2.5} />}
            onClick={() => {
              if (!checkLimit()) router.push("/dashboard/products/new");
            }}
          >
            {t("products.addProduct")}
          </StyledButton>
          <StyledButton
            variant="secondary"
            size="sm"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowImportDropdown((v) => !v)}
          >
            <span className="flex items-center gap-1">{t("common.import")} <ChevronDown className="w-3.5 h-3.5" /></span>
          </StyledButton>
          <StyledButton
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={exportCSV}
          >
            <span className="hidden sm:inline">{t("products.exportCSV")}</span>
          </StyledButton>
        </div>

        {/* Import dropdown */}
        {showImportDropdown && (
          <div className="absolute end-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-80 bg-d-surface rounded-xl border border-d-border shadow-lg z-30 py-2">
            <button
              onClick={openImportModal}
              className="w-full text-start px-3 py-2.5 text-sm text-d-text hover:bg-d-hover-bg transition-colors flex items-center gap-3"
            >
              <FileSpreadsheet className="w-4 h-4 text-d-text-sub flex-shrink-0" />
              CSV / Excel Import
            </button>
            <button
              onClick={() => {
                if (effectivePlan !== "PRO") {
                  setShowImportDropdown(false);
                  setLimitMessage(t("products.importUrl.title") + " — " + t("orders.proFeature") + ". " + t("orders.upgradeToPro") + ".");
                  return;
                }
                openUrlImportModal();
              }}
              className="w-full text-start px-3 py-2.5 text-sm text-d-text hover:bg-d-hover-bg transition-colors flex items-center gap-3"
            >
              <Globe className="w-4 h-4 text-d-text-sub flex-shrink-0" />
              <span className="flex-1 truncate">{t("products.importUrl.label")}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 bg-[#303030] text-white">
                <Sparkles className="w-2.5 h-2.5 text-lime-400" />
                PRO
              </span>
            </button>
            <button
              onClick={() => {
                downloadTemplate();
                setShowImportDropdown(false);
              }}
              className="w-full text-start px-3 py-2.5 text-sm text-d-text hover:bg-d-hover-bg transition-colors flex items-center gap-3"
            >
              <Download className="w-4 h-4 text-d-text-sub flex-shrink-0" />
              Download Template
            </button>
          </div>
        )}
      </div>

      {limitMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
          {limitMessage}
        </div>
      )}

      {/* Usage indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-d-text font-medium">
              {products.length} / {limits.maxProducts} products
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
              effectivePlan === "PRO"
                ? "bg-[#303030] text-white"
                : "bg-d-surface-tertiary text-d-text-sub"
            }`}>
              {effectivePlan === "PRO" && <Sparkles size={10} className="text-lime-400" />}
              {effectivePlan}
            </span>
          </div>
          <div className="h-2 bg-d-surface-tertiary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((products.length / limits.maxProducts) * 100, 100)}%`,
                backgroundColor: products.length >= limits.maxProducts ? "#ef4444" : "var(--d-text)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <>
          {/* Mobile: dropdown */}
          <div className="sm:hidden">
            <select
              value={activeCategory}
              onChange={(e) => setCategoryAndReset(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-d-input-border bg-d-input-bg text-sm text-d-text font-medium focus:outline-none focus:ring-1 focus:ring-d-link appearance-none"
            >
              <option value="all">All ({products.length})</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
              ))}
            </select>
          </div>
          {/* Desktop: tabs */}
          <div className="hidden sm:block">
            <div className="px-3 py-2 bg-d-surface rounded-xl border border-d-border flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setCategoryAndReset("all")}
                className={`flex-1 px-1.5 py-1.5 rounded-lg text-sm font-bold text-center transition-colors whitespace-nowrap ${
                  activeCategory === "all"
                    ? "bg-d-surface-tertiary text-d-text font-[550]"
                    : "text-d-text-sub hover:text-d-text"
                }`}
              >
                All ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCategoryAndReset(c.name)}
                  className={`flex-1 px-1.5 py-1.5 rounded-lg text-sm font-bold text-center transition-colors whitespace-nowrap ${
                    activeCategory === c.name
                      ? "bg-d-surface-tertiary text-d-text font-[550]"
                      : "text-d-text-sub hover:text-d-text"
                  }`}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Table */}
      {products.length === 0 ? (
        <div className="bg-d-surface rounded-xl shadow-card p-8 text-center">
          <p className="text-d-text-sub mb-4">{t("products.noProducts")}</p>
          <Link
            href="/dashboard/products/new"
            className="text-d-link hover:underline"
          >
            {t("products.noProductsDesc")}
          </Link>
        </div>
      ) : (
        <>
          {/* ── Mobile Cards ── */}
          <div className="lg:hidden space-y-3">
            {paginated.length === 0 ? (
              <div className="p-6 text-center text-d-text-sub text-sm">No products match your search.</div>
            ) : (
              paginated.map((product) => (
                <div key={product.id} className="bg-d-surface rounded-xl border border-d-border p-3.5 space-y-3">
                  {/* Top: image + title + toggle */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-d-surface-secondary rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {Array.isArray(product.images) && product.images.length > 0 ? (
                        <Image src={product.images[0]} alt={product.title} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-d-text-muted text-[9px]">{t("common.noImg")}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-d-text truncate">{product.title}</p>
                      <p className="text-xs text-d-text-sub mt-0.5">
                        {product.price != null ? formatPrice(product.price) : "\u2014"}
                        <span className="mx-1.5">&middot;</span>
                        {product._count.orders} {t("products.orders")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(product); }}
                      disabled={togglingActive === product.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 mt-0.5 ${togglingActive === product.id ? "opacity-50" : ""} ${product.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${product.isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                    </button>
                  </div>

                  {/* Stock + date row */}
                  <div className="flex items-center gap-2 text-xs text-d-text-sub">
                    {product.trackStock ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        product.stockQuantity === 0 ? "bg-red-50 text-red-600" : product.stockQuantity <= product.lowStockThreshold ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                      }`}>
                        <Package className="w-3 h-3" />{product.stockQuantity}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-d-surface-secondary text-[11px]"><Minus className="w-3 h-3" />{t("products.noTracking")}</span>
                    )}
                    <span className={`text-[11px] font-medium ${product.isActive ? (product.price != null ? "text-green-600" : "text-amber-500") : "text-d-text-sub"}`}>
                      {product.isActive ? (product.price != null ? t("common.published") : t("common.draft")) : t("common.inactive")}
                    </span>
                    <span className="ml-auto text-[11px]">
                      {new Date(product.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-d-border">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-d-surface-secondary text-d-text text-xs font-medium hover:bg-d-hover-bg transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> {t("header.edit")}
                    </Link>
                    <Link href={`/product/${product.slug}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-d-surface-secondary text-d-text-sub hover:bg-d-hover-bg transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      title="Copy link"
                      onClick={() => {
                        const url = `${window.location.origin}/product/${product.slug}`;
                        if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(url); } else {
                          const ta = document.createElement("textarea"); ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                        }
                        toastSuccess(t("toast.linkCopied"), undefined, "copy");
                        setCopiedId(product.id); setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-d-surface-secondary text-d-text-sub hover:bg-d-hover-bg transition-colors"
                    >
                      {copiedId === product.id ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      disabled={deleting === product.id}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden lg:block bg-d-surface rounded-xl shadow-card overflow-x-auto">
            {/* Table Header */}
            <div className="flex items-center bg-d-surface-secondary rounded-t-xl border-b border-d-border">
              <div className="w-12 shrink-0 p-3 flex items-center">
                <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-d-border text-d-text focus:ring-d-link cursor-pointer" />
              </div>
              <button onClick={() => toggleSort("title")} className="w-64 shrink-0 p-3.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="flex-1 text-d-text text-sm font-medium">{t("products.product")}</span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <button onClick={() => toggleSort("price")} className="w-28 shrink-0 p-3.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="flex-1 text-d-text text-sm font-medium">{t("products.price")}</span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <button onClick={() => toggleSort("orders")} className="w-24 shrink-0 p-3.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="flex-1 text-d-text text-sm font-medium">{t("products.orders")}</span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <div className="w-32 shrink-0 p-3.5"><span className="text-d-text text-sm font-medium">{t("products.stock")}</span></div>
              <button onClick={() => toggleSort("createdAt")} className="w-36 shrink-0 p-3.5 flex items-center gap-1 text-start hover:bg-d-active-bg transition-colors">
                <span className="flex-1 text-d-text text-sm font-medium">{t("products.date")}</span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-d-text-sub" />
              </button>
              <div className="w-28 shrink-0 p-3.5"><span className="text-d-text text-sm font-medium">{t("products.status")}</span></div>
              <div className="flex-1 p-3.5"><span className="text-d-text text-sm font-medium">{t("products.action")}</span></div>
            </div>

            {/* Table Rows */}
            {paginated.length === 0 ? (
              <div className="p-8 text-center text-d-text-sub text-sm">No products match your search.</div>
            ) : (
              paginated.map((product, i) => (
                <div key={product.id}>
                  {i > 0 && <div className="border-t border-d-border" />}
                  <div className="flex items-center hover:bg-d-hover-bg transition-colors">
                    <div className="w-12 shrink-0 p-3 flex items-center">
                      <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 rounded border-d-border text-d-text focus:ring-d-link cursor-pointer" />
                    </div>
                    <div className="w-64 shrink-0 p-3 flex items-center gap-2">
                      <div className="w-10 h-10 bg-d-surface-secondary rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {Array.isArray(product.images) && product.images.length > 0 ? (
                          <Image src={product.images[0]} alt={product.title} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-d-text-muted text-[10px]">{t("common.noImg")}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-d-link text-xs truncate">{product.id.slice(0, 8)}</span>
                        <span className="text-d-text text-sm truncate">{product.title}</span>
                      </div>
                    </div>
                    <div className="w-28 shrink-0 p-3"><span className="text-d-text text-sm">{product.price != null ? formatPrice(product.price) : "\u2014"}</span></div>
                    <div className="w-24 shrink-0 p-3"><span className="text-d-text text-sm">{product._count.orders}</span></div>
                    <div className="w-32 shrink-0 p-3 relative">
                      {product.trackStock ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setStockEditId(stockEditId === product.id ? null : product.id); setStockEditQty(""); setStockEditCost(""); }}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:ring-2 hover:ring-d-border ${product.stockQuantity === 0 ? "bg-red-50 text-red-600 hover:bg-red-100" : product.stockQuantity <= product.lowStockThreshold ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                          <Package className="w-3 h-3" />{product.stockQuantity}<Plus className="w-3 h-3 opacity-50" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-d-surface-secondary text-[11px] text-d-text-sub"><Minus className="w-3 h-3" />{t("products.noTracking")}</span>
                      )}
                      {stockEditId === product.id && product.trackStock && (
                        <div ref={stockEditRef} className="absolute top-full start-0 mt-1 z-20 bg-d-surface rounded-xl border border-d-border shadow-lg p-3 w-56" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-d-text">{t("products.form.addStock")}</p>
                            <button onClick={() => setStockEditId(null)} className="text-d-text-sub hover:text-d-text"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="flex gap-1.5 mb-2">
                            <input type="number" min="1" value={stockEditQty} onChange={(e) => setStockEditQty(e.target.value)} placeholder={t("products.form.quantity")} className="flex-1 bg-d-input-bg border border-d-input-border rounded-lg px-2 py-1.5 text-xs text-d-text focus:outline-none focus:ring-1 focus:ring-d-link" autoFocus />
                            <input type="number" min="0" step="0.01" value={stockEditCost} onChange={(e) => setStockEditCost(e.target.value)} placeholder="DA" className="w-20 bg-d-input-bg border border-d-input-border rounded-lg px-2 py-1.5 text-xs text-d-text focus:outline-none focus:ring-1 focus:ring-d-link" />
                          </div>
                          <button onClick={() => handleQuickStockAdd(product.id)} disabled={stockEditSaving || !stockEditQty} className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-white bg-d-text hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1">
                            <Plus className="w-3 h-3" />{stockEditSaving ? "..." : t("products.form.addStock")}
                          </button>
                          <a href={`/dashboard/products/${product.id}/edit`} className="block text-center text-[11px] text-d-link hover:underline mt-1.5">{t("products.form.recentMovements")} →</a>
                        </div>
                      )}
                    </div>
                    <div className="w-36 shrink-0 p-3">
                      <span className="text-d-text text-sm leading-5">
                        {new Date(product.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                        <br /><span className="text-d-text-sub text-xs">at {new Date(product.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                      </span>
                    </div>
                    <div className="w-28 shrink-0 p-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleActive(product); }} disabled={togglingActive === product.id}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${togglingActive === product.id ? "opacity-50" : ""} ${product.isActive ? "bg-green-500" : "bg-gray-300"}`} title={product.isActive ? t("common.active") : t("common.inactive")}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${product.isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                        </button>
                        {product.isActive ? (product.price != null ? <span className="text-[11px] font-medium text-green-600">{t("common.published")}</span> : <span className="text-[11px] font-medium text-amber-500">{t("common.draft")}</span>) : <span className="text-[11px] font-medium text-d-text-sub">{t("common.inactive")}</span>}
                      </div>
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/product/${product.slug}`} className="text-d-text-sub hover:text-d-link transition-colors"><Eye className="w-5 h-5" /></Link>
                        <button title="Copy public link" onClick={() => { const url = `${window.location.origin}/product/${product.slug}`; if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(url); } else { const ta = document.createElement("textarea"); ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); } setCopiedId(product.id); setTimeout(() => setCopiedId(null), 2000); }} className="text-d-text-sub hover:text-d-link transition-colors">
                          {copiedId === product.id ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                        </button>
                        <Link href={`/dashboard/products/${product.id}/edit`} className="text-d-text-sub hover:text-d-link transition-colors"><Pencil className="w-4 h-4" /></Link>
                        <StyledButton variant="danger" size="icon" icon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteTarget(product)} disabled={deleting === product.id} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-d-text font-semibold">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>
            <span className="text-d-text-sub">-</span>
            <span className="text-d-text-sub">
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>
            <span className="text-d-text-sub">of {totalPages} Pages</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-d-text text-sm">Page</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="ps-2 pe-1 py-1 rounded-lg border border-d-input-border text-d-text text-sm outline-none cursor-pointer"
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
                icon={<ChevronLeft className="w-5 h-5" />}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              />
              <StyledButton
                variant="outline"
                size="icon"
                icon={<ChevronRight className="w-5 h-5" />}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              />
            </div>
          </div>
        </div>
      )}
      {/* PRO CTA */}
      {effectivePlan === "FREE" && (
        <div className="mt-6">
          <ProCTA />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-d-surface rounded-xl border border-d-border shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-d-text">{t("products.deleteTitle")}</h3>
            </div>

            <p className="text-sm text-d-text-sub mb-2">
              {t("products.deleteMessage")}
            </p>
            <div className="bg-d-surface-secondary rounded-lg px-3 py-2 mb-5">
              <p className="text-sm font-medium text-d-text truncate">{deleteTarget.title}</p>
              {deleteTarget._count.orders > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {deleteTarget._count.orders} {t("products.deleteOrdersWarning")}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <StyledButton
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                className="flex-1"
              >
                {t("common.cancel")}
              </StyledButton>
              <StyledButton
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={confirmDelete}
                disabled={deleting === deleteTarget.id}
                isLoading={deleting === deleteTarget.id}
                className="flex-1"
              >
                {deleting === deleteTarget.id ? t("common.deleting") : t("common.delete")}
              </StyledButton>
            </div>
          </div>
        </div>
      )}

      {/* URL Import Modal */}
      {showUrlImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-d-surface rounded-xl border border-d-border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-d-border sticky top-0 bg-d-surface rounded-t-xl z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-d-text font-semibold text-lg">
                  {urlImportStep === "input" ? t("products.importUrl.title") : t("products.importUrl.preview")}
                </h2>
                <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  {t("products.importUrl.beta")}
                </span>
              </div>
              <button
                onClick={() => setShowUrlImportModal(false)}
                className="text-d-text-sub hover:text-d-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {urlImportStep === "input" ? (
                <>
                  {/* Platform selector */}
                  <div>
                    <label className="block text-sm font-medium text-d-text mb-2">
                      {t("products.importUrl.source")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setImportPlatform("aliexpress"); setImportUrlValue(""); setUrlImportError(""); }}
                        className={`flex-1 rounded-lg px-3 py-2.5 flex items-center gap-2 transition-all border-2 ${
                          importPlatform === "aliexpress"
                            ? "border-[#E62E04] bg-orange-50 ring-1 ring-[#E62E04]/30"
                            : "border-d-border bg-d-surface-secondary hover:border-d-text-sub"
                        }`}
                      >
                        <Link2 className="w-4 h-4 text-[#E62E04] flex-shrink-0" />
                        <span className="text-sm font-medium text-d-text">{t("products.importPlatform.aliexpress")}</span>
                        {importPlatform === "aliexpress" && <Check className="w-4 h-4 text-[#E62E04] ml-auto" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImportPlatform("facebook"); setImportUrlValue(""); setUrlImportError(""); }}
                        className={`flex-1 rounded-lg px-3 py-2.5 flex items-center gap-2 transition-all border-2 ${
                          importPlatform === "facebook"
                            ? "border-[#1877F2] bg-blue-50 ring-1 ring-[#1877F2]/30"
                            : "border-d-border bg-d-surface-secondary hover:border-d-text-sub"
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span className="text-sm font-medium text-d-text">{t("products.importPlatform.facebook")}</span>
                        {importPlatform === "facebook" && <Check className="w-4 h-4 text-[#1877F2] ml-auto" />}
                      </button>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-d-text mb-1.5">
                      URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={importUrlValue}
                      onChange={(e) => {
                        setImportUrlValue(e.target.value);
                        setUrlImportError("");
                      }}
                      placeholder={importPlatform === "facebook" ? t("products.importPlatform.urlPlaceholder.facebook") : t("products.importUrl.urlPlaceholder")}
                      className="w-full px-3 py-2.5 rounded-lg border border-d-input-border text-sm text-d-text placeholder-d-text-sub outline-none bg-transparent focus:border-d-text transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !urlImporting) handleUrlExtract();
                      }}
                    />
                  </div>

                  {/* Error */}
                  {urlImportError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                      {urlImportError}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Preview step */}
                  {scrapedData && (
                    <>
                      {/* Source badge */}
                      <div className="flex items-center gap-2 text-xs text-d-text-sub">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="font-medium">{scrapedData.siteName}</span>
                        <span className="mx-1">-</span>
                        <a
                          href={scrapedData.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-d-link hover:underline truncate max-w-[250px] inline-flex items-center gap-1"
                        >
                          {new URL(scrapedData.sourceUrl).hostname}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>

                      <p className="text-xs text-d-text-sub">
                        {t("products.importUrl.editBeforeImport")}
                      </p>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-d-text mb-1.5">
                          {t("products.form.productTitle")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-d-input-border text-sm text-d-text outline-none bg-transparent focus:border-d-text transition-colors"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-d-text mb-1.5">
                          {t("products.form.description")} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-d-input-border text-sm text-d-text outline-none bg-transparent focus:border-d-text transition-colors resize-y"
                        />
                      </div>

                      {/* Price */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-d-text mb-1.5">
                            {t("products.form.price")}
                          </label>
                          <input
                            type="number"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full px-3 py-2 rounded-lg border border-d-input-border text-sm text-d-text outline-none bg-transparent focus:border-d-text transition-colors"
                          />
                          <p className="text-xs text-d-text-sub mt-1">{t("products.importUrl.priceNote")}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-d-text mb-1.5">
                            {t("public.shipping")}
                          </label>
                          <input
                            type="number"
                            value={editedShippingFee}
                            onChange={(e) => setEditedShippingFee(e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full px-3 py-2 rounded-lg border border-d-input-border text-sm text-d-text outline-none bg-transparent focus:border-d-text transition-colors"
                          />
                        </div>
                      </div>

                      {/* Images */}
                      <div>
                        <label className="block text-sm font-medium text-d-text mb-1.5">
                          {t("products.importUrl.extractedImages")} ({selectedImages.size}/{scrapedData.images.length})
                        </label>
                        {scrapedData.images.length === 0 ? (
                          <div className="text-sm text-d-text-sub bg-d-surface-secondary rounded-lg px-3 py-4 text-center flex items-center justify-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {t("products.importUrl.noImages")}
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {scrapedData.images.map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedImages((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(idx)) next.delete(idx);
                                    else next.add(idx);
                                    return next;
                                  });
                                }}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImages.has(idx)
                                    ? "border-d-text ring-1 ring-d-text"
                                    : "border-d-border opacity-40"
                                }`}
                              >
                                <img
                                  src={img}
                                  alt={`Product ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {selectedImages.has(idx) && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-d-text rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-d-surface" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Error */}
                      {urlImportError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                          {urlImportError}
                        </div>
                      )}

                      {/* Success */}
                      {urlImportSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                          {urlImportSuccess}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-d-border sticky bottom-0 bg-d-surface rounded-b-xl">
              {urlImportStep === "preview" && (
                <StyledButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUrlImportStep("input");
                    setUrlImportError("");
                    setUrlImportSuccess("");
                  }}
                >
                  {t("common.back")}
                </StyledButton>
              )}
              <StyledButton
                variant="outline"
                size="sm"
                onClick={() => setShowUrlImportModal(false)}
              >
                {t("common.cancel")}
              </StyledButton>
              {urlImportStep === "input" ? (
                <StyledButton
                  variant="primary"
                  size="sm"
                  icon={urlImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  onClick={handleUrlExtract}
                  disabled={!importUrlValue.trim() || urlImporting}
                  className={
                    urlImporting
                      ? "animate-pulse"
                      : importUrlValue.trim()
                        ? "animate-[subtle-bounce_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(120,200,80,0.3)] hover:shadow-[0_0_20px_rgba(120,200,80,0.5)] transition-shadow"
                        : ""
                  }
                >
                  {urlImporting ? t("products.importUrl.extracting") : t("products.importUrl.submit")}
                </StyledButton>
              ) : (
                <StyledButton
                  variant="primary"
                  size="sm"
                  icon={urlImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : urlImportSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  onClick={handleUrlImportConfirm}
                  disabled={urlImporting || !!urlImportSuccess}
                  className={
                    urlImporting
                      ? "animate-pulse"
                      : urlImportSuccess
                        ? "!bg-green-600 !from-green-500 !to-green-600 !border-green-700"
                        : "animate-[subtle-bounce_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(120,200,80,0.3)] hover:shadow-[0_0_20px_rgba(120,200,80,0.5)] transition-shadow"
                  }
                >
                  {urlImporting ? t("products.importUrl.importing") : urlImportSuccess ? t("products.importUrl.success") : t("products.importUrl.confirm")}
                </StyledButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-d-surface rounded-xl border border-d-border shadow-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-d-border">
              <h2 className="text-d-text font-semibold text-lg">{t("products.import.title")}</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-d-text-sub hover:text-d-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-d-text mb-1.5">
                  {t("products.import.selectFile")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setImportError("");
                    setImportSuccess("");
                  }}
                  className="w-full text-sm text-d-text file:me-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-d-input-border file:text-sm file:font-medium file:bg-d-surface-secondary file:text-d-text hover:file:bg-d-hover-bg file:cursor-pointer file:transition-colors"
                />
                <p className="text-xs text-d-text-sub mt-1">
                  {t("products.import.format")}
                </p>
              </div>

              {/* File Preview */}
              {importFile && (
                <div className="text-sm text-d-text-sub bg-d-surface-secondary rounded-lg px-3 py-2">
                  Selected: <span className="font-medium text-d-text">{importFile.name}</span>
                  <span className="ms-2">({(importFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              {/* Error Message */}
              {importError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm whitespace-pre-wrap">
                  {importError}
                </div>
              )}

              {/* Success Message */}
              {importSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                  {importSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-d-border">
              <StyledButton
                variant="outline"
                size="sm"
                onClick={() => setShowImportModal(false)}
              >
                {t("common.cancel")}
              </StyledButton>
              <StyledButton
                variant="primary"
                size="sm"
                icon={importing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                onClick={handleImport}
                disabled={!importFile || importing}
              >
                {importing ? t("products.import.importing") : t("products.import.submit")}
              </StyledButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
