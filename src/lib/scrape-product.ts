export interface ScrapedProduct {
  title: string | null;
  description: string | null;
  images: string[];
  siteName: string | null;
  price: number | null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[|\-–—]\s*AliExpress.*$/i, "")
    .replace(/\s+\d{6,}$/, "")
    .replace(/\s*AliExpress\s*$/i, "")
    .trim();
}

function extractJsonLd(html: string): {
  title: string | null;
  description: string | null;
  images: string[];
  price: number | null;
} {
  const result = { title: null as string | null, description: null as string | null, images: [] as string[], price: null as number | null };

  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
          if (item.name) result.title = cleanTitle(decodeHtmlEntities(String(item.name)));
          if (item.description) result.description = decodeHtmlEntities(String(item.description));
          if (item.image) {
            const imgs = Array.isArray(item.image) ? item.image : [item.image];
            for (const img of imgs) {
              const url = typeof img === "string" ? img : img?.url;
              if (url && typeof url === "string") result.images.push(url);
            }
          }
          // Extract price from JSON-LD
          if (item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers?.price) {
              const p = parseFloat(String(offers.price));
              if (p > 0) result.price = p;
            } else if (offers?.lowPrice) {
              const p = parseFloat(String(offers.lowPrice));
              if (p > 0) result.price = p;
            }
          }
          break;
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return result;
}

