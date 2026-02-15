import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest, demoForbidden, SUBSCRIPTION_PRICES } from "@/lib/auth-helpers";
import { isDemoUser } from "@/lib/demo";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const requests = await prisma.upgradeRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (isDemoUser(user)) return demoForbidden();

  // Check for existing pending request
  const existing = await prisma.upgradeRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });

  if (existing) {
    return badRequest("You already have a pending upgrade request. Please wait for admin review.");
  }

  const { paymentProof, duration } = await req.json();

  if (!paymentProof || typeof paymentProof !== "string") {
    return badRequest("Payment proof screenshot is required");
  }

  const selectedDuration = duration === "YEARLY" ? "YEARLY" : "MONTHLY";

  const request = await prisma.upgradeRequest.create({
    data: {
      userId: user.id,
      paymentProof,
      duration: selectedDuration,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
