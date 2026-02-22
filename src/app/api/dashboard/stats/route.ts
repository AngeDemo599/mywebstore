import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  getEffectivePlan,
  getAnalyticsAccess,
  unauthorized,
} from "@/lib/auth-helpers";

export async function GET() {
  const sessionUser = await getAuthenticatedUser();
  if (!sessionUser) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return unauthorized();

  const effectivePlan = getEffectivePlan(user.plan, user.planExpiresAt);
  const isPro = effectivePlan === "PRO";

  // If PRO expired, clear Google Sheets webhook (PRO-only feature)
  if (user.plan === "PRO" && !isPro) {
    prisma.store.updateMany({
      where: { ownerId: user.id, sheetsWebhookUrl: { not: null } },
      data: { sheetsWebhookUrl: null },
    }).catch(() => {});
  }

  // Get user's store IDs
  const userStores = await prisma.store.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });
  const storeIds = userStores.map((s: (typeof userStores)[number]) => s.id);

  if (storeIds.length === 0) {
    return NextResponse.json({
      products: { total: 0, active: 0, outOfStock: 0, lowStockProducts: [] },
      orders: { total: 0, todayCount: 0, thisWeekCount: 0, byStatus: {}, recentOrders: [] },
      revenue: { deliveredCount: 0, estimatedTotal: 0 },
      topProducts: [],
      isPro,
    });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockProducts,
    totalOrders,
    todayOrders,
    weekOrders,
    ordersByStatus,
    recentOrders,
    revenueResult,
    topProductsResult,
  ] = await Promise.all([
    // 1. Total products
    prisma.product.count({
      where: { storeId: { in: storeIds } },
    }),

    // 2. Active products
    prisma.product.count({
      where: { storeId: { in: storeIds }, isActive: true },
    }),

    // 3. Out of stock (trackStock enabled AND stockQuantity = 0)
    prisma.product.count({
      where: { storeId: { in: storeIds }, trackStock: true, stockQuantity: 0 },
    }),

    // 4. Low stock products (raw SQL: stockQuantity <= lowStockThreshold AND stockQuantity > 0)
    prisma.$queryRawUnsafe<
      Array<{ id: string; title: string; stockQuantity: number; lowStockThreshold: number }>
    >(
      `SELECT p.id, p.title, p."stockQuantity", p."lowStockThreshold"
       FROM "Product" p
       WHERE p."storeId" = ANY($1::text[])
         AND p."trackStock" = true
         AND p."stockQuantity" <= p."lowStockThreshold"
       ORDER BY p."stockQuantity" ASC
       LIMIT 10`,
      storeIds
    ),

    // 5. Total orders
    prisma.order.count({
      where: { product: { storeId: { in: storeIds } } },
    }),

    // 6. Today's orders
    prisma.order.count({
      where: { product: { storeId: { in: storeIds } }, createdAt: { gte: todayStart } },
    }),

    // 7. This week's orders
    prisma.order.count({
      where: { product: { storeId: { in: storeIds } }, createdAt: { gte: weekStart } },
    }),

    // 8. Orders grouped by status
    prisma.order.groupBy({
      by: ["status"],
      where: { product: { storeId: { in: storeIds } } },
      _count: true,
    }),

    // 9. Recent 5 orders with product title
    prisma.order.findMany({
      where: { product: { storeId: { in: storeIds } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        quantity: true,
        createdAt: true,
        product: { select: { title: true } },
      },
    }),

    // 10. Revenue: SUM(quantity * price) for DELIVERED orders
    prisma.$queryRawUnsafe<Array<{ count: bigint; total: number | null }>>(
      `SELECT COUNT(*) as count, SUM(o.quantity * COALESCE(p.price, 0)) as total
       FROM "Order" o
       JOIN "Product" p ON o."productId" = p.id
       WHERE p."storeId" = ANY($1::text[]) AND o.status = 'DELIVERED'`,
      storeIds
    ),

    // 11. Top 3 products by order count
    prisma.order.groupBy({
      by: ["productId"],
      where: { product: { storeId: { in: storeIds } } },
      _count: true,
      orderBy: { _count: { productId: "desc" } },
      take: 3,
    }),
  ]);

  // Build byStatus map
  const byStatus: Record<string, number> = {};
  ordersByStatus.forEach((o: (typeof ordersByStatus)[number]) => {
    byStatus[o.status] = o._count;
  });

  // Get product titles for top products
  const topProductIds = topProductsResult.map((p: (typeof topProductsResult)[number]) => p.productId);
  const topProductDetails = topProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, title: true },
      })
    : [];
  const productMap = Object.fromEntries(topProductDetails.map((p: (typeof topProductDetails)[number]) => [p.id, p.title]));

  const response: Record<string, unknown> = {
    products: {
      total: totalProducts,
      active: activeProducts,
      outOfStock: outOfStockProducts,
      lowStockProducts: lowStockProducts.map((p: (typeof lowStockProducts)[number]) => ({
        id: p.id,
        title: p.title,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
      })),
    },
    orders: {
      total: totalOrders,
      todayCount: todayOrders,
      thisWeekCount: weekOrders,
      byStatus,
      recentOrders: recentOrders.map((o: (typeof recentOrders)[number]) => ({
        id: o.id,
        status: o.status,
        quantity: o.quantity,
        createdAt: o.createdAt,
        productTitle: o.product.title,
      })),
    },
    revenue: {
      deliveredCount: Number(revenueResult[0]?.count || 0),
      estimatedTotal: Math.round(Number(revenueResult[0]?.total || 0)),
    },
    topProducts: topProductsResult.map((p: (typeof topProductsResult)[number]) => ({
      id: p.productId,
      title: productMap[p.productId] || "Unknown",
      orderCount: p._count,
    })),
    isPro,
  };

  // PRO-only analytics summary
  if (isPro) {
    const access = getAnalyticsAccess(
      user.plan,
      user.planExpiresAt,
      user.analyticsAccessType,
      user.analyticsTrialEndsAt
    );

    if (access.hasAccess && storeIds.length > 0) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [pageViews7d, uniqueVisitors7d, totalOrders7d, dailyOrders7d] = await Promise.all([
        // Page views last 7d
        prisma.analyticsEvent.count({
          where: { storeId: { in: storeIds }, eventType: "PAGE_VIEW", createdAt: { gte: sevenDaysAgo } },
        }),

        // Unique visitors last 7d
        prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(DISTINCT "visitorId") as count
           FROM "AnalyticsEvent"
           WHERE "storeId" = ANY($1::text[]) AND "eventType" = 'PAGE_VIEW' AND "createdAt" >= $2`,
          storeIds,
          sevenDaysAgo
        ),

        // Orders last 7d
        prisma.order.count({
          where: { product: { storeId: { in: storeIds } }, createdAt: { gte: sevenDaysAgo } },
        }),

        // Daily orders last 7d
        prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
          `SELECT DATE(o."createdAt") as date, COUNT(*) as count
           FROM "Order" o
           JOIN "Product" p ON o."productId" = p.id
           WHERE p."storeId" = ANY($1::text[]) AND o."createdAt" >= $2
           GROUP BY DATE(o."createdAt") ORDER BY date`,
          storeIds,
          sevenDaysAgo
        ),
      ]);

      const views = pageViews7d;
      const visitors = Number(uniqueVisitors7d[0]?.count || 0);
      const conversionRate = views > 0 ? parseFloat(((totalOrders7d / views) * 100).toFixed(1)) : 0;

      response.analytics = {
        pageViews7d: views,
        uniqueVisitors7d: visitors,
        conversionRate,
        dailyOrders: dailyOrders7d.map((d: (typeof dailyOrders7d)[number]) => ({ date: d.date, count: Number(d.count) })),
      };
    }
  }

  return NextResponse.json(response);
}
