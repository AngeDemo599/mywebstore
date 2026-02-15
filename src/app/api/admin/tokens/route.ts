import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      plan: true,
      tokenBalance: { select: { balance: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      plan: u.plan,
      tokenBalance: u.tokenBalance?.balance ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, amount, description } = await req.json();

  if (!userId || !amount || !description) {
    return NextResponse.json(
      { error: "userId, amount, and description are required" },
      { status: 400 }
    );
  }

  const parsedAmount = parseInt(amount);
  if (isNaN(parsedAmount) || parsedAmount === 0) {
    return NextResponse.json(
      { error: "Amount must be a non-zero integer" },
      { status: 400 }
    );
  }

  const type = parsedAmount > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT";

  await prisma.$transaction([
    prisma.tokenBalance.upsert({
      where: { userId },
      create: { userId, balance: parsedAmount },
      update: { balance: { increment: parsedAmount } },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId,
        type,
        amount: parsedAmount,
        description,
      },
    }),
  ]);

  const updated = await prisma.tokenBalance.findUnique({
    where: { userId },
  });

  return NextResponse.json({ userId, balance: updated?.balance ?? 0 });
}
