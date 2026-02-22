import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/auth-helpers";
import { getAppConfig } from "@/lib/app-config";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const packId: string = body.packId;

  if (packId !== "week" && packId !== "month") {
    return badRequest("Invalid pack. Must be 'week' or 'month'");
  }

  const cfg = await getAppConfig();
  const pack = packId === "week" ? cfg.adFreePacks.week : cfg.adFreePacks.month;
  const cost = pack.cost;
  const days = pack.days;

  // Check token balance
  const tokenBalance = await prisma.tokenBalance.findUnique({
    where: { userId: user.id },
  });

  const currentBalance = tokenBalance?.balance ?? 0;
  if (currentBalance < cost) {
    return badRequest(`Insufficient tokens. Need ${cost}, have ${currentBalance}`);
  }

  // Get current adFreeUntil to support stacking
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { adFreeUntil: true },
  });

  const now = new Date();
  const baseDate = currentUser?.adFreeUntil && currentUser.adFreeUntil > now
    ? currentUser.adFreeUntil
    : now;
  const newAdFreeUntil = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  // Transaction: deduct tokens + log transaction + update adFreeUntil
  await prisma.$transaction([
    prisma.tokenBalance.upsert({
      where: { userId: user.id },
      create: { userId: user.id, balance: -cost },
      update: { balance: { decrement: cost } },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        type: "AD_FREE",
        amount: -cost,
        description: `Ad-free ${packId} (${days} days)`,
        metadata: { packId, days },
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { adFreeUntil: newAdFreeUntil },
    }),
  ]);

  return NextResponse.json({ adFreeUntil: newAdFreeUntil.toISOString() });
}
