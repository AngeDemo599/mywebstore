"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

export function useEffectivePlan() {
  const { data: session, status } = useSession();

  const plan = session?.user?.plan || "FREE";
  const planExpiresAt = session?.user?.planExpiresAt;

  return useMemo(() => {
    const now = new Date();

    let effectivePlan: "FREE" | "PRO" = "FREE";
    if (plan === "PRO") {
      if (!planExpiresAt) {
        effectivePlan = "PRO";
      } else {
        const expiresAt = new Date(planExpiresAt);
        effectivePlan = expiresAt > now ? "PRO" : "FREE";
      }
    }

    let remainingDays = Infinity;
    if (planExpiresAt) {
      const expiresAt = new Date(planExpiresAt);
      const diff = expiresAt.getTime() - now.getTime();
      remainingDays = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
    }

    return {
      effectivePlan,
      plan,
      planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : null,
      remainingDays,
      isExpired: plan === "PRO" && effectivePlan === "FREE",
      isExpiringSoon: effectivePlan === "PRO" && remainingDays <= 14,
      isExpiringUrgent: effectivePlan === "PRO" && remainingDays <= 7,
      status,
    };
  }, [plan, planExpiresAt, status]);
}
