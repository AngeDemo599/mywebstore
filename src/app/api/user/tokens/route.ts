import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const tokenBalance = await prisma.tokenBalance.upsert({
    where: { userId: user.id },
    create: { userId: user.id, balance: 0 },
    update: {},
  });

  const transactions = await prisma.tokenTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    balance: tokenBalance.balance,
    transactions,
  });
}
