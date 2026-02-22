import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/auth-helpers";
import { getAppConfig, updateAppConfig, AppConfigData } from "@/lib/app-config";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser || fullUser.role !== "ADMIN") return unauthorized();

  const config = await getAppConfig();
  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser || fullUser.role !== "ADMIN") return unauthorized();

  const body = await req.json() as Partial<AppConfigData>;

  // Validate all numeric values are > 0
  const errors: string[] = [];

  function validatePositive(value: unknown, label: string) {
    if (value !== undefined && (typeof value !== "number" || value <= 0)) {
      errors.push(`${label} must be a positive number`);
    }
  }

  if (body.subscriptionPrices) {
    validatePositive(body.subscriptionPrices.monthly, "Monthly price");
    validatePositive(body.subscriptionPrices.yearly, "Yearly price");
  }

  if (body.tokenPacks) {
    for (const size of ["small", "medium", "large"] as const) {
      const pack = body.tokenPacks[size];
      if (pack) {
        validatePositive(pack.tokens, `${size} pack tokens`);
        validatePositive(pack.priceDA, `${size} pack price`);
      }
    }
  }

  if (body.tokenPacksPro) {
    for (const size of ["small", "medium", "large"] as const) {
      const pack = body.tokenPacksPro[size];
      if (pack) {
        validatePositive(pack.tokens, `${size} PRO pack tokens`);
      }
    }
  }

  validatePositive(body.proBonusTokens, "PRO bonus tokens");
  validatePositive(body.referralBonusTokens, "Referral bonus tokens");
  validatePositive(body.orderUnlockCost, "Order unlock cost");

  if (body.planLimits) {
    if (body.planLimits.free) validatePositive(body.planLimits.free.maxProducts, "Free max products");
    if (body.planLimits.pro) validatePositive(body.planLimits.pro.maxProducts, "PRO max products");
  }

  if (body.adFreePacks) {
    if (body.adFreePacks.week) validatePositive(body.adFreePacks.week.cost, "Ad-free week cost");
    if (body.adFreePacks.month) validatePositive(body.adFreePacks.month.cost, "Ad-free month cost");
  }

  if (errors.length > 0) {
    return badRequest(errors.join(", "));
  }

  const updated = await updateAppConfig(body);
  return NextResponse.json(updated);
}
