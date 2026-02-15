import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  getEffectivePlan,
  unauthorized,
  badRequest,
  TOKEN_PACKS,
  TOKEN_PACKS_PRO,
} from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser || fullUser.role !== "ADMIN") {
    return unauthorized();
  }

  const { id } = await params;
  const { action, rejectionReason } = await req.json();

  if (!action || !["approve", "reject"].includes(action)) {
    return badRequest("Action must be 'approve' or 'reject'");
  }

  const purchase = await prisma.tokenPurchase.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!purchase) {
    return badRequest("Token purchase not found");
  }

  if (purchase.status !== "PENDING") {
    return badRequest("This purchase has already been reviewed");
  }

  if (action === "approve") {
    // Determine token amount based on user's plan
    const purchasingUser = purchase.user;
    const effectivePlan = getEffectivePlan(purchasingUser.plan, purchasingUser.planExpiresAt);
    const packs = effectivePlan === "PRO" ? TOKEN_PACKS_PRO : TOKEN_PACKS;
    const pack = packs[purchase.packId as keyof typeof packs];
    const tokenAmount = pack ? pack.tokens : purchase.tokens;

    await prisma.$transaction([
      prisma.tokenPurchase.update({
        where: { id },
        data: { status: "APPROVED", tokens: tokenAmount, reviewedAt: new Date() },
      }),
      prisma.tokenBalance.upsert({
        where: { userId: purchase.userId },
        create: { userId: purchase.userId, balance: tokenAmount },
        update: { balance: { increment: tokenAmount } },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: purchase.userId,
          type: "PURCHASE",
          amount: tokenAmount,
          description: `Purchased ${purchase.packId} token pack (+${tokenAmount} tokens)`,
        },
      }),
    ]);

    const updated = await prisma.tokenPurchase.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, plan: true, planExpiresAt: true } } },
    });

    return NextResponse.json(updated);
  } else {
    const updated = await prisma.tokenPurchase.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason || null,
        reviewedAt: new Date(),
      },
      include: { user: { select: { id: true, email: true, plan: true, planExpiresAt: true } } },
    });

    return NextResponse.json(updated);
  }
}
