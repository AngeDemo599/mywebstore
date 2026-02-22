"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Minus, Plus, CheckCircle, ShoppingBag } from "lucide-react";
import { trackPixelEvent } from "@/components/meta-pixel";
import { StoreTheme, StoreStyle } from "@/types/store";
import { getStyleClasses } from "@/lib/theme";
import { WILAYAS, getWilayaLabel } from "@/lib/wilayas";
import { formatPrice } from "@/lib/utils";
import { dictionaries, type Locale } from "@/i18n";

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

interface OrderFormProps {
  productId: string;
  storeSlug: string;
  theme: StoreTheme;
  storeStyle?: StoreStyle;
  basePrice: number | null;
  variations: Variation[];
  promotions: Promotion[];
  productTitle: string;
  shippingFee?: number | null;
  locale?: Locale;
  isDemo?: boolean;
  metaPixelId?: string | null;
  trackStock?: boolean;
  stockQuantity?: number;
}

export default function OrderForm({ productId, storeSlug, theme, storeStyle, basePrice, variations, promotions, productTitle, shippingFee, locale = "ar", isDemo = false, metaPixelId, trackStock, stockQuantity }: OrderFormProps) {
  const styleClasses = storeStyle ? getStyleClasses(storeStyle) : null;
  const dict = dictionaries[locale];
  const t = (key: string) => dict[key] || key;
  const [firstName, setFirstName] = useState(isDemo ? "محمد" : "");
  const [lastName, setLastName] = useState(isDemo ? "عميل تجريبي" : "");
  const [phone, setPhone] = useState(isDemo ? "0555 000 000" : "");
  const [wilayaCode, setWilayaCode] = useState(isDemo ? "16" : "");
  const [daira, setDaira] = useState(isDemo ? "الجزائر الوسطى" : "");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    variations.forEach((v) => {
      if (v.options.length > 0) defaults[v.name] = v.options[0].value;
    });
    return defaults;
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasFiredFormStart = useRef(false);

  const fireTrack = useCallback((eventType: string) => {
    const trackFn = (window as unknown as Record<string, unknown>).__mwsTrack;
    if (typeof trackFn === "function") {
      (trackFn as (e: string) => void)(eventType);
    }
  }, []);

  const handleFormStart = useCallback(() => {
    if (!hasFiredFormStart.current) {
      hasFiredFormStart.current = true;
      fireTrack("FORM_START");
    }
  }, [fireTrack]);

  const selectedWilaya = WILAYAS.find((w) => w.code === wilayaCode);
  const dairas = selectedWilaya?.dairas || [];

  const priceAdjustment = useMemo(() => {
    let adj = 0;
    variations.forEach((v) => {
      const selected = selectedVariants[v.name];
      const opt = v.options.find((o) => o.value === selected);
      if (opt) adj += opt.priceAdjustment;
    });
    return adj;
  }, [selectedVariants, variations]);

  const unitPrice = basePrice != null ? basePrice + priceAdjustment : null;
  const rawTotal = unitPrice != null ? unitPrice * quantity : null;

  const appliedPromo = useMemo(() => {
    if (!promotions || promotions.length === 0 || unitPrice == null) return null;
    for (const promo of promotions) {
      if (promo.type === "buy_x_get_y" && promo.getQuantity && promo.buyQuantity) {
        const groupSize = promo.buyQuantity + promo.getQuantity;
        if (quantity >= groupSize) return promo;
      }
      if (promo.type === "buy_x_discount" && promo.discountPercent && promo.buyQuantity) {
        if (quantity >= promo.buyQuantity) return promo;
      }
      if (promo.type === "percentage_discount" && promo.discountPercent) {
        return promo;
      }
      if (promo.type === "fixed_discount" && promo.fixedDiscount) {
        return promo;
      }
    }
    return null;
  }, [promotions, quantity, unitPrice]);

  const savings = useMemo(() => {
    if (!appliedPromo || unitPrice == null) return 0;
    if (appliedPromo.type === "buy_x_get_y" && appliedPromo.getQuantity && appliedPromo.buyQuantity) {
      const groupSize = appliedPromo.buyQuantity + appliedPromo.getQuantity;
      const freeItems = Math.floor(quantity / groupSize) * appliedPromo.getQuantity;
      return freeItems * unitPrice;
    }
    if (appliedPromo.type === "buy_x_discount" && appliedPromo.discountPercent) {
      return (rawTotal! * appliedPromo.discountPercent) / 100;
    }
    if (appliedPromo.type === "percentage_discount" && appliedPromo.discountPercent) {
      return (rawTotal! * appliedPromo.discountPercent) / 100;
    }
    if (appliedPromo.type === "fixed_discount" && appliedPromo.fixedDiscount) {
      return Math.min(appliedPromo.fixedDiscount, rawTotal!);
    }
    return 0;
  }, [appliedPromo, quantity, unitPrice, rawTotal]);

  const shippingCost = shippingFee ?? 0;
  const totalPrice = rawTotal != null ? rawTotal - savings + shippingCost : null;

  const promoHint = useMemo(() => {
    if (!promotions || promotions.length === 0 || appliedPromo) return null;
    for (const promo of promotions) {
      if (promo.type === "buy_x_get_y" && promo.getQuantity && promo.buyQuantity) {
        const needed = promo.buyQuantity + promo.getQuantity;
        if (quantity < needed && quantity >= promo.buyQuantity) {
          return `Add ${needed - quantity} more to get ${promo.label}!`;
        }
      }
      if (promo.type === "buy_x_discount" && promo.discountPercent && promo.buyQuantity) {
        if (quantity < promo.buyQuantity && quantity >= promo.buyQuantity - 1) {
          return `Add ${promo.buyQuantity - quantity} more to get ${promo.discountPercent}% off!`;
        }
      }
    }
    return null;
  }, [promotions, quantity, appliedPromo]);

  const handleWilayaChange = (code: string) => {
    setWilayaCode(code);
    setDaira("");
  };

  const submitOrder = async (name: string, phoneVal: string, address: string) => {
    setError("");
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch(`/api/store/${storeSlug}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        name,
        phone: phoneVal,
        address,
        quantity,
        ...(variations.length > 0 ? { variants: selectedVariants } : {}),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (data.available !== undefined) {
        setError(`${t("public.insufficientStock")} ${t("public.available")}: ${data.available}`);
      } else {
        setError(data.error);
      }
    } else {
      setSuccess(true);
      fireTrack("FORM_SUBMIT");
      if (metaPixelId && totalPrice != null) {
        trackPixelEvent("Purchase", {
          value: totalPrice,
          currency: "DZD",
          content_name: productTitle,
          content_type: "product",
          contents: [{ id: productId, quantity }],
          num_items: quantity,
        });
      }
      if (!isDemo) {
        setFirstName("");
        setLastName("");
        setPhone("");
        setWilayaCode("");
        setDaira("");
      }
      setQuantity(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wilayaLabel = selectedWilaya ? getWilayaLabel(selectedWilaya) : "";
    await submitOrder(
      `${firstName.trim()} ${lastName.trim()}`,
      phone.trim(),
      `${wilayaLabel}${daira ? `, ${daira}` : ""}`
    );
  };

  const handleDemoOrder = async () => {
    await submitOrder("عميل تجريبي", "0500000000", "طلب تجريبي — بيانات وهمية");
  };

  if (success) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-[#303030] mb-2">
          {t("public.orderSuccess")}
        </h3>
        <p className="text-[#616161] text-sm mb-6 max-w-xs mx-auto">
          {t("public.orderSuccessDesc")}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {t("public.placeOrder")}
        </button>
      </div>
    );
  }

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 12px center",
  };

  return (
    <form onSubmit={isDemo ? (e) => e.preventDefault() : handleSubmit}>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium">{error}</div>
      )}

      <div className="space-y-6">
        {/* Variations */}
        {variations.length > 0 && (
          <div className="space-y-4">
            {variations.map((variation) => (
              <div key={variation.name}>
                <label className="block text-[13px] font-[450] text-[#303030] mb-2">
                  {variation.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {variation.options.map((opt) => {
                    const isSelected = selectedVariants[variation.name] === opt.value;
                    const isColorType = variation.type === "color" && opt.color;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setSelectedVariants({ ...selectedVariants, [variation.name]: opt.value })
                        }
                        className={`rounded-lg border-2 text-sm transition-all active:scale-[0.97] ${
                          isColorType ? "px-3 py-2 flex items-center gap-2" : "px-4 py-2"
                        }`}
                        style={{
                          borderColor: isSelected ? theme.primaryColor : "#e5e7eb",
                          backgroundColor: isSelected ? theme.primaryColor + "12" : "white",
                          color: isSelected ? theme.primaryColor : "#374151",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {isColorType && (
                          <span
                            className="inline-block w-5 h-5 rounded-full border border-gray-200 shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                        )}
                        {opt.value}
                        {opt.priceAdjustment > 0 && (
                          <span className="ms-1 text-xs opacity-60">+{formatPrice(opt.priceAdjustment)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-[13px] font-[450] text-[#303030] mb-2">
            {t("public.quantity")}
          </label>
          <div className="flex items-center gap-0 w-fit">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={trackStock && stockQuantity === 0}
              className="p-2.5 bg-[#f7f7f7] rounded-lg hover:bg-[#f1f1f1] transition-colors active:scale-95 disabled:opacity-50"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="w-12 text-center font-semibold text-lg text-[#303030]">{quantity}</span>
            <button
              type="button"
              onClick={() => {
                const max = trackStock && stockQuantity != null ? stockQuantity : Infinity;
                if (quantity < max) setQuantity(quantity + 1);
              }}
              disabled={(trackStock && stockQuantity != null && quantity >= stockQuantity) || (trackStock && stockQuantity === 0)}
              className="p-2.5 bg-[#f7f7f7] rounded-lg hover:bg-[#f1f1f1] transition-colors active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {trackStock && stockQuantity != null && stockQuantity > 0 && (
            <p className="text-xs text-[#616161] mt-1">{stockQuantity} {t("public.unitsAvailable")}</p>
          )}
        </div>

        {/* Customer Information */}
        <div>
          <h4 className="text-[13px] font-[550] text-[#303030] mb-3">{t("public.name")}</h4>
          {isDemo && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs font-medium text-amber-700">
              {t("demo.orderPrefilled")}
            </div>
          )}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={lastName}
                onChange={(e) => !isDemo && setLastName(e.target.value)}
                onFocus={handleFormStart}
                required
                readOnly={isDemo}
                className={`w-full px-3 py-1.5 bg-[#fdfdfd] border border-[#8a8a8a] rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#005bd3] focus:border-[#005bd3] text-[#303030] placeholder:text-gray-400 ${isDemo ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={locale === "ar" ? "اللقب" : "Nom"}
              />
              <input
                type="text"
                value={firstName}
                onChange={(e) => !isDemo && setFirstName(e.target.value)}
                required
                readOnly={isDemo}
                className={`w-full px-3 py-1.5 bg-[#fdfdfd] border border-[#8a8a8a] rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#005bd3] focus:border-[#005bd3] text-[#303030] placeholder:text-gray-400 ${isDemo ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={locale === "ar" ? "الاسم" : "Prénom"}
              />
            </div>

            <input
              type="tel"
              value={phone}
              onChange={(e) => !isDemo && setPhone(e.target.value)}
              required
              readOnly={isDemo}
              className={`w-full px-3 py-1.5 bg-[#fdfdfd] border border-[#8a8a8a] rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#005bd3] focus:border-[#005bd3] text-[#303030] placeholder:text-gray-400 ${isDemo ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder={t("public.phonePlaceholder")}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={wilayaCode}
                onChange={(e) => !isDemo && handleWilayaChange(e.target.value)}
                required
                disabled={isDemo}
                className={`w-full px-3 py-1.5 bg-[#fdfdfd] border border-[#8a8a8a] rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#005bd3] focus:border-[#005bd3] text-[#303030] appearance-none ${isDemo ? "opacity-60 cursor-not-allowed" : ""}`}
                style={selectStyle}
              >
                <option value="">{locale === "ar" ? "الولاية" : "Wilaya"}</option>
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
                ))}
              </select>

              <select
                value={daira}
                onChange={(e) => !isDemo && setDaira(e.target.value)}
                required
                disabled={isDemo || !wilayaCode}
                className={`w-full px-3 py-1.5 bg-[#fdfdfd] border border-[#8a8a8a] rounded-lg text-[13px] min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#005bd3] focus:border-[#005bd3] text-[#303030] appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${isDemo ? "opacity-60" : ""}`}
                style={selectStyle}
              >
                <option value="">{locale === "ar" ? "الدائرة" : "Daïra"}</option>
                {dairas.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Promotion Hint */}
        {promoHint && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700 font-medium">
            {promoHint}
          </div>
        )}

        {/* Price Summary */}
        {unitPrice != null && (
          <div className="rounded-xl p-4 space-y-2" style={styleClasses ? { ...styleClasses.summaryCardStyle, padding: "16px" } : { background: "#f7f7f7", border: "1px solid #e3e3e3" }}>
            <div className="flex justify-between text-sm">
              <span className="text-[#616161] font-medium">{locale === "ar" ? "المنتج" : "Produit"}</span>
              <span className="text-[#303030] font-medium">{productTitle}</span>
            </div>
            {priceAdjustment > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#616161] font-medium">{t("common.options")}</span>
                <span className="text-[#303030] font-medium">+{formatPrice(priceAdjustment)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#616161] font-medium">{locale === "ar" ? "سعر الوحدة" : "Prix unitaire"}</span>
              <span className="text-[#303030] font-medium">{formatPrice(unitPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#616161] font-medium">{t("public.quantity")}</span>
              <span className="text-[#303030] font-medium">&times; {quantity}</span>
            </div>
            {appliedPromo && savings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">{appliedPromo.label}</span>
                <span className="text-green-600 font-medium">-{formatPrice(savings)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#616161] font-medium">{t("public.shipping")}</span>
              <span className="text-[#303030] font-medium">{shippingCost > 0 ? formatPrice(shippingCost) : t("public.free")}</span>
            </div>
            <div className="border-t border-[#e3e3e3] pt-2 mt-2 flex justify-between">
              <span className="text-base font-bold text-[#303030]">{t("public.total")}</span>
              <div className="text-end">
                {savings > 0 && rawTotal != null && (
                  <span className="text-xs text-[#616161] line-through me-2">{formatPrice(rawTotal)}</span>
                )}
                <span className="text-base font-bold" style={{ color: theme.primaryColor }}>{formatPrice(totalPrice!)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {trackStock && stockQuantity === 0 ? (
          <button
            type="button"
            disabled
            className="w-full py-4 font-semibold text-lg bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            {t("public.outOfStock")}
          </button>
        ) : (
          <button
            type={isDemo ? "button" : "submit"}
            onClick={isDemo ? handleDemoOrder : undefined}
            disabled={submitting}
            className="w-full py-4 font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={styleClasses ? { ...styleClasses.buttonStyle, width: "100%", padding: "16px" } : { backgroundColor: theme.primaryColor, color: "#ffffff", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("public.submitting")}
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                {totalPrice != null ? `${t("public.orderNow")} - ${formatPrice(totalPrice)}` : t("public.placeOrder")}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
