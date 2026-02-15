import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const isAdmin = user.role === "ADMIN";

  const notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    href: string;
    createdAt: string;
  }[] = [];

  let unreadCount = 0;

  // Pending orders (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pendingOrders = await prisma.order.findMany({
    where: {
      product: { store: { ownerId: user.id } },
      status: "PENDING",
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      product: { select: { title: true, store: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  for (const order of pendingOrders) {
    notifications.push({
      id: `order-${order.id}`,
      type: "order",
      title: "New Order",
      message: `${order.name} ordered "${order.product.title}" (x${order.quantity}) from ${order.product.store.name}`,
      href: "/dashboard/orders",
      createdAt: order.createdAt.toISOString(),
    });
  }
  unreadCount += pendingOrders.length;

  // --- ADMIN: show pending upgrade requests from all users ---
  if (isAdmin) {
    const pendingAdminUpgrades = await prisma.upgradeRequest.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const req of pendingAdminUpgrades) {
      notifications.push({
        id: `admin-upgrade-${req.id}`,
        type: "admin-upgrade",
        title: "Upgrade Request",
        message: `${req.user.email} requested a ${req.duration} PRO upgrade`,
        href: "/admin",
        createdAt: req.createdAt.toISOString(),
      });
    }
    unreadCount += pendingAdminUpgrades.length;

    // Pending token purchase requests
    const pendingTokenPurchases = await prisma.tokenPurchase.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const req of pendingTokenPurchases) {
      notifications.push({
        id: `admin-token-${req.id}`,
        type: "admin-upgrade",
        title: "Token Purchase",
        message: `${req.user.email} requested ${req.tokens} tokens (${req.packId} pack)`,
        href: "/admin",
        createdAt: req.createdAt.toISOString(),
      });
    }
    unreadCount += pendingTokenPurchases.length;
  }

  // --- USER: own upgrade request status updates ---
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const upgradeUpdates = await prisma.upgradeRequest.findMany({
    where: {
      userId: user.id,
      status: { in: ["APPROVED", "REJECTED"] },
      reviewedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { reviewedAt: "desc" },
    take: 5,
  });

  for (const req of upgradeUpdates) {
    notifications.push({
      id: `upgrade-${req.id}`,
      type: req.status === "APPROVED" ? "upgrade-approved" : "upgrade-rejected",
      title: req.status === "APPROVED" ? "Upgrade Approved" : "Upgrade Rejected",
      message:
        req.status === "APPROVED"
          ? "Your PRO upgrade request has been approved!"
          : `Your upgrade request was rejected${req.rejectionReason ? `: ${req.rejectionReason}` : ""}`,
      href: "/dashboard/upgrade",
      createdAt: (req.reviewedAt || req.createdAt).toISOString(),
    });
  }

  // USER: own pending upgrade requests
  const pendingUpgrades = await prisma.upgradeRequest.findMany({
    where: {
      userId: user.id,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  for (const req of pendingUpgrades) {
    notifications.push({
      id: `upgrade-pending-${req.id}`,
      type: "upgrade-pending",
      title: "Upgrade Pending",
      message: "Your upgrade request is waiting for admin review",
      href: "/dashboard/upgrade",
      createdAt: req.createdAt.toISOString(),
    });
  }
  unreadCount += pendingUpgrades.length;

  // Sort all by date
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({
    notifications: notifications.slice(0, 20),
    unreadCount,
  });
}
