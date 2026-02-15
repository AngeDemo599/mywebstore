import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound } from "@/lib/auth-helpers";
import { isDemoStore } from "@/lib/demo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
  });
  if (!store) return notFound("Store not found");

  const isDemo = isDemoStore(slug);
  const body = await req.json();
  const { productId, quantity, variants } = body;

  // For demo store, override customer data with fake info
  const name = isDemo ? "عميل تجريبي (Demo)" : body.name;
  const phone = isDemo ? "0500000000" : body.phone;
  const address = isDemo ? "عنوان تجريبي — هذا طلب وهمي" : body.address;

  if (!productId) return badRequest("Product ID is required");
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return badRequest("Name is required");
  }
  if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
    return badRequest("Phone is required");
  }
  if (!address || typeof address !== "string" || address.trim().length === 0) {
    return badRequest("Address is required");
  }
  if (!quantity || quantity < 1) {
    return badRequest("Quantity must be at least 1");
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
  });
  if (!product) return notFound("Product not found in this store");

  const order = await prisma.order.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      quantity: parseInt(quantity),
      productId,
      ...(variants && typeof variants === "object" ? { variants } : {}),
    },
  });

  return NextResponse.json(order, { status: 201 });
}
