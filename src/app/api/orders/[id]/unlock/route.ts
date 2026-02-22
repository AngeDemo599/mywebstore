import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
} from "@/lib/auth-helpers";
import { getAppConfig } from "@/lib/app-config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id: orderId } = await params;

  // Verify the order exists and belongs to the user (via product -> store -> ownerId)
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      product: { store: { ownerId: user.id } },
    },
    include: {
      product: { select: { title: true, slug: true, store: { select: { name: true } } } },
    },
  });

  if (!order) {
    return badRequest("Order not found");
  }

  // Check if already unlocked
  const existingUnlock = await prisma.orderUnlock.findUnique({
    where: { userId_orderId: { userId: user.id, orderId } },
  });

  if (existingUnlock) {
    return badRequest("Order already unlocked");
  }

  // Check token balance
  const cfg = await getAppConfig();
  const tokenBalance = await prisma.tokenBalance.findUnique({
    where: { userId: user.id },
  });

  const currentBalance = tokenBalance?.balance ?? 0;
  if (currentBalance < cfg.orderUnlockCost) {
    return badRequest(`Insufficient tokens. Need ${cfg.orderUnlockCost}, have ${currentBalance}`);
  }

  // Transaction: deduct tokens + create unlock record
  await prisma.$transaction([
    prisma.tokenBalance.upsert({
      where: { userId: user.id },
      create: { userId: user.id, balance: -cfg.orderUnlockCost },
      update: { balance: { decrement: cfg.orderUnlockCost } },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        type: "UNLOCK_ORDER",
        amount: -cfg.orderUnlockCost,
        description: `Unlocked order for "${order.product.title}"`,
        metadata: { orderId },
      },
    }),
    prisma.orderUnlock.create({
      data: { userId: user.id, orderId },
    }),
  ]);

  // Return the full unmasked order
  return NextResponse.json({
    id: order.id,
    name: order.name,
    phone: order.phone,
    address: order.address,
    quantity: order.quantity,
    variants: order.variants,
    status: order.status,
    createdAt: order.createdAt,
    productId: order.productId,
    product: order.product,
    isUnlocked: true,
  });
}
