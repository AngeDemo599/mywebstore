import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_EVENT_TYPES = [
  "PAGE_VIEW",
  "SCROLL_50",
  "FORM_VIEW",
  "FORM_START",
  "FORM_SUBMIT",
  "IMAGE_CLICK",
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      storeId,
      eventType,
      sessionId,
      visitorId,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      deviceType,
      browser,
    } = body;

    if (!productId || !storeId || !eventType || !sessionId || !visitorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    // Extract geo data from headers (set by reverse proxy / CDN)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") || "";
    const country = req.headers.get("x-vercel-ip-country") ||
                    req.headers.get("cf-ipcountry") || null;
    const city = req.headers.get("x-vercel-ip-city") || null;

    // For Algerian stores, try to extract wilaya from address or use geo headers
    const wilaya = req.headers.get("x-vercel-ip-region") || null;

    await prisma.analyticsEvent.create({
      data: {
        productId,
        storeId,
        eventType: eventType as (typeof VALID_EVENT_TYPES)[number],
        sessionId,
        visitorId,
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        deviceType: deviceType || null,
        browser: browser || null,
        country,
        wilaya,
        city,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
