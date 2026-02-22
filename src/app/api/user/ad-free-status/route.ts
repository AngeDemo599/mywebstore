import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    // Unauthenticated users always see ads
    return NextResponse.json({ showAds: true, adFreeUntil: null });
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true, adFreeUntil: true },
  });

  if (!fullUser) {
    return NextResponse.json({ showAds: true, adFreeUntil: null });
  }

  const now = new Date();

  // PRO users with active plan never see ads
  const isPro =
    fullUser.plan === "PRO" &&
    (!fullUser.planExpiresAt || new Date(fullUser.planExpiresAt) > now);

  // Ad-free period active
  const isAdFree =
    fullUser.adFreeUntil && new Date(fullUser.adFreeUntil) > now;

  const showAds = !isPro && !isAdFree;

  return NextResponse.json({
    showAds,
    adFreeUntil: fullUser.adFreeUntil?.toISOString() ?? null,
  });
}
