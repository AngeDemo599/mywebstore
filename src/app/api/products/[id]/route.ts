import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  notFound,
} from "@/lib/auth-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, store: { ownerId: user.id } },
  });
  if (!product) return notFound("Product not found");

  const { title, description, price, images, storeId, variations, promotions, category, contentBlocks, shippingFee, isActive, trackStock, lowStockThreshold, valuationMethod } = await req.json();

  if (storeId) {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });
    if (!store) return badRequest("Store not found or not owned by you");
  }

  const parsedImages = Array.isArray(images)
    ? images
    : typeof images === "string"
      ? images.split(",").map((s: string) => s.trim()).filter(Boolean)
      : undefined;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(price !== undefined && { price: price ? parseFloat(price) : null }),
      ...(parsedImages !== undefined && { images: parsedImages }),
      ...(storeId && { storeId }),
      ...(category !== undefined && { category: category ? category.trim() : null }),
      ...(variations !== undefined && { variations: variations }),
      ...(promotions !== undefined && { promotions: promotions }),
      ...(contentBlocks !== undefined && { contentBlocks: contentBlocks }),
      ...(shippingFee !== undefined && { shippingFee: shippingFee ? parseFloat(shippingFee) : null }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      ...(trackStock !== undefined && { trackStock: Boolean(trackStock) }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) || 5 }),
      ...(valuationMethod && ["PMP", "FIFO", "LIFO"].includes(valuationMethod) ? { valuationMethod } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, store: { ownerId: user.id } },
  });
  if (!product) return notFound("Product not found");

  await prisma.order.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ message: "Product deleted" });
}
