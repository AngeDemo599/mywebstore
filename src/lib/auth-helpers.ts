import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const PLAN_LIMITS = {
  FREE: { maxProducts: 5 },
  PRO: { maxProducts: 100 },
};

export const TOKEN_PACKS = {
  small:  { id: "small",  name: "Small",  tokens: 100,  priceDA: 1000 },
  medium: { id: "medium", name: "Medium", tokens: 500,  priceDA: 4500 },
  large:  { id: "large",  name: "Large",  tokens: 1000, priceDA: 8500 },
} as const;

export const TOKEN_PACKS_PRO = {
  small:  { ...TOKEN_PACKS.small,  tokens: 120 },
  medium: { ...TOKEN_PACKS.medium, tokens: 625 },
  large:  { ...TOKEN_PACKS.large,  tokens: 1250 },
} as const;

export const PRO_BONUS_TOKENS = 200;
export const REFERRAL_BONUS_TOKENS = 50;
export const REFERRAL_CODE_LENGTH = 8;
export const ORDER_UNLOCK_COST = 10;
export const PRO_EXTRA_PRODUCT_COST = 5;

export const SUBSCRIPTION_PRICES = {
  MONTHLY: 5000,
  YEARLY: 50000,
} as const;

export const SUBSCRIPTION_DURATIONS_MS = {
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  YEARLY: 365 * 24 * 60 * 60 * 1000,
} as const;

export function getEffectivePlan(
  plan: string | undefined | null,
  planExpiresAt: Date | string | null | undefined
): "FREE" | "PRO" {
  if (plan !== "PRO") return "FREE";
  if (!planExpiresAt) return "PRO"; // Legacy PRO users without expiry
  const expiresAt = typeof planExpiresAt === "string" ? new Date(planExpiresAt) : planExpiresAt;
  return expiresAt > new Date() ? "PRO" : "FREE";
}

export function calculateNewExpiry(
  currentExpiresAt: Date | string | null | undefined,
  duration: "MONTHLY" | "YEARLY"
): Date {
  const durationMs = SUBSCRIPTION_DURATIONS_MS[duration];
  const now = new Date();
  // If current expiry is still in the future, extend from it
  if (currentExpiresAt) {
    const current = typeof currentExpiresAt === "string" ? new Date(currentExpiresAt) : currentExpiresAt;
    if (current > now) {
      return new Date(current.getTime() + durationMs);
    }
  }
  // Otherwise start from now
  return new Date(now.getTime() + durationMs);
}

export function getRemainingDays(planExpiresAt: Date | string | null | undefined): number {
  if (!planExpiresAt) return Infinity;
  const expiresAt = typeof planExpiresAt === "string" ? new Date(planExpiresAt) : planExpiresAt;
  const diff = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getUserStores(userId: string) {
  return prisma.store.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductCount(userId: string) {
  return prisma.product.count({
    where: { store: { ownerId: userId } },
  });
}

export async function getUserTokenBalance(userId: string): Promise<number> {
  const tb = await prisma.tokenBalance.findUnique({ where: { userId } });
  return tb?.balance ?? 0;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message: string = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function demoForbidden() {
  return NextResponse.json({ error: "Demo account — modifications are not allowed" }, { status: 403 });
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getAnalyticsAccess(
  plan: string | undefined | null,
  planExpiresAt: Date | string | null | undefined,
  analyticsAccessType: string | undefined | null,
  analyticsTrialEndsAt: Date | string | null | undefined
): { hasAccess: boolean; reason: "pro" | "trial" | "none"; trialDaysLeft: number } {
  const effectivePlan = getEffectivePlan(plan, planExpiresAt);
  if (effectivePlan === "PRO") {
    return { hasAccess: true, reason: "pro", trialDaysLeft: 0 };
  }
  if (analyticsAccessType === "TRIAL" && analyticsTrialEndsAt) {
    const endsAt = typeof analyticsTrialEndsAt === "string" ? new Date(analyticsTrialEndsAt) : analyticsTrialEndsAt;
    const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    if (endsAt > new Date()) {
      return { hasAccess: true, reason: "trial", trialDaysLeft: daysLeft };
    }
  }
  return { hasAccess: false, reason: "none", trialDaysLeft: 0 };
}
