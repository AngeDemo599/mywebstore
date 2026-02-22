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
    // Remove "- AliExpress" or "| AliExpress" and anything after (including product IDs)
    .replace(/\s*[|\-–—]\s*AliExpress.*$/i, "")
    // Remove trailing product IDs like "200000345"
    .replace(/\s+\d{6,}$/, "")
    // Remove "AliExpress" if it appears at the end
    .replace(/\s*AliExpress\s*$/i, "")
    .trim();
}

function extractJsonLd(html: string): {
  title: string | null;
  description: string | null;
  images: string[];
} {
  const result = { title: null as string | null, description: null as string | null, images: [] as string[] };

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
  // Match both property= and name= attributes
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

/**
 * Strip all HTML tags from a string, leaving only text content.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract title and description directly from AliExpress DOM elements.
 * These are the most reliable sources on the actual product page:
 * - Title: <h1 data-pl="product-title">
 * - Description: <div id="nav-description"> or <div id="product-description">
 * - Also tries: "subject":"..." in embedded JSON data
 */
function extractAliExpressDom(html: string): {
  title: string | null;
  description: string | null;
} {
  let title: string | null = null;
  let description: string | null = null;

  // === TITLE extraction ===

  // Strategy 1: <h1 data-pl="product-title">...</h1> (primary, cleanest)
  const h1Match = /<h1[^>]*data-pl=["']product-title["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (h1Match?.[1]) {
    const cleaned = stripHtml(h1Match[1]).trim();
    if (cleaned) title = decodeHtmlEntities(cleaned);
  }

  // Strategy 2: <h1 class="...title...">...</h1> (class-based fallback)
  if (!title) {
    const h1ClassMatch = /<h1[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (h1ClassMatch?.[1]) {
      const cleaned = stripHtml(h1ClassMatch[1]).trim();
      if (cleaned) title = cleanTitle(decodeHtmlEntities(cleaned));
    }
  }

  // Strategy 3: "subject":"..." in embedded JS data (product title in AliExpress data)
  if (!title) {
    const subjectMatch = /"subject"\s*:\s*"([^"]+)"/i.exec(html);
    if (subjectMatch?.[1]) {
      title = cleanTitle(decodeHtmlEntities(subjectMatch[1]));
    }
  }

  // Strategy 4: "title":"..." in product data JSON
  if (!title) {
    const titleDataMatch = /"(?:productTitle|itemTitle)"\s*:\s*"([^"]+)"/i.exec(html);
    if (titleDataMatch?.[1]) {
      title = cleanTitle(decodeHtmlEntities(titleDataMatch[1]));
    }
  }

  // === DESCRIPTION extraction ===

  // Strategy 1: <div id="product-description">...</div> with content
  const descDivMatch = /<div[^>]*id=["']product-description["'][^>]*>([\s\S]*?)<\/div>\s*(?:<iframe|<\/div>)/i.exec(html);
  if (descDivMatch?.[1]) {
    const cleaned = stripHtml(descDivMatch[1]).trim();
    if (cleaned && cleaned.length > 10) {
      description = decodeHtmlEntities(cleaned);
    }
  }

  // Strategy 2: <div id="nav-description"> — extract all text inside
  if (!description) {
    const navDescMatch = /<div[^>]*id=["']nav-description["'][^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class=["'][^"']*(?:detail|spec|review)|$)/i.exec(html);
    if (navDescMatch?.[1]) {
      const cleaned = stripHtml(navDescMatch[1]).trim();
      // Filter out very short or boilerplate text (like just "Overview" / "نظرة عامة")
      if (cleaned && cleaned.length > 20) {
        description = decodeHtmlEntities(cleaned);
      }
    }
  }

  // Strategy 3: "description":"..." in embedded JS data
  if (!description) {
    const descDataMatch = /"(?:productDescription|itemDescription|descriptionModule)"\s*:\s*\{[^}]*"descriptionUrl"\s*:\s*"([^"]+)"/i.exec(html);
    if (descDataMatch?.[1]) {
      // This is a URL to the description — we note it but can't fetch it here
      // Fall through to other strategies
    }
  }

  // Strategy 4: "description":"<text>" in JSON data (inline description)
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

/**
 * Extract gallery images from AliExpress embedded JavaScript data.
 * AliExpress stores image galleries in JS objects like:
 * - window.runParams / data.imageModule.imagePathList
 * - "imagePathList":["//ae01.alicdn.com/..."]
 * - Direct alicdn.com product image URLs in script tags
 */