function extractMetaTag(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']` +
    `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  );
  const match = regex.exec(html);
  const value = match?.[1] || match?.[2] || null;
  return value ? decodeHtmlEntities(value) : null;
}

function extractOpenGraph(html: string): {
  title: string | null;
  description: string | null;
  images: string[];
  siteName: string | null;
} {
  const rawTitle = extractMetaTag(html, "og:title");
  const title = rawTitle ? cleanTitle(rawTitle) : null;
  const description = extractMetaTag(html, "og:description");
  const siteName = extractMetaTag(html, "og:site_name");

  const images: string[] = [];
  const ogImageRegex =
    /<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:image["']/gi;
  let match;
  while ((match = ogImageRegex.exec(html)) !== null) {
    const url = match[1] || match[2];
    if (url) images.push(decodeHtmlEntities(url));
  }

  return { title, description, images, siteName };
}

function extractFallback(html: string): {
  title: string | null;
  description: string | null;
} {
  let title: string | null = null;
  const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  if (titleMatch?.[1]) {
    title = cleanTitle(decodeHtmlEntities(titleMatch[1].trim())) || null;
  }

  const description = extractMetaTag(html, "description");

  return { title, description };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAliExpressDom(html: string): {
  title: string | null;
  description: string | null;
} {
  let title: string | null = null;
  let description: string | null = null;

  // === TITLE extraction ===

  const h1Match = /<h1[^>]*data-pl=["']product-title["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (h1Match?.[1]) {
    const cleaned = stripHtml(h1Match[1]).trim();
    if (cleaned) title = decodeHtmlEntities(cleaned);
  }

  if (!title) {
    const h1ClassMatch = /<h1[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (h1ClassMatch?.[1]) {
      const cleaned = stripHtml(h1ClassMatch[1]).trim();
      if (cleaned) title = cleanTitle(decodeHtmlEntities(cleaned));
    }
  }

  if (!title) {
    const subjectMatch = /"subject"\s*:\s*"([^"]+)"/i.exec(html);
    if (subjectMatch?.[1]) {
      title = cleanTitle(decodeHtmlEntities(subjectMatch[1]));
    }
  }

  if (!title) {
    const titleDataMatch = /"(?:productTitle|itemTitle)"\s*:\s*"([^"]+)"/i.exec(html);
    if (titleDataMatch?.[1]) {
      title = cleanTitle(decodeHtmlEntities(titleDataMatch[1]));
    }
  }

  // === DESCRIPTION extraction ===

  const descDivMatch = /<div[^>]*id=["']product-description["'][^>]*>([\s\S]*?)<\/div>\s*(?:<iframe|<\/div>)/i.exec(html);
  if (descDivMatch?.[1]) {
    const cleaned = stripHtml(descDivMatch[1]).trim();
    if (cleaned && cleaned.length > 10) {
      description = decodeHtmlEntities(cleaned);
    }
  }

  if (!description) {
    const navDescMatch = /<div[^>]*id=["']nav-description["'][^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class=["'][^"']*(?:detail|spec|review)|$)/i.exec(html);
    if (navDescMatch?.[1]) {
      const cleaned = stripHtml(navDescMatch[1]).trim();
      if (cleaned && cleaned.length > 20) {
        description = decodeHtmlEntities(cleaned);
      }
    }
  }

  if (!description) {
    const inlineDescMatch = /"(?:description|productDesc)"\s*:\s*"([^"]{20,})"/i.exec(html);
    if (inlineDescMatch?.[1]) {
      const raw = inlineDescMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
      const cleaned = stripHtml(decodeHtmlEntities(raw)).trim();
      if (cleaned.length > 20) description = cleaned;
    }
  }

  return { title, description };
}

function extractGalleryImages(html: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (url: string) => {
    let resolved = url.trim();
    if (resolved.startsWith("//")) resolved = `https:${resolved}`;
    if (!resolved.startsWith("http")) return;
    if (!resolved.includes("alicdn.com")) return;
    if (/_\d{1,2}x\d{1,2}[.\-_]/.test(resolved)) return;
    if (!seen.has(resolved)) {
      seen.add(resolved);
      images.push(resolved);
    }
  };

  const imagePathListRegex = /"imagePathList"\s*:\s*\[([^\]]+)\]/g;
  let match;
  while ((match = imagePathListRegex.exec(html)) !== null) {
    const urlsStr = match[1];
    const urlRegex = /"([^"]+)"/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(urlsStr)) !== null) {
      addImage(urlMatch[1]);
    }
  }

  const imageArrayRegex = /"(?:images|galleryImages|productImages)"\s*:\s*\[([^\]]+)\]/g;
  while ((match = imageArrayRegex.exec(html)) !== null) {
    const urlsStr = match[1];
    const urlRegex = /"([^"]+alicdn\.com[^"]+)"/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(urlsStr)) !== null) {
      addImage(urlMatch[1]);
    }
  }

  const singleImageRegex = /"(?:imageUrl|imagePath|imgUrl|originalImg)"\s*:\s*"([^"]+alicdn\.com[^"]+)"/g;
  while ((match = singleImageRegex.exec(html)) !== null) {
    addImage(match[1]);
  }

  const alicdnRegex = /(?:https?:)?\/\/[a-z0-9]+\.alicdn\.com\/kf\/[A-Za-z0-9_\-./]+\.(?:jpg|jpeg|png|webp)/gi;
  while ((match = alicdnRegex.exec(html)) !== null) {
    addImage(match[0]);
  }

  return images;
}

/**
 * Extract AliExpress product ID from any AliExpress URL.
 */
function extractAliExpressProductId(url: string): string | null {
  // Pattern: /item/1005008976990685.html or /item/1005008976990685
  const match = /\/item\/(\d+)/i.exec(url);
  if (match) return match[1];
  // Pattern: productId=1005008976990685
  const paramMatch = /productId=(\d+)/i.exec(url);
  if (paramMatch) return paramMatch[1];
  return null;
}

/**
 * Normalize AliExpress URL to the global English version (better for scraping).
 */
function normalizeAliExpressUrl(url: string): string {
  const productId = extractAliExpressProductId(url);
  if (productId) {
    return `https://www.aliexpress.com/item/${productId}.html`;
  }
  // Fallback: replace locale subdomain with www
  try {
    const parsed = new URL(url);
    parsed.hostname = "www.aliexpress.com";
    // Remove tracking params
    parsed.search = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * Extract price from AliExpress HTML page data.
 */
function extractAliExpressPrice(html: string): number | null {
  // Strategy 1: "formattedActivityPrice":"US $X.XX"
  const activityMatch = /"formattedActivityPrice"\s*:\s*"[^"]*?([\d.]+)"/i.exec(html);
  if (activityMatch?.[1]) {
    const p = parseFloat(activityMatch[1]);
    if (p > 0) return p;
  }

  // Strategy 2: "minPrice":"X.XX" or "minAmount":{"value":X.XX}
  const minPriceMatch = /"(?:minPrice|min_price)"\s*:\s*"?([\d.]+)"?/i.exec(html);
  if (minPriceMatch?.[1]) {
    const p = parseFloat(minPriceMatch[1]);
    if (p > 0) return p;
  }

  // Strategy 3: "price":{"value":"X.XX"} or "salePrice":{"value":"X.XX"}
  const priceValueMatch = /"(?:price|salePrice)"\s*:\s*\{[^}]*"value"\s*:\s*"?([\d.]+)"?/i.exec(html);
  if (priceValueMatch?.[1]) {
    const p = parseFloat(priceValueMatch[1]);
    if (p > 0) return p;
  }

  // Strategy 4: "discountPrice":{"minPrice":X.XX}
  const discountMatch = /"discountPrice"\s*:\s*\{[^}]*"minPrice"\s*:\s*"?([\d.]+)"?/i.exec(html);
  if (discountMatch?.[1]) {
    const p = parseFloat(discountMatch[1]);
    if (p > 0) return p;
  }

  return null;
}

