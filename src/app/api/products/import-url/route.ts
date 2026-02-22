import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getEffectivePlan,
  unauthorized,
  badRequest,
  forbidden,
} from "@/lib/auth-helpers";
import {
  scrapeAliExpressProduct,
  isAliExpressUrl,
  scrapeFacebookProduct,
  isFacebookMarketplaceUrl,
} from "@/lib/scrape-product";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const plan = getEffectivePlan(user.plan, user.planExpiresAt);
    if (plan !== "PRO") {
      return forbidden("Import from URL is a PRO feature. Upgrade to PRO to use this.");
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return badRequest("URL is required");
    }

    const isAli = isAliExpressUrl(url);
    const isFb = isFacebookMarketplaceUrl(url);

    if (!isAli && !isFb) {
      return badRequest("Please enter a valid AliExpress or Facebook Marketplace URL");
    }

    const scraped = isAli
      ? await scrapeAliExpressProduct(url)
      : await scrapeFacebookProduct(url);

    if (!scraped.title && !scraped.description && scraped.images.length === 0) {
      return NextResponse.json(
        { error: "Could not extract product data from this URL. The page may be unavailable or protected." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title: scraped.title,
      description: scraped.description,
      images: scraped.images,
      sourceUrl: url,
      siteName: scraped.siteName,
      price: scraped.price,
    });
  } catch (error) {
    console.error("POST /api/products/import-url error:", error);
    const message = error instanceof Error ? error.message : "Failed to extract product data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
