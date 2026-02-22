import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  getEffectivePlan,
  unauthorized,
} from "@/lib/auth-helpers";

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0];
}

function maskString(str: string): string {
  if (str.length <= 2) return "*".repeat(str.length);
  return str[0] + "*".repeat(str.length - 1);
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const orders = await prisma.order.findMany({
    where: { product: { store: { ownerId: user.id } } },
    include: {
      product: { select: { title: true, slug: true, store: { select: { id: true, name: true } } } },
      unlocks: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const effectivePlan = getEffectivePlan(user.plan, user.planExpiresAt);

  if (effectivePlan === "FREE") {
    const result = orders.map((order: (typeof orders)[number]) => {
      const isUnlocked = order.unlocks.length > 0;
      return {
        id: order.id,
        name: isUnlocked ? order.name : getFirstName(order.name),
        phone: isUnlocked ? order.phone : maskString(order.phone),
        address: isUnlocked ? order.address : maskString(order.address),
        quantity: order.quantity,
        variants: order.variants,
        status: order.status,
        createdAt: order.createdAt,
        productId: order.productId,
        product: order.product,
        isUnlocked,
      };
    });
    return NextResponse.json(result);
  }

  // PRO users get all data with isUnlocked: true
  const result = orders.map((order: (typeof orders)[number]) => ({
    id: order.id,
    name: order.name,
    phone: order.phone,
    address: order.address,
    quantity: order.quantity,
    variants: order.variants,
    status: order.status,
    createdAt: order.createdAt,
    productId: order.productId,
    product: order.product,
    isUnlocked: true,
  }));
  return NextResponse.json(result);
}
