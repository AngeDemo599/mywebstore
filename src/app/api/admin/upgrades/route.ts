import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser || fullUser.role !== "ADMIN") {
    return unauthorized();
  }

  const requests = await prisma.upgradeRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, email: true, plan: true, planExpiresAt: true },
      },
    },
  });

  return NextResponse.json(requests);
}