export function isAliExpressUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^([a-z]{2}\.)?aliexpress\.com$/i.test(parsed.hostname) ||
      /\.aliexpress\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export async function scrapeAliExpressProduct(
  url: string
): Promise<ScrapedProduct> {
  if (!isAliExpressUrl(url)) {
    throw new Error("URL must be from aliexpress.com");
  }

  // Normalize to global English URL (ar.aliexpress.com → www.aliexpress.com)
  const normalizedUrl = normalizeAliExpressUrl(url);

  // Try multiple User-Agents — search engine bots get better HTML from AliExpress
  const attempts = [
    {
      url: normalizedUrl,
      ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
    {
      url: normalizedUrl,
      ua: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    },
    {
      url: normalizedUrl,
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    {
      url: url, // Original URL as last resort
      ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  ];

  let bestHtml = "";
  let bestScore = 0;

  for (const attempt of attempts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(attempt.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": attempt.ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });

      if (!response.ok) continue;

      const html = await response.text();

      // Score this response based on useful content
      let score = 0;
      if (html.includes("og:title")) score += 3;
      if (html.includes("og:image")) score += 3;
      if (html.includes("imagePathList")) score += 5;
      if (html.includes("product-title")) score += 4;
      if (html.includes('"subject"')) score += 4;
      if (html.includes("ld+json")) score += 3;
      if (html.includes("alicdn.com/kf/")) score += 2;

      if (score > bestScore) {
        bestScore = score;
        bestHtml = html;
      }

      // Good enough — stop trying
      if (score >= 8) break;
    } catch {
      // Try next attempt
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!bestHtml) {
    throw new Error("Failed to fetch AliExpress page. The page may be unavailable.");
  }

  const html = bestHtml;

  // 1. Extract directly from AliExpress DOM
  const dom = extractAliExpressDom(html);

  // 2. Try JSON-LD
  const jsonLd = extractJsonLd(html);

  // 3. Try Open Graph
  const og = extractOpenGraph(html);

  // 4. Fallback
  const fallback = extractFallback(html);

  // 5. Extract gallery images
  const galleryImages = extractGalleryImages(html);

  // 6. Extract price
  const price = jsonLd.price || extractAliExpressPrice(html);

  // Merge results with priority: DOM > JSON-LD > OG > Fallback
  const title = dom.title || jsonLd.title || og.title || fallback.title;
  const description = dom.description || jsonLd.description || og.description || fallback.description;
  const siteName = og.siteName || "AliExpress";

  // Merge & deduplicate images: gallery first, then JSON-LD, then OG
  const allImages = [...galleryImages, ...jsonLd.images, ...og.images];
  const seen = new Set<string>();
  const images: string[] = [];
  for (const img of allImages) {
    const resolved = resolveUrl(img, normalizedUrl);
    if (!seen.has(resolved) && resolved.startsWith("http")) {
      seen.add(resolved);
      images.push(resolved);
    }
    if (images.length >= 10) break;
  }

  return { title, description, images, siteName, price };
}

export function isFacebookMarketplaceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const validHosts = /^(www\.|m\.|web\.)?facebook\.com$|^fb\.com$/i;
    if (!validHosts.test(parsed.hostname)) return false;
    return /\/marketplace\/item\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function extractFacebookPrice(text: string): number | null {
  if (!text) return null;

  const patterns = [
    /DZD\s*([\d\s,.]+)/i,
    /DA\s*([\d\s,.]+)/i,
    /([\d\s,.]+)\s*DZD/i,
    /([\d\s,.]+)\s*DA\b/i,
    /([\d\s,.]+)\s*دج/,
    /(?:price|prix)[:\s]*([\d\s,.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const cleaned = match[1].replace(/[\s,]/g, "").replace(/\.(?=\d{3})/g, "");
      const value = parseFloat(cleaned);
      if (value > 0 && value < 100_000_000) return value;
    }
  }

  return null;
}

function toMobileFacebookUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hostname = "m.facebook.com";
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function scrapeFacebookProduct(
  url: string
): Promise<ScrapedProduct> {
  if (!isFacebookMarketplaceUrl(url)) {
    throw new Error("URL must be from Facebook Marketplace");
  }

  const mobileUrl = toMobileFacebookUrl(url);
  const attempts = [
    {
      url: mobileUrl,
      ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
    {
      url: mobileUrl,
      ua: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    },
    {
      url: mobileUrl,
      ua: "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    },
    {
      url,
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
  ];

  let html = "";
  let lastError: string | null = null;

  for (const attempt of attempts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(attempt.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": attempt.ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,ar;q=0.8,fr;q=0.7",
        },
        redirect: "follow",
      });

      if (response.ok) {
        html = await response.text();
        if (html.includes("og:title") || html.includes("<title")) {
          break;
        }
      }
      lastError = `HTTP ${response.status}`;
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Fetch failed";
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!html) {
    throw new Error(`Failed to fetch Facebook page: ${lastError}`);
  }

  const jsonLd = extractJsonLd(html);
  const og = extractOpenGraph(html);
  const fallback = extractFallback(html);

  let title = jsonLd.title || og.title || fallback.title;
  const description = jsonLd.description || og.description || fallback.description;
  const siteName = "Facebook Marketplace";

  if (title) {
    title = title
      .replace(/\s*[|\-–—]\s*Facebook\s*(?:Marketplace)?.*$/i, "")
      .replace(/\s*Facebook\s*(?:Marketplace)?\s*$/i, "")
      .trim() || title;
  }

  const allImages = [...jsonLd.images, ...og.images];
  const seen = new Set<string>();
  const images: string[] = [];
  for (const img of allImages) {
    const resolved = resolveUrl(img, url);
    if (!seen.has(resolved) && resolved.startsWith("http")) {
      seen.add(resolved);
      images.push(resolved);
    }
    if (images.length >= 10) break;
  }

  const price = jsonLd.price || extractFacebookPrice(og.description || "") ||
    extractFacebookPrice(fallback.description || "") ||
    extractFacebookPrice(html);

  return { title, description, images, siteName, price };
}
