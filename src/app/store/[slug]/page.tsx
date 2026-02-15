import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { resolveStyle, styleToCSS, getStyleClasses, getFontUrl } from "@/lib/theme";
import { formatPrice } from "@/lib/utils";
import { getTranslator, getDirection, type Locale } from "@/i18n";
import { isDemoStore } from "@/lib/demo";

function getCoverBackground(coverStyle: string, primary: string, secondary: string) {
  if (coverStyle === "solid") return primary;
  if (coverStyle === "wave") return `linear-gradient(160deg, ${primary} 40%, ${secondary} 100%)`;
  return `linear-gradient(135deg, ${primary}dd 0%, ${secondary}aa 50%, ${primary}66 100%)`;
}

function StoreLogo({ logo, name, size = "md", primaryColor }: { logo: string | null; name: string; size?: "sm" | "md" | "lg"; primaryColor: string }) {
  const sizeMap = { sm: "w-10 h-10 text-sm", md: "w-16 h-16 text-2xl", lg: "w-20 h-20 text-3xl" };
  const cls = sizeMap[size];
  if (logo) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={logo} alt={name} className={`${cls} rounded-xl object-contain bg-white/20 backdrop-blur-sm border border-white/30`} />
    );
  }
  return (
    <div className={`${cls} rounded-xl flex items-center justify-center text-white font-bold bg-white/20 backdrop-blur-sm border border-white/30`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Header: Classic ── Left-aligned logo + name at bottom of cover */
function HeaderClassic({ store, coverBg, productCount, t }: { store: { name: string; logo: string | null }; coverBg: string; productCount: string; t: (k: string) => string }) {
  return (
    <div className="relative w-full h-48 sm:h-56 overflow-hidden">
      <div className="absolute inset-0" style={{ background: coverBg }} />
      <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex items-end pb-6">
        <div className="flex items-center gap-4">
          <StoreLogo logo={store.logo} name={store.name} primaryColor="" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">{store.name}</h1>
            <p className="text-white/70 mt-1">{productCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Header: Centered ── Centered logo and name with tall cover */
function HeaderCentered({ store, coverBg, productCount, primary }: { store: { name: string; logo: string | null }; coverBg: string; productCount: string; primary: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "280px" }}>
      <div className="absolute inset-0" style={{ background: coverBg }} />
      {/* Decorative circles */}
      <div className="absolute top-6 left-[10%] w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />
      <div className="absolute bottom-4 right-[15%] w-24 h-24 rounded-full opacity-10" style={{ background: "white" }} />
      <div className="relative z-10 flex flex-col items-center justify-center py-12 px-4">
        {store.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={store.logo} alt={store.name} className="w-20 h-20 rounded-2xl object-contain bg-white/20 backdrop-blur-md border border-white/30 shadow-lg mb-4" />
        ) : (
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold bg-white/20 backdrop-blur-md border border-white/30 shadow-lg mb-4">
            {store.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg text-center">{store.name}</h1>
        <div className="mt-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/15 backdrop-blur-sm text-white/90 border border-white/20">
            {productCount}
          </span>
        </div>
        {/* Bottom wave */}
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1200 60" fill="none" preserveAspectRatio="none" style={{ height: "30px" }}>
          <path d="M0 60L1200 60L1200 30C1000 0 800 50 600 30C400 10 200 50 0 20L0 60Z" fill="currentColor" className="text-[var(--wave-bg)]" style={{ color: "var(--theme-bg, #ffffff)" }} />
        </svg>
      </div>
    </div>
  );
}

/* ── Header: Banner ── Wide banner with side-by-side layout */
function HeaderBanner({ store, coverBg, productCount, primary, secondary }: { store: { name: string; logo: string | null }; coverBg: string; productCount: string; primary: string; secondary: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "220px" }}>
      <div className="absolute inset-0" style={{ background: coverBg }} />
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex items-center py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
          {store.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={store.logo} alt={store.name} className="w-24 h-24 rounded-2xl object-contain bg-white/10 backdrop-blur-md border-2 border-white/20 shadow-xl flex-shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-bold bg-white/10 backdrop-blur-md border-2 border-white/20 shadow-xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${primary}80, ${secondary}60)` }}>
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">{store.name}</h1>
            <p className="text-white/60 mt-2 text-base">{productCount}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/50 text-xs font-medium uppercase tracking-widest">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Header: Minimal ── Thin subtle header, focus on products */
function HeaderMinimal({ store, productCount, primary, textColor, bgColor, borderColor }: { store: { name: string; logo: string | null }; productCount: string; primary: string; textColor: string; bgColor: string; borderColor: string }) {
  return (
    <div style={{ borderBottom: `1px solid ${borderColor}`, background: bgColor }}>
      <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {store.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={store.logo} alt={store.name} className="w-10 h-10 rounded-lg object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: primary }}>
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: textColor }}>{store.name}</h1>
          </div>
        </div>
        <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ color: primary, background: `${primary}10` }}>
          {productCount}
        </span>
      </div>
    </div>
  );
}

/* ── Header: Hero ── Full-screen-ish hero with pattern and large text */
function HeaderHero({ store, coverBg, productCount, primary, secondary }: { store: { name: string; logo: string | null }; coverBg: string; productCount: string; primary: string; secondary: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "340px" }}>
      <div className="absolute inset-0" style={{ background: coverBg }} />
      {/* Diagonal stripe pattern */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,1) 20px, rgba(255,255,255,1) 21px)`,
      }} />
      {/* Floating decorative shapes */}
      <div className="absolute top-12 right-[8%] w-40 h-40 rounded-full opacity-10 blur-xl" style={{ background: secondary }} />
      <div className="absolute bottom-8 left-[5%] w-56 h-56 rounded-full opacity-10 blur-xl" style={{ background: "white" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ border: `2px solid white` }} />

      <div className="relative z-10 flex flex-col items-center justify-center py-16 px-4 text-center">
        {store.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={store.logo} alt={store.name} className="w-24 h-24 rounded-3xl object-contain bg-white/15 backdrop-blur-lg border-2 border-white/20 shadow-2xl mb-6" />
        ) : (
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-4xl font-bold bg-white/15 backdrop-blur-lg border-2 border-white/20 shadow-2xl mb-6">
            {store.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg tracking-tight">{store.name}</h1>
        <div className="mt-5 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/15 backdrop-blur-sm text-white border border-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {productCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function StorePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      products: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!store) notFound();

  const locale = (store.language === "fr" ? "fr" : "ar") as Locale;
  const t = getTranslator(locale);
  const dir = getDirection(locale);
  const style = resolveStyle(store.theme);
  const classes = getStyleClasses(style);
  const fontUrl = getFontUrl(style.typography.font);
  const coverBg = getCoverBackground(style.layout.coverStyle, style.colors.primary, style.colors.secondary);
  const productCount = `${store.products.length} ${store.products.length === 1 ? t("public.product") : t("public.products")}`;
  const headerStyle = style.layout.headerStyle || "classic";
  const isDemo = isDemoStore(slug);

  return (
    <>
    {fontUrl && (
      // eslint-disable-next-line @next/next/no-page-custom-font
      <link rel="stylesheet" href={fontUrl} />
    )}
    <main dir={dir}>
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

      {/* Store Header */}
      {headerStyle === "centered" && (
        <HeaderCentered store={store} coverBg={coverBg} productCount={productCount} primary={style.colors.primary} />
      )}
      {headerStyle === "banner" && (
        <HeaderBanner store={store} coverBg={coverBg} productCount={productCount} primary={style.colors.primary} secondary={style.colors.secondary} />
      )}
      {headerStyle === "minimal" && (
        <HeaderMinimal store={store} productCount={productCount} primary={style.colors.primary} textColor={style.colors.text} bgColor={style.colors.background} borderColor={style.colors.border} />
      )}
      {headerStyle === "hero" && (
        <HeaderHero store={store} coverBg={coverBg} productCount={productCount} primary={style.colors.primary} secondary={style.colors.secondary} />
      )}
      {headerStyle === "classic" && (
        <HeaderClassic store={store} coverBg={coverBg} productCount={productCount} t={t} />
      )}

      <div className="max-w-6xl mx-auto py-8 px-4">

        {store.products.length === 0 ? (
          <div
            className="rounded-lg border p-8 text-center"
            style={{ borderColor: style.colors.border }}
          >
            <p style={{ opacity: 0.6 }}>{t("public.noProducts")}</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${style.layout.productGrid === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-6`}>
            {store.products.map((product) => {
              const images = Array.isArray(product.images) ? (product.images as unknown[]) : [];
              const firstImage = images.length > 0 ? String(images[0]) : null;
              const hasValidImage = firstImage && firstImage.startsWith("http");
              const aspectClass = style.layout.imageAspect === "square" ? "aspect-square" : style.layout.imageAspect === "portrait" ? "aspect-[3/4]" : "aspect-video";

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="overflow-hidden hover:shadow-lg transition-all group"
                  style={{
                    ...classes.cardStyle,
                    backgroundColor: style.colors.background,
                  }}
                >
                  {hasValidImage ? (
                    <div className={`${aspectClass} bg-gray-100 overflow-hidden`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={firstImage}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div
                      className={`${aspectClass} flex items-center justify-center`}
                      style={{
                        background: `linear-gradient(135deg, ${style.colors.primary}20 0%, ${style.colors.secondary}15 100%)`,
                      }}
                    >
                      <span className="text-3xl font-bold" style={{ color: style.colors.primary, opacity: 0.25 }}>
                        {product.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-lg" style={classes.headingStyle}>{product.title}</h2>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: style.colors.textMuted }}>
                      {product.description}
                    </p>
                    {product.price != null && (
                      <p className="font-bold mt-2" style={{ color: style.colors.primary }}>
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </main>
    </>
  );
}
