import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest, calculateNewExpiry } from "@/lib/auth-helpers";
import { getAppConfig } from "@/lib/app-config";

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

  const upgradeRequest = await prisma.upgradeRequest.findUnique({
    where: { id },
  });

  if (!upgradeRequest) {
    return badRequest("Upgrade request not found");
  }

  if (upgradeRequest.status !== "PENDING") {
    return badRequest("This request has already been reviewed");
  }

  if (action === "approve") {
    // Get the requesting user to check their current expiry and bonus status
    const requestingUser = await prisma.user.findUnique({
      where: { id: upgradeRequest.userId },
    });

    const newExpiry = calculateNewExpiry(
      requestingUser?.planExpiresAt,
      upgradeRequest.duration
    );

    const cfg = await getAppConfig();
    const isFirstPro = !requestingUser?.receivedProBonus;

    if (isFirstPro) {
      // Update request status, user plan, and grant bonus tokens
      const [updatedReq] = await prisma.$transaction([
        prisma.upgradeRequest.update({
          where: { id },
          data: { status: "APPROVED", reviewedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: upgradeRequest.userId },
          data: { plan: "PRO", planExpiresAt: newExpiry, receivedProBonus: true },
        }),
        prisma.tokenBalance.upsert({
          where: { userId: upgradeRequest.userId },
          create: { userId: upgradeRequest.userId, balance: cfg.proBonusTokens },
          update: { balance: { increment: cfg.proBonusTokens } },
        }),
        prisma.tokenTransaction.create({
          data: {
            userId: upgradeRequest.userId,
            type: "PRO_BONUS",
            amount: cfg.proBonusTokens,
            description: `PRO subscription welcome bonus (${cfg.proBonusTokens} tokens)`,
          },
        }),
      ]);
      return NextResponse.json(updatedReq);
    }

    const [updatedRequest] = await prisma.$transaction([
      prisma.upgradeRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: upgradeRequest.userId },
        data: { plan: "PRO", planExpiresAt: newExpiry },
      }),
    ]);

    return NextResponse.json(updatedRequest);
  } else {
    const updatedRequest = await prisma.upgradeRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason || null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(updatedRequest);
  }
}
