"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import BlockEditor from "@/components/block-editor";
import { Upload, X, Plus, Tag, Percent, Package } from "lucide-react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

interface VariationOption {
  value: string;
  priceAdjustment: number;
  color?: string;
}

interface Variation {
  name: string;
  type?: "text" | "color";
  options: VariationOption[];
}

interface Promotion {
  type: "buy_x_get_y" | "buy_x_discount" | "percentage_discount" | "fixed_discount";
  buyQuantity?: number;
  getQuantity?: number;
  discountPercent?: number;
  fixedDiscount?: number;
  label: string;
}

export default function EditProductPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeId, setStoreId] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [useBlocks, setUseBlocks] = useState(true);
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoType, setPromoType] = useState<"buy_x_get_y" | "buy_x_discount" | "percentage_discount" | "fixed_discount">("buy_x_get_y");
  const [promoBuyQty, setPromoBuyQty] = useState(2);
  const [promoGetQty, setPromoGetQty] = useState(1);
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoFixedAmount, setPromoFixedAmount] = useState(500);
  const [shippingFee, setShippingFee] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [trackStock, setTrackStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [costPrice, setCostPrice] = useState<number | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [valuationMethod, setValuationMethod] = useState<"PMP" | "FIFO" | "LIFO">("PMP");
  const [addStockQty, setAddStockQty] = useState("");
  const [addStockCost, setAddStockCost] = useState("");
  const [addStockNote, setAddStockNote] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const [recentMovements, setRecentMovements] = useState<Array<{
    id: string;
    type: string;
    quantity: number;
    unitCost: number | null;
    createdAt: string;
    note: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const userPlan = (session?.user as { plan?: string } | undefined)?.plan || "FREE";

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/auth/login"); return; }

    fetch("/api/products").then((r) => r.json()).then((productsData) => {
      const product = Array.isArray(productsData)
        ? productsData.find((p: { id: string }) => p.id === id)
        : null;
      if (product) {
        setTitle(product.title);
        setDescription(product.description);
        setPrice(product.price != null ? String(product.price) : "");
        setImages(Array.isArray(product.images) ? product.images : []);
        setStoreId(product.storeId || product.store?.id || "");
        setCategory(product.category || "");
        if (Array.isArray(product.variations)) {
          setVariations(product.variations);
        }
        if (Array.isArray(product.promotions)) {
          setPromotions(product.promotions);
        }
        if (product.shippingFee != null) {
          setShippingFee(String(product.shippingFee));
        }
        if (product.isActive !== undefined) setIsActive(product.isActive);
        if (product.trackStock !== undefined) setTrackStock(product.trackStock);
        if (product.stockQuantity !== undefined) setStockQuantity(product.stockQuantity);
        if (product.costPrice != null) setCostPrice(product.costPrice);
        if (product.lowStockThreshold !== undefined) setLowStockThreshold(product.lowStockThreshold);
        if (product.valuationMethod) setValuationMethod(product.valuationMethod);
        if (product.contentBlocks) {
          if (typeof product.contentBlocks === "string") {
            setContentHtml(product.contentBlocks);
          } else if (Array.isArray(product.contentBlocks) && product.contentBlocks.length > 0) {
            const legacyHtml = product.contentBlocks
              .map((b: { type: string; content?: string; heading?: string; items?: string[]; style?: string }) => {
                if (b.type === "text") {
                  const tag = b.heading || "p";
                  return `<${tag}>${b.content || ""}</${tag}>`;
                }
                if (b.type === "list") {
                  const tag = b.style === "numbered" ? "ol" : "ul";
                  const items = (b.items || []).map((item: string) => `<li>${item}</li>`).join("");
                  return `<${tag}>${items}</${tag}>`;
                }
                if (b.type === "divider") return "<hr>";
                return "";
              })
              .filter(Boolean)
              .join("");
            setContentHtml(legacyHtml);
          }
          setUseBlocks(true);
        }
        // Fetch stock movements
        fetch(`/api/products/${id}/stock`).then((r) => r.json()).then((stockData) => {
          if (stockData.movements) {
            setRecentMovements(stockData.movements.slice(0, 5));
          }
          if (stockData.stockQuantity !== undefined) setStockQuantity(stockData.stockQuantity);
          if (stockData.costPrice != null) setCostPrice(stockData.costPrice);
        }).catch(() => {});
      } else {
        setError(t("products.form.productNotFound"));
      }
      setLoading(false);
    }).catch(() => {
      setError(t("products.form.failedToLoad"));
      setLoading(false);
    });
  }, [session, status, router, id]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { setError("File too large. Max 5MB"); return; }

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
        setImages((prev) => [...prev, data.url]);
      }
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const handleImageUploadForBlock = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) return null;
    if (file.size > 5 * 1024 * 1024) return null;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok && data.url) return data.url;
    } catch {}
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariation = () => {
    setVariations([...variations, { name: "", type: "text", options: [{ value: "", priceAdjustment: 0 }] }]);
  };

  const toggleVariationType = (index: number) => {
    const updated = [...variations];
    updated[index].type = updated[index].type === "color" ? "text" : "color";
    if (updated[index].type === "color") {
      updated[index].options = updated[index].options.map((opt) => ({
        ...opt,
        color: opt.color || "#000000",
      }));
    }
    setVariations(updated);
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const updateVariationName = (index: number, name: string) => {
    const updated = [...variations];
    updated[index].name = name;
    setVariations(updated);
  };

  const addOption = (varIndex: number) => {
    const updated = [...variations];
    const isColor = updated[varIndex].type === "color";
    updated[varIndex].options.push({ value: "", priceAdjustment: 0, ...(isColor ? { color: "#000000" } : {}) });
    setVariations(updated);
  };

  const removeOption = (varIndex: number, optIndex: number) => {
    const updated = [...variations];
    updated[varIndex].options = updated[varIndex].options.filter((_, i) => i !== optIndex);
    setVariations(updated);
  };

  const updateOption = (varIndex: number, optIndex: number, field: "value" | "priceAdjustment" | "color", val: string) => {
    const updated = [...variations];
    if (field === "priceAdjustment") {
      updated[varIndex].options[optIndex].priceAdjustment = parseFloat(val) || 0;
    } else if (field === "color") {
      updated[varIndex].options[optIndex].color = val;
    } else {
      updated[varIndex].options[optIndex].value = val;
    }
    setVariations(updated);
  };

  const addPromotion = () => {
    let label = "";
    let promo: Promotion;
    if (promoType === "buy_x_get_y") {
      label = `Buy ${promoBuyQty} Get ${promoGetQty} Free`;
      promo = { type: promoType, buyQuantity: promoBuyQty, getQuantity: promoGetQty, label };
    } else if (promoType === "buy_x_discount") {
      label = `Buy ${promoBuyQty} Get ${promoDiscount}% Off`;
      promo = { type: promoType, buyQuantity: promoBuyQty, discountPercent: promoDiscount, label };
    } else if (promoType === "percentage_discount") {
      label = `${promoDiscount}% Off`;
      promo = { type: promoType, discountPercent: promoDiscount, label };
    } else {
      label = `${promoFixedAmount} DA Off`;
      promo = { type: promoType, fixedDiscount: promoFixedAmount, label };
    }
    setPromotions([...promotions, promo]);
    setShowPromoForm(false);
    setPromoBuyQty(2);
    setPromoGetQty(1);
    setPromoDiscount(10);
    setPromoFixedAmount(500);
  };

  const removePromotion = (index: number) => {
    setPromotions(promotions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const cleanVariations = variations
      .filter((v) => v.name.trim() && v.options.some((o) => o.value.trim()))
      .map((v) => ({
        name: v.name.trim(),
        ...(v.type === "color" ? { type: "color" as const } : {}),
        options: v.options.filter((o) => o.value.trim()),
      }));

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: useBlocks ? (description || title) : description,
        price,
        images,
        storeId,
        category: category.trim() || null,
        variations: cleanVariations.length > 0 ? cleanVariations : null,
        promotions: promotions.length > 0 ? promotions : null,
        contentBlocks: useBlocks && contentHtml ? contentHtml : null,
        shippingFee: shippingFee ? shippingFee : null,
        isActive,
        trackStock,
        lowStockThreshold,
        valuationMethod,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      router.push("/dashboard/products");
    }
  };

  const handleAddStock = async () => {
    const qty = parseInt(addStockQty);
    const cost = parseFloat(addStockCost);
    if (!qty || qty <= 0) return;
    if (!cost && cost !== 0) return;

    setAddingStock(true);
    try {
      const res = await fetch(`/api/products/${id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PURCHASE",
          quantity: qty,
          unitCost: cost,
          note: addStockNote || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStockQuantity(data.stockQuantity);
        setCostPrice(data.costPrice);
        setAddStockQty("");
        setAddStockCost("");
        setAddStockNote("");
        // Refresh movements
        const stockRes = await fetch(`/api/products/${id}/stock`);
        const stockData = await stockRes.json();
        if (stockData.movements) setRecentMovements(stockData.movements.slice(0, 5));
      }
    } catch {}
    setAddingStock(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-d-text-sub">Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-d-text">{t("products.edit.title")}</h1>
          <p className="text-d-text-sub text-[13px] mt-1">{t("products.form.description")}</p>
        </div>
        <div className="flex gap-3">
          <StyledButton
            variant="secondary"
            type="button"
            onClick={() => router.push("/dashboard/products")}
          >
            {t("common.cancel")}
          </StyledButton>
          <StyledButton
            variant="primary"
            type="submit"
            disabled={saving || uploading}
            isLoading={saving}
          >
            {saving ? t("common.saving") : t("products.form.updateProduct")}
          </StyledButton>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* ─── Left Column ─── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Images Card */}
          <div className="bg-d-surface rounded-xl shadow-card p-4">
            <h3 className="text-base font-semibold text-d-text mb-4">{t("products.form.images")}</h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group ${
                dragOver ? "border-d-text bg-d-surface-tertiary" : "border-d-border bg-d-surface-secondary hover:bg-d-active-bg hover:border-d-input-border"
              }`}
            >
              {images.length > 0 ? (
                <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-d-surface shadow-sm flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[0]}
                    alt="Product preview"
                    className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                  />
                </div>
              ) : uploading ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-d-text border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-d-text">Uploading...</p>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-d-text-muted" />
                  <p className="text-sm text-d-text-sub text-center">Drag & drop or click to upload</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-[11px] text-d-text-sub">
              PNG, JPG, WebP, GIF. Max 5MB each.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(uploadFile);
                e.target.value = "";
              }}
            />

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {images.map((url, i) => (
                  <div key={i} className="relative group/img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Image ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border border-d-border" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-d-border flex items-center justify-center text-d-text-sub hover:border-d-text hover:text-d-text transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Category Card */}
          <div className="bg-d-surface rounded-xl shadow-card p-4">
            <h3 className="text-base font-semibold text-d-text mb-4">{t("products.form.category")}</h3>
            <div className="space-y-2">
              <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">{t("products.form.category")}</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-d-input-bg border border-d-input-border rounded-lg px-3 py-1.5 text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                placeholder={t("products.form.categoryPlaceholder")}
              />
              <p className="text-[11px] text-d-text-sub">Optional. Helps organize your products.</p>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-d-surface rounded-xl shadow-card overflow-hidden">
            {/* Active Status Bar */}
            <div className={`px-4 py-3 flex items-center justify-between transition-colors ${isActive ? "bg-green-50" : "bg-gray-50"}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                <span className={`text-[13px] font-semibold ${isActive ? "text-green-700" : "text-gray-500"}`}>
                  {isActive ? t("common.active") : t("common.inactive")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
              </button>
            </div>
            <div className="px-4 pb-3 pt-2">
              <p className="text-[11px] text-d-text-sub">{t("products.form.productActiveDesc")}</p>
            </div>
          </div>

          {/* Stock Management Card */}
          <div className="bg-d-surface rounded-xl shadow-card overflow-hidden">
            {/* Track Stock Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-d-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-d-text" />
                <span className="text-[13px] font-semibold text-d-text">{t("products.form.trackStock")}</span>
              </div>
              <button
                type="button"
                onClick={() => setTrackStock(!trackStock)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${trackStock ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${trackStock ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
              </button>
            </div>

            {!trackStock ? (
              <div className="px-4 py-4 text-center">
                <p className="text-[11px] text-d-text-sub">{t("products.form.trackStockDesc")}</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Stock Overview */}
                <div className={`rounded-xl p-4 ${
                  stockQuantity === 0 ? "bg-red-50" :
                  stockQuantity <= lowStockThreshold ? "bg-amber-50" :
                  "bg-green-50"
                }`}>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-[10px] uppercase font-semibold tracking-wider ${
                        stockQuantity === 0 ? "text-red-400" :
                        stockQuantity <= lowStockThreshold ? "text-amber-400" :
                        "text-green-400"
                      }`}>
                        {stockQuantity === 0 ? t("products.form.outOfStock") :
                         stockQuantity <= lowStockThreshold ? t("products.form.lowStock") :
                         t("products.form.inStock")}
                      </p>
                      <p className={`text-3xl font-bold mt-0.5 ${
                        stockQuantity === 0 ? "text-red-600" :
                        stockQuantity <= lowStockThreshold ? "text-amber-600" :
                        "text-green-600"
                      }`}>
                        {stockQuantity}
                      </p>
                      <p className={`text-[11px] ${
                        stockQuantity === 0 ? "text-red-500" :
                        stockQuantity <= lowStockThreshold ? "text-amber-500" :
                        "text-green-500"
                      }`}>{t("products.form.unitsInStock")}</p>
                    </div>
                    {costPrice != null && costPrice > 0 && (
                      <div className="text-end">
                        <p className="text-[10px] text-d-text-sub uppercase tracking-wider">{t("products.form.avgCost")}</p>
                        <p className="text-lg font-bold text-d-text">{costPrice.toFixed(0)} DA</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Add Stock */}
                <div className="bg-d-surface-secondary rounded-xl p-3 space-y-2.5">
                  <p className="text-[12px] font-semibold text-d-text flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    {t("products.form.addStock")}
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={addStockQty}
                      onChange={(e) => setAddStockQty(e.target.value)}
                      placeholder={t("products.form.quantity")}
                      className="flex-1 bg-d-input-bg border border-d-input-border rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-d-link text-d-text"
                    />
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={addStockCost}
                        onChange={(e) => setAddStockCost(e.target.value)}
                        placeholder={t("products.form.unitCost")}
                        className="w-full bg-d-input-bg border border-d-input-border rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-d-link text-d-text pe-8"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-d-text-sub">DA</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={addStockNote}
                    onChange={(e) => setAddStockNote(e.target.value)}
                    placeholder={t("products.form.notePlaceholder")}
                    className="w-full bg-d-input-bg border border-d-input-border rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-d-link text-d-text"
                  />
                  <button
                    type="button"
                    onClick={handleAddStock}
                    disabled={addingStock || !addStockQty || !addStockCost}
                    className="w-full px-3 py-2 rounded-lg text-[12px] font-semibold text-white bg-d-text hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" />
                    {addingStock ? "..." : t("products.form.addStock")}
                  </button>
                </div>

                {/* Recent Movements */}
                {recentMovements.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-d-text mb-2">{t("products.form.recentMovements")}</p>
                    <div className="space-y-1">
                      {recentMovements.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-d-surface-secondary transition-colors">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            m.type === "PURCHASE" ? "bg-green-100 text-green-600" :
                            m.type === "SALE" ? "bg-red-100 text-red-600" :
                            m.type === "RETURN" ? "bg-blue-100 text-blue-600" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {m.type === "SALE" ? "-" : "+"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-semibold text-d-text">{m.quantity} {t("products.form.unitsInStock").toLowerCase()}</span>
                            <p className="text-[10px] text-d-text-sub truncate">
                              {m.type} {m.note ? `— ${m.note}` : ""}
                            </p>
                          </div>
                          <span className="text-[10px] text-d-text-sub shrink-0">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settings Row */}
                <div className="border-t border-d-border pt-3 space-y-3">
                  <div className="flex gap-1.5">
                    {(["PMP", "FIFO", "LIFO"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setValuationMethod(method)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                          valuationMethod === method
                            ? "bg-d-text text-white"
                            : "bg-d-surface-secondary text-d-text-sub hover:text-d-text"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-d-text-sub shrink-0">{t("products.form.lowStockThreshold")}:</label>
                    <input
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                      className="w-16 bg-d-input-bg border border-d-input-border rounded-lg px-2 py-1 text-[12px] text-center focus:outline-none focus:ring-1 focus:ring-d-link text-d-text"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Column ─── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* General Card */}
          <div className="bg-d-surface rounded-xl shadow-card p-4">
            <h3 className="text-base font-semibold text-d-text mb-6">{t("products.form.productTitle")}</h3>
            <div className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">{t("products.form.productTitle")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-d-input-bg border border-d-input-border rounded-lg px-3 py-1.5 text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                  placeholder={t("products.form.titlePlaceholder")}
                />
                <p className="text-[11px] text-d-text-sub">A product name is required and recommended to be unique.</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">{t("common.description")}</label>
                  <button
                    type="button"
                    onClick={() => setUseBlocks(!useBlocks)}
                    className="text-xs px-3 py-1 rounded-lg border transition-colors font-semibold"
                    style={{
                      borderColor: useBlocks ? "#303030" : "#8a8a8a",
                      backgroundColor: useBlocks ? "#f1f1f1" : "transparent",
                      color: useBlocks ? "#303030" : "#616161",
                    }}
                  >
                    {useBlocks ? t("products.form.richEditor") : t("products.form.simpleText")}
                  </button>
                </div>

                {useBlocks ? (
                  <BlockEditor
                    content={contentHtml}
                    onChange={setContentHtml}
                    isPro={userPlan === "PRO"}
                    onImageUpload={handleImageUploadForBlock}
                  />
                ) : (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required={!useBlocks}
                    rows={6}
                    className="w-full bg-d-input-bg border border-d-input-border rounded-lg px-3 py-1.5 text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text resize-none"
                    placeholder="Enter product description..."
                  />
                )}
                <p className="text-[11px] text-d-text-sub">Set a description to the product for better visibility.</p>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-d-surface rounded-xl shadow-card p-4">
            <h3 className="text-base font-semibold text-d-text mb-6">{t("products.form.price")}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Base Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-d-text-sub font-medium">DA</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-d-input-bg border border-d-input-border rounded-lg ps-12 pe-3 py-1.5 text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link font-semibold text-d-text"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-d-text-sub">{t("products.form.leaveEmpty")}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Shipping Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-d-text-sub font-medium">DA</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="w-full bg-d-input-bg border border-d-input-border rounded-lg ps-12 pe-3 py-1.5 text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link font-semibold text-d-text"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-d-text-sub">Shipping fee added to the order total. Leave empty for free shipping.</p>
              </div>
            </div>
          </div>

          {/* Promotions Card */}
          <div className="bg-d-surface rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-d-text">{t("products.form.promotions")}</h3>
              <button
                type="button"
                onClick={() => setShowPromoForm(!showPromoForm)}
                className="flex items-center gap-1.5 text-sm font-semibold text-d-link hover:text-d-link transition-colors"
              >
                <Tag className="w-4 h-4" />
                {t("products.form.addPromo")}
              </button>
            </div>

            {promotions.length === 0 && !showPromoForm && (
              <div className="text-center py-6 text-d-text-sub">
                <p className="text-sm">{t("products.form.promotions")}</p>
                <p className="text-xs mt-1">e.g. Buy 2 Get 1 Free, 10% Off, 500 DA Off</p>
              </div>
            )}

            {promotions.length > 0 && (
              <div className="space-y-3 mb-4">
                {promotions.map((promo, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-d-surface-secondary border border-d-border rounded-xl">
                    <div className="flex items-center gap-2">
                      {promo.type === "buy_x_get_y" ? (
                        <Tag className="w-4 h-4 text-d-text" />
                      ) : (
                        <Percent className="w-4 h-4 text-d-text" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-d-text">{promo.label}</p>
                        <p className="text-xs text-d-text-sub">
                          {promo.type === "buy_x_get_y"
                            ? `Buy ${promo.buyQuantity}, get ${promo.getQuantity} free`
                            : promo.type === "buy_x_discount"
                            ? `Buy ${promo.buyQuantity}+, get ${promo.discountPercent}% off`
                            : promo.type === "percentage_discount"
                            ? `${promo.discountPercent}% discount on all orders`
                            : `${promo.fixedDiscount} DA discount on all orders`}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removePromotion(idx)} className="text-red-400 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showPromoForm && (
              <div className="border border-d-border rounded-xl p-4 bg-d-surface-secondary space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Promotion Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "buy_x_get_y", label: t("products.form.buyXgetYfree") },
                      { value: "buy_x_discount", label: t("products.form.buyXgetPercent") },
                      { value: "percentage_discount", label: t("products.form.percentDiscount") },
                      { value: "fixed_discount", label: t("products.form.fixedDiscount") },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPromoType(opt.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          promoType === opt.value
                            ? "bg-d-surface-tertiary text-d-text border-2 border-d-text"
                            : "bg-d-surface border border-d-input-border text-d-text"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(promoType === "buy_x_get_y" || promoType === "buy_x_discount") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Buy Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={promoBuyQty}
                        onChange={(e) => setPromoBuyQty(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                      />
                    </div>
                    {promoType === "buy_x_get_y" ? (
                      <div className="space-y-1">
                        <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Free Items</label>
                        <input
                          type="number"
                          min="1"
                          value={promoGetQty}
                          onChange={(e) => setPromoGetQty(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Discount %</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={promoDiscount}
                          onChange={(e) => setPromoDiscount(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                        />
                      </div>
                    )}
                  </div>
                )}

                {promoType === "percentage_discount" && (
                  <div className="space-y-1">
                    <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Discount %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={promoDiscount}
                      onChange={(e) => setPromoDiscount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                    />
                  </div>
                )}

                {promoType === "fixed_discount" && (
                  <div className="space-y-1">
                    <label className="text-[13px] font-[450] text-d-text normal-case tracking-normal">Discount Amount (DA)</label>
                    <input
                      type="number"
                      min="1"
                      value={promoFixedAmount}
                      onChange={(e) => setPromoFixedAmount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                    />
                  </div>
                )}

                <div className="p-2 bg-d-surface rounded-lg border border-d-border text-xs text-d-text-sub">
                  Preview: <span className="font-semibold text-d-text">
                    {promoType === "buy_x_get_y"
                      ? `Buy ${promoBuyQty} Get ${promoGetQty} Free`
                      : promoType === "buy_x_discount"
                      ? `Buy ${promoBuyQty} Get ${promoDiscount}% Off`
                      : promoType === "percentage_discount"
                      ? `${promoDiscount}% Off`
                      : `${promoFixedAmount} DA Off`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <StyledButton
                    variant="primary"
                    type="button"
                    onClick={addPromotion}
                  >
                    Add
                  </StyledButton>
                  <StyledButton
                    variant="secondary"
                    type="button"
                    onClick={() => setShowPromoForm(false)}
                  >
                    {t("common.cancel")}
                  </StyledButton>
                </div>
              </div>
            )}
          </div>

          {/* Variations Card */}
          <div className="bg-d-surface rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-d-text">{t("products.form.variations")}</h3>
              <button
                type="button"
                onClick={addVariation}
                className="flex items-center gap-1.5 text-sm font-semibold text-d-link hover:text-d-link transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("products.form.addVariation")}
              </button>
            </div>

            {variations.length === 0 ? (
              <div className="text-center py-6 text-d-text-sub">
                <p className="text-sm">No variations added yet</p>
                <p className="text-xs mt-1">e.g. Size (S, M, L), Color (Red, Blue), etc.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {variations.map((variation, vIdx) => (
                  <div key={vIdx} className="border border-d-border rounded-xl p-4 bg-d-surface-secondary">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={variation.name}
                        onChange={(e) => updateVariationName(vIdx, e.target.value)}
                        placeholder={t("products.form.variationNamePlaceholder")}
                        className="flex-1 px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVariationType(vIdx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          variation.type === "color"
                            ? "bg-d-subtle-bg text-d-text border border-d-border"
                            : "bg-d-surface-secondary text-d-text border border-d-border"
                        }`}
                      >
                        {variation.type === "color" ? t("products.form.colorType") : t("products.form.textType")}
                      </button>
                      <button type="button" onClick={() => removeVariation(vIdx)} className="text-red-500 hover:text-red-700 text-sm font-semibold px-3">{t("common.remove")}</button>
                    </div>

                    <div className="space-y-2">
                      {variation.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          {variation.type === "color" && (
                            <div className="relative shrink-0">
                              <input
                                type="color"
                                value={opt.color || "#000000"}
                                onChange={(e) => updateOption(vIdx, oIdx, "color", e.target.value)}
                                className="w-8 h-8 rounded-lg border border-d-border cursor-pointer p-0.5"
                              />
                            </div>
                          )}
                          <input
                            type="text"
                            value={opt.value}
                            onChange={(e) => updateOption(vIdx, oIdx, "value", e.target.value)}
                            placeholder={variation.type === "color" ? "Color name (e.g. Red)" : "Option (e.g. Large)"}
                            className="flex-1 px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-d-text-sub">+</span>
                            <input
                              type="number"
                              value={opt.priceAdjustment || ""}
                              onChange={(e) => updateOption(vIdx, oIdx, "priceAdjustment", e.target.value)}
                              placeholder="0"
                              className="w-20 px-3 py-1.5 border border-d-input-border rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link text-d-text"
                            />
                            <span className="text-xs text-d-text-sub">DA</span>
                          </div>
                          {variation.options.length > 1 && (
                            <button type="button" onClick={() => removeOption(vIdx, oIdx)} className="text-red-400 hover:text-red-600 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => addOption(vIdx)} className="mt-3 text-xs font-semibold text-d-link hover:text-d-link">
                      + {t("products.form.addValue")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
