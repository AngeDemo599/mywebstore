import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  getAnalyticsAccess,
  unauthorized,
  forbidden,
} from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const sessionUser = await getAuthenticatedUser();
  if (!sessionUser) return unauthorized();

  // Fetch full user for analytics access fields
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return unauthorized();

  const access = getAnalyticsAccess(
    user.plan,
    user.planExpiresAt,
    user.analyticsAccessType,
    user.analyticsTrialEndsAt
  );

  if (!access.hasAccess) {
    // Auto-expire trial
    if (user.analyticsAccessType === "TRIAL") {
      await prisma.user.update({
        where: { id: user.id },
        data: { analyticsAccessType: "NONE" },
      });
    }
    return forbidden("Analytics access denied. Upgrade to PRO to unlock.");
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const period = searchParams.get("period") || "30d";

  // Calculate date range
  const now = new Date();
  let daysBack = 30;
  if (period === "7d") daysBack = 7;
  else if (period === "90d") daysBack = 90;
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  // Get user's store IDs
  const userStores = await prisma.store.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });
  const storeIds = storeId
    ? userStores.filter((s: (typeof userStores)[number]) => s.id === storeId).map((s: (typeof userStores)[number]) => s.id)
    : userStores.map((s: (typeof userStores)[number]) => s.id);

  if (storeIds.length === 0) {
    return NextResponse.json({ access, data: null });
  }

  // Run all queries in parallel
  const [
    eventCounts,
    dailyViews,
    topProducts,
    deviceBreakdown,
    browserBreakdown,
    referrerBreakdown,
    wilayaBreakdown,
    hourlyBreakdown,
    dailyOrders,
    totalOrders,
    funnelData,
  ] = await Promise.all([
    // 1. Overall event counts
    prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      where: { storeId: { in: storeIds }, createdAt: { gte: startDate } },
      _count: true,
    }),

    // 2. Daily page views
    prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
      `SELECT DATE("createdAt") as date, COUNT(*) as count
       FROM "AnalyticsEvent"
       WHERE "storeId" = ANY($1::text[]) AND "eventType" = 'PAGE_VIEW' AND "createdAt" >= $2
       GROUP BY DATE("createdAt") ORDER BY date`,
      storeIds,
      startDate
    ),

    // 3. Top products by views
    prisma.analyticsEvent.groupBy({
      by: ["productId"],
      where: { storeId: { in: storeIds }, eventType: "PAGE_VIEW", createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),

    // 4. Device breakdown
    prisma.analyticsEvent.groupBy({
      by: ["deviceType"],
      where: { storeId: { in: storeIds }, eventType: "PAGE_VIEW", createdAt: { gte: startDate } },
      _count: true,
    }),

    // 5. Browser breakdown
    prisma.analyticsEvent.groupBy({
      by: ["browser"],
      where: { storeId: { in: storeIds }, eventType: "PAGE_VIEW", createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { browser: "desc" } },
      take: 5,
    }),

    // 6. Referrer breakdown
    prisma.analyticsEvent.groupBy({
      by: ["referrer"],
      where: {
        storeId: { in: storeIds },
        eventType: "PAGE_VIEW",
        createdAt: { gte: startDate },
        referrer: { not: null },
      },
      _count: true,
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    }),

    // 7. Wilaya/region breakdown
    prisma.analyticsEvent.groupBy({
      by: ["wilaya"],
      where: {
        storeId: { in: storeIds },
        eventType: "PAGE_VIEW",
        createdAt: { gte: startDate },
        wilaya: { not: null },
      },
      _count: true,
      orderBy: { _count: { wilaya: "desc" } },
      take: 10,
    }),

    // 8. Hourly breakdown
    prisma.$queryRawUnsafe<Array<{ hour: number; count: bigint }>>(
      `SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
       FROM "AnalyticsEvent"
       WHERE "storeId" = ANY($1::text[]) AND "eventType" = 'PAGE_VIEW' AND "createdAt" >= $2
       GROUP BY EXTRACT(HOUR FROM "createdAt") ORDER BY hour`,
      storeIds,
      startDate
    ),

    // 9. Daily orders (from Orders table)
    prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
      `SELECT DATE(o."createdAt") as date, COUNT(*) as count
       FROM "Order" o
       JOIN "Product" p ON o."productId" = p.id
       WHERE p."storeId" = ANY($1::text[]) AND o."createdAt" >= $2
       GROUP BY DATE(o."createdAt") ORDER BY date`,
      storeIds,
      startDate
    ),

    // 10. Total orders
    prisma.order.count({
      where: { product: { storeId: { in: storeIds } }, createdAt: { gte: startDate } },
    }),

    // 11. Funnel data - unique visitors per stage
    prisma.$queryRawUnsafe<Array<{ eventType: string; unique_visitors: bigint }>>(
      `SELECT "eventType", COUNT(DISTINCT "visitorId") as unique_visitors
       FROM "AnalyticsEvent"
       WHERE "storeId" = ANY($1::text[]) AND "createdAt" >= $2
       AND "eventType" IN ('PAGE_VIEW', 'SCROLL_50', 'FORM_VIEW', 'FORM_START', 'FORM_SUBMIT')
       GROUP BY "eventType"`,
      storeIds,
      startDate
    ),
  ]);

  // Get product titles for top products
  const productIds = topProducts.map((p: (typeof topProducts)[number]) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, slug: true },
  });
  const productMap = Object.fromEntries(products.map((p: (typeof products)[number]) => [p.id, p]));

  // Get per-product orders for conversion calculation
  const productOrders = await prisma.order.groupBy({
    by: ["productId"],
    where: { product: { storeId: { in: storeIds } }, createdAt: { gte: startDate } },
    _count: true,
  });
  const ordersByProduct = Object.fromEntries(productOrders.map((o: (typeof productOrders)[number]) => [o.productId, o._count]));

  // Build event count map
  const eventCountMap: Record<string, number> = {};
  eventCounts.forEach((e: (typeof eventCounts)[number]) => {
    eventCountMap[e.eventType] = e._count;
  });

  // Build funnel
  const funnelMap: Record<string, number> = {};
  funnelData.forEach((f: (typeof funnelData)[number]) => {
    funnelMap[f.eventType] = Number(f.unique_visitors);
  });

  const totalPageViews = eventCountMap["PAGE_VIEW"] || 0;
  const conversionRate = totalPageViews > 0 ? ((totalOrders / totalPageViews) * 100).toFixed(1) : "0";

  // UTM campaign breakdown
  const utmBreakdown = await prisma.analyticsEvent.groupBy({
    by: ["utmSource", "utmCampaign"],
    where: {
      storeId: { in: storeIds },
      eventType: "PAGE_VIEW",
      createdAt: { gte: startDate },
      utmSource: { not: null },
    },
    _count: true,
    orderBy: { _count: { utmSource: "desc" } },
    take: 10,
  });

  // Unique visitors
  const uniqueVisitors = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(DISTINCT "visitorId") as count
     FROM "AnalyticsEvent"
     WHERE "storeId" = ANY($1::text[]) AND "eventType" = 'PAGE_VIEW' AND "createdAt" >= $2`,
    storeIds,
    startDate
  );

  // Day of week breakdown
  const dayOfWeekBreakdown = await prisma.$queryRawUnsafe<Array<{ dow: number; count: bigint }>>(
    `SELECT EXTRACT(DOW FROM "createdAt") as dow, COUNT(*) as count
     FROM "AnalyticsEvent"
     WHERE "storeId" = ANY($1::text[]) AND "eventType" = 'FORM_SUBMIT' AND "createdAt" >= $2
     GROUP BY EXTRACT(DOW FROM "createdAt") ORDER BY dow`,
    storeIds,
    startDate
  );

  const response = {
    access: {
      hasAccess: access.hasAccess,
      reason: access.reason,
      trialDaysLeft: access.trialDaysLeft,
    },
    data: {
      overview: {
        totalPageViews,
        uniqueVisitors: Number(uniqueVisitors[0]?.count || 0),
        totalOrders,
        conversionRate: parseFloat(conversionRate),
        formStarts: eventCountMap["FORM_START"] || 0,
        formSubmits: eventCountMap["FORM_SUBMIT"] || 0,
        imageClicks: eventCountMap["IMAGE_CLICK"] || 0,
        scrollDepth50: eventCountMap["SCROLL_50"] || 0,
      },
      funnel: {
        pageViews: funnelMap["PAGE_VIEW"] || 0,
        scrolled: funnelMap["SCROLL_50"] || 0,
        formViewed: funnelMap["FORM_VIEW"] || 0,
        formStarted: funnelMap["FORM_START"] || 0,
        formSubmitted: funnelMap["FORM_SUBMIT"] || 0,
      },
      dailyViews: dailyViews.map((d: (typeof dailyViews)[number]) => ({ date: d.date, count: Number(d.count) })),
      dailyOrders: dailyOrders.map((d: (typeof dailyOrders)[number]) => ({ date: d.date, count: Number(d.count) })),
      topProducts: topProducts.map((p: (typeof topProducts)[number]) => ({
        productId: p.productId,
        title: productMap[p.productId]?.title || "Unknown",
        slug: productMap[p.productId]?.slug || "",
        views: p._count,
        orders: ordersByProduct[p.productId] || 0,
        conversionRate: p._count > 0 ? (((ordersByProduct[p.productId] || 0) / p._count) * 100).toFixed(1) : "0",
      })),
      devices: deviceBreakdown.map((d: (typeof deviceBreakdown)[number]) => ({ type: d.deviceType || "unknown", count: d._count })),
      browsers: browserBreakdown.map((b: (typeof browserBreakdown)[number]) => ({ name: b.browser || "unknown", count: b._count })),
      referrers: referrerBreakdown.map((r: (typeof referrerBreakdown)[number]) => {
        // Extract domain from referrer URL
        let domain = r.referrer || "Direct";
        try {
          if (r.referrer && r.referrer.startsWith("http")) {
            domain = new URL(r.referrer).hostname;
          }
        } catch { /* keep original */ }
        return { source: domain, count: r._count };
      }),
      utmCampaigns: utmBreakdown.map((u: (typeof utmBreakdown)[number]) => ({
        source: u.utmSource || "unknown",
        campaign: u.utmCampaign || "(none)",
        count: u._count,
      })),
      geographic: wilayaBreakdown.map((w: (typeof wilayaBreakdown)[number]) => ({ wilaya: w.wilaya || "unknown", count: w._count })),
      hourly: hourlyBreakdown.map((h: (typeof hourlyBreakdown)[number]) => ({ hour: Number(h.hour), count: Number(h.count) })),
      dayOfWeek: dayOfWeekBreakdown.map((d: (typeof dayOfWeekBreakdown)[number]) => ({ day: Number(d.dow), count: Number(d.count) })),
    },
  };

  return NextResponse.json(response);
}
