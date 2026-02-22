import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  notFound,
} from "@/lib/auth-helpers";
import { calculatePMP } from "@/lib/stock";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, store: { ownerId: user.id } },
    select: {
      id: true,
      trackStock: true,
      stockQuantity: true,
      costPrice: true,
      lowStockThreshold: true,
      valuationMethod: true,
    },
  });
  if (!product) return notFound("Product not found");

  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ...product, movements });
}

export async function POST(
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

  const { type, quantity, unitCost, note } = await req.json();

  if (!type || !["PURCHASE", "ADJUSTMENT"].includes(type)) {
    return badRequest("Type must be PURCHASE or ADJUSTMENT");
  }
  if (!quantity || quantity <= 0) {
    return badRequest("Quantity must be greater than 0");
  }
  if (type === "PURCHASE" && (unitCost === undefined || unitCost === null || unitCost < 0)) {
    return badRequest("Unit cost is required for purchases");
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentProduct = await tx.product.findUnique({
      where: { id },
      select: { stockQuantity: true, costPrice: true },
    });
    if (!currentProduct) throw new Error("Product not found");

    const totalCost = type === "PURCHASE" ? quantity * unitCost : null;

    const movement = await tx.stockMovement.create({
      data: {
        productId: id,
        type,
        quantity,
        unitCost: type === "PURCHASE" ? unitCost : null,
        totalCost,
        note: note || null,
      },
    });

    const newQuantity = currentProduct.stockQuantity + quantity;
    let newCostPrice = currentProduct.costPrice;

    if (type === "PURCHASE" && unitCost != null) {
      newCostPrice = calculatePMP(
        currentProduct.stockQuantity,
        currentProduct.costPrice || 0,
        quantity,
        unitCost
      );
    }

    await tx.product.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
        ...(newCostPrice !== undefined && { costPrice: newCostPrice }),
      },
    });

    return { movement, stockQuantity: newQuantity, costPrice: newCostPrice };
  });

  return NextResponse.json(result, { status: 201 });
}
