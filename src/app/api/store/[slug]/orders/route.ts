import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, getEffectivePlan } from "@/lib/auth-helpers";
import { isDemoStore } from "@/lib/demo";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: { owner: { select: { plan: true, planExpiresAt: true } } },
  });
  if (!store) return notFound("Store not found");

  const ownerPlan = getEffectivePlan(store.owner.plan, store.owner.planExpiresAt);
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

  // Check if product is active
  if (!product.isActive) {
    return NextResponse.json({ error: "This product is currently unavailable" }, { status: 400 });
  }

  const orderQuantity = parseInt(quantity);

  // Stock check (skip for demo store)
  if (!isDemo && product.trackStock) {
    if (product.stockQuantity < orderQuantity) {
      return NextResponse.json(
        { error: "Insufficient stock", available: product.stockQuantity, requested: orderQuantity },
        { status: 400 }
      );
    }

    // Use transaction for atomic stock deduction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Re-read stock inside transaction to prevent race conditions
        const freshProduct = await tx.product.findUnique({
          where: { id: productId },
          select: { stockQuantity: true, trackStock: true },
        });
        if (!freshProduct || !freshProduct.trackStock) throw new Error("Product not found");

        if (freshProduct.stockQuantity < orderQuantity) {
          throw new Error(`INSUFFICIENT_STOCK:${freshProduct.stockQuantity}`);
        }

        // Create SALE movement
        await tx.stockMovement.create({
          data: {
            productId,
            type: "SALE",
            quantity: orderQuantity,
            note: null,
          },
        });

        // Decrement stock
        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: { decrement: orderQuantity } },
        });

        // Create order
        const order = await tx.order.create({
          data: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            quantity: orderQuantity,
            productId,
            ...(variants && typeof variants === "object" ? { variants } : {}),
          },
        });

        return order;
      });

      if (store.sheetsWebhookUrl && ownerPlan === "PRO") {
        sendOrderToGoogleSheets(store.sheetsWebhookUrl, {
          orderId: result.id,
          date: new Date().toISOString(),
          productTitle: product.title,
          customerName: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          quantity: orderQuantity,
          variants: variants ? JSON.stringify(variants) : "",
          status: "PENDING",
        });
      }

      return NextResponse.json(result, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.startsWith("INSUFFICIENT_STOCK:")) {
        const available = parseInt(message.split(":")[1]) || 0;
        return NextResponse.json(
          { error: "Insufficient stock", available, requested: orderQuantity },
          { status: 400 }
        );
      }
      throw err;
    }
  }

  // Non-tracked or demo store: create order without stock deduction
  const order = await prisma.order.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      quantity: orderQuantity,
      productId,
      ...(variants && typeof variants === "object" ? { variants } : {}),
    },
  });

  if (store.sheetsWebhookUrl && ownerPlan === "PRO") {
    sendOrderToGoogleSheets(store.sheetsWebhookUrl, {
      orderId: order.id,
      date: new Date().toISOString(),
      productTitle: product.title,
      customerName: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      quantity: orderQuantity,
      variants: variants ? JSON.stringify(variants) : "",
      status: "PENDING",
    });
  }

  return NextResponse.json(order, { status: 201 });
}
