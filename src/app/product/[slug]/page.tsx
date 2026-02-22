import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { resolveStyle, styleToCSS, getStyleClasses, getFontUrl } from "@/lib/theme";
import { ContentBlock } from "@/types/content-blocks";
import ImageGallery from "./image-gallery";
import OrderForm from "./order-form";
import ShareButtons from "./share-buttons";
import BottomOrderBanner from "./bottom-order-banner";
import BlockRenderer from "@/components/block-renderer";
import ProductAnalyticsTracker from "@/components/product-analytics-tracker";
import MetaPixel from "@/components/meta-pixel";
import MetaPixelViewContent from "./meta-pixel-view-content";
import { formatPrice } from "@/lib/utils";
import { getTranslator, getDirection, type Locale } from "@/i18n";
import { isDemoStore } from "@/lib/demo";
import AdBanner from "@/components/ad-banner";

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

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      store: {
        include: {
          products: {
            where: { slug: { not: slug }, isActive: true },
            take: 4,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!product) notFound();
  if (!product.isActive) notFound();

  const locale = (product.store.language === "fr" ? "fr" : "ar") as Locale;
  const t = getTranslator(locale);
  const dir = getDirection(locale);

  const images = Array.isArray(product.images)
    ? (product.images as unknown[]).map(String).filter((s) => s.startsWith("http"))
    : [];
  const style = resolveStyle(product.store.theme);
  const theme = { primaryColor: style.colors.primary, secondaryColor: style.colors.secondary, backgroundColor: style.colors.background, textColor: style.colors.text };
  const classes = getStyleClasses(style);
  const fontUrl = getFontUrl(style.typography.font);
  const variations: Variation[] = Array.isArray(product.variations)
    ? (product.variations as unknown as Variation[])
    : [];
  const promotions: Promotion[] = Array.isArray(product.promotions)
    ? (product.promotions as unknown as Promotion[])
    : [];
  const relatedProducts = product.store.products;
  const contentHtml: string | null = typeof product.contentBlocks === "string"
    ? (product.contentBlocks as string)
    : null;
  const contentBlocks: ContentBlock[] | null = !contentHtml && Array.isArray(product.contentBlocks)
    ? (product.contentBlocks as unknown as ContentBlock[])
    : null;

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const productAge = new Date().getTime() - new Date(product.createdAt).getTime();
  const isNew = productAge < sevenDaysMs;
  const isDemo = isDemoStore(product.store.slug);

  return (
    <main dir={dir}>
      {fontUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontUrl} />
      )}
      <ProductAnalyticsTracker productId={product.id} storeId={product.storeId} />
      <MetaPixel pixelId={product.store.metaPixelId} />
      <MetaPixelViewContent
        pixelId={product.store.metaPixelId}
        contentName={product.title}
        contentId={product.id}
        contentCategory={product.category}
        value={product.price}
      />
      <div
        className="min-h-screen"
        style={{ ...styleToCSS(style), backgroundColor: style.colors.background, color: style.colors.text }}
      >
        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm font-medium text-amber-800 flex items-center justify-center gap-3 flex-wrap">
            <span>{t("demo.banner")}</span>
            <a href="/auth/register" className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors">
              {t("demo.createYourStore")}
            </a>
          </div>
        )}

        {/* ─── Mobile: Full-width image area ─── */}
        <div className="lg:hidden">
          {images.length > 0 ? (
            <div className="relative">
              <ImageGallery images={images} title={product.title} primaryColor={theme.primaryColor} />
              <div className="absolute top-3 left-3 z-10">
                <Link
                  href={`/store/${product.store.slug}`}
                  className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs hover:bg-black/60 transition-colors"
                >
                  {product.store.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={product.store.logo} alt="" className="w-4 h-4 rounded object-contain" />
                  ) : (
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      {product.store.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {product.store.name}
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="h-48"
              style={{
                background:
                  style.layout.coverStyle === "solid"
                    ? style.colors.primary
                    : style.layout.coverStyle === "wave"
                    ? `linear-gradient(160deg, ${style.colors.primary} 40%, ${style.colors.secondary} 100%)`
                    : `linear-gradient(135deg, ${style.colors.primary}dd 0%, ${style.colors.secondary}aa 100%)`,
              }}
            />
          )}
        </div>

        {/* ─── Desktop: Hero cover ─── */}
        <div className="hidden lg:block relative w-full h-80 xl:h-96 overflow-hidden">
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0]} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  style.layout.coverStyle === "solid"
                    ? style.colors.primary
                    : style.layout.coverStyle === "wave"
                    ? `linear-gradient(160deg, ${style.colors.primary} 40%, ${style.colors.secondary} 100%)`
                    : `linear-gradient(135deg, ${style.colors.primary}dd 0%, ${style.colors.secondary}aa 50%, ${style.colors.primary}66 100%)`,
              }}
            />
          )}
          <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex flex-col justify-end pb-8">
            <nav className="flex items-center gap-2 text-sm mb-3">
              <Link href={`/store/${product.store.slug}`} className="hover:underline flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                {product.store.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.store.logo} alt={product.store.name} className="w-5 h-5 rounded object-contain" />
                ) : (
                  <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: theme.primaryColor }}>
                    {product.store.name.charAt(0).toUpperCase()}
                  </span>
                )}
                {product.store.name}
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-white/70">{product.title}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">{product.title}</h1>
            {product.price != null && (
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl sm:text-3xl font-bold text-white">{formatPrice(product.price)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Mobile: Product title + price ─── */}
        <div className="lg:hidden px-5 pt-5 pb-3">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.title}</h1>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {product.price != null && (
                <span className="text-3xl font-bold" style={{ color: theme.primaryColor }}>{formatPrice(product.price)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">{t("public.new")}</span>
              )}
              {product.trackStock && product.stockQuantity === 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {t("public.outOfStock")}
                </span>
              ) : product.trackStock && product.stockQuantity <= product.lowStockThreshold ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("public.lowStock")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {t("public.inStock")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {variations.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                  {variations.length} {variations.length === 1 ? t("public.option") : t("public.options")}
                </span>
              )}
            </div>
            <ShareButtons title={product.title} primaryColor={theme.primaryColor} />
          </div>
          {promotions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {promotions.map((promo, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                  {promo.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── Main content ─── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-4 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Left: Desktop gallery + Description */}
            <div className="space-y-6">
              <div className="hidden lg:block">
                <ImageGallery images={images} title={product.title} primaryColor={theme.primaryColor} />
              </div>

              {/* Desktop: badges + share */}
              <div className="hidden lg:flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {isNew && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">{t("public.new")}</span>
                  )}
                  {product.trackStock && product.stockQuantity === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {t("public.outOfStock")}
                    </span>
                  ) : product.trackStock && product.stockQuantity <= product.lowStockThreshold ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {t("public.lowStock")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {t("public.inStock")}
                    </span>
                  )}
                  {variations.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {variations.length} {variations.length === 1 ? t("public.option") : t("public.options")}
                    </span>
                  )}
                  {promotions.map((promo, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                      {promo.label}
                    </span>
                  ))}
                </div>
                <ShareButtons title={product.title} primaryColor={theme.primaryColor} />
              </div>

              {/* ─── Mobile: Inline Order Form ─── */}
              <div id="order-form-section" className="lg:hidden">
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">{t("public.placeOrder")}</h3>
                  <OrderForm
                    productId={product.id}
                    storeSlug={product.store.slug}
                    theme={theme}
                    storeStyle={style}
                    basePrice={product.price}
                    variations={variations}
                    promotions={promotions}
                    productTitle={product.title}
                    shippingFee={product.shippingFee}
                    locale={locale}
                    isDemo={isDemo}
                    metaPixelId={product.store.metaPixelId}
                    trackStock={product.trackStock}
                    stockQuantity={product.stockQuantity}
                  />
                </div>
              </div>

              {/* Description */}
              {(contentHtml || (contentBlocks && contentBlocks.length > 0) || product.description) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("public.description")}</h2>
                  {contentHtml ? (
                    <BlockRenderer html={contentHtml} textColor={theme.textColor} primaryColor={theme.primaryColor} />
                  ) : contentBlocks && contentBlocks.length > 0 ? (
                    <BlockRenderer blocks={contentBlocks} textColor={theme.textColor} primaryColor={theme.primaryColor} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-gray-600">{product.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Desktop order form (sticky) */}
            <div id="order-form-section-desktop" className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">{t("public.placeOrder")}</h3>
                <OrderForm
                  productId={product.id}
                  storeSlug={product.store.slug}
                  theme={theme}
                  storeStyle={style}
                  basePrice={product.price}
                  variations={variations}
                  promotions={promotions}
                  productTitle={product.title}
                  shippingFee={product.shippingFee}
                  isDemo={isDemo}
                  metaPixelId={product.store.metaPixelId}
                  trackStock={product.trackStock}
                  stockQuantity={product.stockQuantity}
                />
              </div>
            </div>
          </div>

          <AdBanner slot="product-below" format="horizontal" className="mt-8" />

          {/* ─── Related Products ─── */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 lg:mt-16">
              <h2 className="text-lg lg:text-2xl font-bold mb-4 lg:mb-6">{t("public.moreFrom")} {product.store.name}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {relatedProducts.map((rp) => {
                  const rpImages = Array.isArray(rp.images) ? (rp.images as unknown[]) : [];
                  const firstImage = rpImages.length > 0 ? String(rpImages[0]) : null;
                  return (
                    <Link
                      key={rp.id}
                      href={`/product/${rp.slug}`}
                      className="rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
                      style={{ borderColor: theme.secondaryColor + "25" }}
                    >
                      {firstImage && firstImage.startsWith("http") ? (
                        <div className="aspect-square bg-gray-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={firstImage} alt={rp.title} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                        </div>
                      ) : (
                        <div className="aspect-square flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}30 0%, ${theme.secondaryColor}20 100%)` }}>
                          <span className="text-4xl font-bold" style={{ color: theme.primaryColor, opacity: 0.3 }}>{rp.title.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="p-2.5 lg:p-3">
                        <h3 className="text-xs lg:text-sm font-semibold line-clamp-1">{rp.title}</h3>
                        {rp.price != null && (
                          <p className="text-xs lg:text-sm font-bold mt-0.5" style={{ color: theme.primaryColor }}>{formatPrice(rp.price)}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom order banner — visible when form is scrolled out of view */}
      <BottomOrderBanner
        primaryColor={theme.primaryColor}
        borderColor={theme.secondaryColor}
        price={product.price}
        storeStyle={style}
      />
    </main>
  );
}