function extractGalleryImages(html: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (url: string) => {
    // Normalize
    let resolved = url.trim();
    if (resolved.startsWith("//")) resolved = `https:${resolved}`;
    if (!resolved.startsWith("http")) return;
    // Only include alicdn.com product images (skip tiny icons, logos)
    if (!resolved.includes("alicdn.com")) return;
    // Skip very small images (thumbnails with _50x50 etc.)
    if (/_\d{1,2}x\d{1,2}[.\-_]/.test(resolved)) return;
    if (!seen.has(resolved)) {
      seen.add(resolved);
      images.push(resolved);
    }
  };

  // Strategy 1: Extract imagePathList JSON arrays from embedded JS
  // Matches: "imagePathList":["//ae01.alicdn.com/kf/...jpg", ...]
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

  // Strategy 2: Extract from various JSON image array patterns
  // Matches: "images":["//ae01..."] or "galleryImages":["..."]
  const imageArrayRegex = /"(?:images|galleryImages|productImages)"\s*:\s*\[([^\]]+)\]/g;
  while ((match = imageArrayRegex.exec(html)) !== null) {
    const urlsStr = match[1];
    const urlRegex = /"([^"]+alicdn\.com[^"]+)"/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(urlsStr)) !== null) {
      addImage(urlMatch[1]);
    }
  }

  // Strategy 3: Extract individual image URLs from patterns like "imageUrl":"//ae01..."
  const singleImageRegex = /"(?:imageUrl|imagePath|imgUrl|originalImg)"\s*:\s*"([^"]+alicdn\.com[^"]+)"/g;
  while ((match = singleImageRegex.exec(html)) !== null) {
    addImage(match[1]);
  }

  // Strategy 4: Find all alicdn.com product image URLs in the HTML
  // These are typically high-res product photos in /kf/ paths
  const alicdnRegex = /(?:https?:)?\/\/[a-z0-9]+\.alicdn\.com\/kf\/[A-Za-z0-9_\-./]+\.(?:jpg|jpeg|png|webp)/gi;
  while ((match = alicdnRegex.exec(html)) !== null) {
    addImage(match[0]);
  }

  return images;
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8,fr;q=0.7",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: HTTP ${response.status}`);
    }

    html = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  // 1. Extract directly from AliExpress DOM (highest priority — cleanest data)
  const dom = extractAliExpressDom(html);

  // 2. Try JSON-LD
  const jsonLd = extractJsonLd(html);

  // 3. Try Open Graph
  const og = extractOpenGraph(html);

  // 4. Fallback (<title> tag, <meta description>)
  const fallback = extractFallback(html);

  // 5. Extract gallery images from embedded JS data
  const galleryImages = extractGalleryImages(html);

  // Merge results with priority: DOM > JSON-LD > OG > Fallback
  const title = dom.title || jsonLd.title || og.title || fallback.title;
  const description = dom.description || jsonLd.description || og.description || fallback.description;
  const siteName = og.siteName || "AliExpress";

  // Merge & deduplicate images: gallery first (most complete), then JSON-LD, then OG
  const allImages = [...galleryImages, ...jsonLd.images, ...og.images];
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

  return { title, description, images, siteName, price: null };
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

/**
 * Extract price from Facebook Marketplace description or page content.
 * Facebook often embeds price as "DZD 5,000", "DA 5000", "5 000 DA", etc.
 */
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

/**
 * Convert any Facebook URL variant to the mobile version (m.facebook.com)
 * which serves simpler HTML with OG meta tags more reliably.
 */
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

  // Try multiple URL variants and User-Agents to get past Facebook's blocks
  const mobileUrl = toMobileFacebookUrl(url);
  const attempts = [
    // 1. Mobile URL with Googlebot UA — Facebook serves OG tags to crawlers
    {
      url: mobileUrl,
      ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
    // 2. Mobile URL with Facebook crawler UA
    {
      url: mobileUrl,
      ua: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    },
    // 3. Mobile URL with normal mobile browser UA
    {
      url: mobileUrl,
      ua: "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    // 4. Original URL with desktop UA as last resort
    {
      url,
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,ar;q=0.8,fr;q=0.7",
        },
        redirect: "follow",
      });

      if (response.ok) {
        html = await response.text();
        // Check if we actually got useful content (has OG tags or title)
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

  // 1. Try JSON-LD structured data (highest priority)
  const jsonLd = extractJsonLd(html);

  // 2. Try Open Graph meta tags
  const og = extractOpenGraph(html);

  // 3. Fallback to <title> and <meta description>
  const fallback = extractFallback(html);

  // Merge with priority: JSON-LD > OG > Fallback
  let title = jsonLd.title || og.title || fallback.title;
  const description = jsonLd.description || og.description || fallback.description;
  const siteName = "Facebook Marketplace";

  // Clean Facebook-specific title suffixes
  if (title) {
    title = title
      .replace(/\s*[|\-–—]\s*Facebook\s*(?:Marketplace)?.*$/i, "")
      .replace(/\s*Facebook\s*(?:Marketplace)?\s*$/i, "")
      .trim() || title;
  }

  // Merge & deduplicate images
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

  // Extract price from description or page content
  const price = extractFacebookPrice(og.description || "") ||
    extractFacebookPrice(fallback.description || "") ||
    extractFacebookPrice(html);

  return { title, description, images, siteName, price };
}
