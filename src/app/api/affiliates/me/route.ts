import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  generateReferralCode,
} from "@/lib/auth-helpers";

export async function GET() {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) return unauthorized();

    const userId = sessionUser.id;

    // Fetch user with referralCode
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    // Auto-generate referral code on first visit
    if (!user?.referralCode) {
      let code: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateReferralCode();
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { referralCode: candidate },
          });
          code = candidate;
          break;
        } catch {
          // Unique constraint collision, retry
        }
      }
      if (!code) {
        return NextResponse.json(
          { error: "Failed to generate referral code" },
          { status: 500 }
        );
      }
      user = { referralCode: code };
    }

    // Get referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        referred: {
          select: { email: true, createdAt: true },
        },
      },
    });

    // Get earnings
    const earnings = await prisma.referralEarning.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Compute stats
    const totalReferrals = referrals.length;
    const totalTokensEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = earnings
      .filter((e) => new Date(e.createdAt) >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    const activeReferrals = referrals.filter((r) => r.status === "SIGNED_UP").length;

    // Chart data: last 12 weeks (weekly)
    const weeklyData: { label: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEarnings = earnings
        .filter((e) => {
          const d = new Date(e.createdAt);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      const label = `W${12 - i}`;
      weeklyData.push({ label, value: weekEarnings });
    }

    // Chart data: last 6 months (monthly)
    const monthlyData: { label: string; value: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      const monthEarnings = earnings
        .filter((e) => {
          const d = new Date(e.createdAt);
          return d >= monthDate && d < monthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      monthlyData.push({
        label: monthNames[monthDate.getMonth()],
        value: monthEarnings,
      });
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      stats: {
        totalReferrals,
        totalTokensEarned,
        thisMonthEarnings,
        activeReferrals,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        email: r.referred.email,
        status: r.status,
        createdAt: r.createdAt,
      })),
      earnings: earnings.map((e) => ({
        id: e.id,
        amount: e.amount,
        description: e.description,
        createdAt: e.createdAt,
      })),
      chart: {
        weekly: weeklyData,
        monthly: monthlyData,
      },
    });
  } catch (error) {
    console.error("Affiliates API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
