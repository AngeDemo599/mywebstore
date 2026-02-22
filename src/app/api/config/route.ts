import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/app-config";

export async function GET() {
  const cfg = await getAppConfig();

  return NextResponse.json({
    subscriptionPrices: cfg.subscriptionPrices,
    tokenPacks: cfg.tokenPacks,
    tokenPacksPro: cfg.tokenPacksPro,
    proBonusTokens: cfg.proBonusTokens,
    planLimits: cfg.planLimits,
    orderUnlockCost: cfg.orderUnlockCost,
    adFreePacks: cfg.adFreePacks,
  });
}
