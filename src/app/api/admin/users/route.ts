import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_DURATIONS_MS } from "@/lib/auth-helpers";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
      tokenBalance: { select: { balance: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      tokens: u.tokenBalance?.balance ?? 0,
      tokenBalance: undefined,
    }))
  );
}

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newPlan = user.plan === "FREE" ? "PRO" : "FREE";
  const newExpiry = newPlan === "PRO"
    ? new Date(Date.now() + SUBSCRIPTION_DURATIONS_MS.MONTHLY)
    : null;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      plan: newPlan,
      planExpiresAt: newExpiry,
    },
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
    },
  });

  return NextResponse.json(updatedUser);
}
