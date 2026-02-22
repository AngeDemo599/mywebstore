import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  getEffectivePlan,
  unauthorized,
  badRequest,
} from "@/lib/auth-helpers";
import { getAppConfig, buildTokenPacks } from "@/lib/app-config";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const purchases = await prisma.tokenPurchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(purchases);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { packId, paymentProof } = await req.json();

  if (!packId || !paymentProof) {
    return badRequest("packId and paymentProof are required");
  }

  const cfg = await getAppConfig();
  const { TOKEN_PACKS, TOKEN_PACKS_PRO } = buildTokenPacks(cfg);

  const pack = TOKEN_PACKS[packId as keyof typeof TOKEN_PACKS];
  if (!pack) {
    return badRequest("Invalid pack ID");
  }

  // Check for existing pending purchase
  const pendingPurchase = await prisma.tokenPurchase.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });

  if (pendingPurchase) {
    return badRequest("You already have a pending token purchase request");
  }

  const effectivePlan = getEffectivePlan(user.plan, user.planExpiresAt);
  const packs = effectivePlan === "PRO" ? TOKEN_PACKS_PRO : TOKEN_PACKS;
  const selectedPack = packs[packId as keyof typeof packs];

  const purchase = await prisma.tokenPurchase.create({
    data: {
      userId: user.id,
      packId,
      tokens: selectedPack.tokens,
      priceDA: pack.priceDA,
      paymentProof,
    },
  });

  return NextResponse.json(purchase);
}
