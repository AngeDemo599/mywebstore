import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  forbidden,
  notFound,
} from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  if (user.plan === "FREE") {
    return forbidden(
      "Order management requires a PRO plan. Upgrade to PRO (5000 DA/month) to unlock more stores, products, and orders."
    );
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, product: { store: { ownerId: user.id } } },
  });
  if (!order) return notFound("Order not found");

  const { status } = await req.json();
  const validStatuses = ["PENDING", "CONFIRMED", "IN_DELIVERY", "DELIVERED", "RETURNED"];
  if (!validStatuses.includes(status)) {
    return badRequest("Invalid status");
  }

  // If changing to RETURNED and not already RETURNED, restore stock
  if (status === "RETURNED" && order.status !== "RETURNED") {
    const product = await prisma.product.findUnique({
      where: { id: order.productId },
      select: { trackStock: true },
    });

    if (product?.trackStock) {
      await prisma.$transaction(async (tx) => {
        // Create RETURN movement
        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: "RETURN",
            quantity: order.quantity,
            note: `Order ${id} returned`,
          },
        });

        // Increment stock
        await tx.product.update({
          where: { id: order.productId },
          data: { stockQuantity: { increment: order.quantity } },
        });

        // Update order status
        await tx.order.update({
          where: { id },
          data: { status },
        });
      });

      const updated = await prisma.order.findUnique({ where: { id } });
      return NextResponse.json(updated);
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
