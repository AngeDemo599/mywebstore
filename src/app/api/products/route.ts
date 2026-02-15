import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  getAuthenticatedUser,
  getEffectivePlan,
  getProductCount,
  unauthorized,
  badRequest,
  forbidden,
  PLAN_LIMITS,
} from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const products = await prisma.product.findMany({
      where: { store: { ownerId: user.id } },
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const plan = getEffectivePlan(user.plan, user.planExpiresAt) as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan];
    const currentCount = await getProductCount(user.id);

    if (currentCount >= limits.maxProducts) {
      return forbidden(
        `You have reached the limit of ${limits.maxProducts} product(s) on the ${plan} plan. Upgrade to PRO (5000 DA/month) to unlock more stores, products, and orders.`
      );
    }

    const { title, description, price, images, storeId, variations, promotions, category, contentBlocks, shippingFee } = await req.json();

    if (!storeId) return badRequest("Store is required");

    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });
    if (!store) return badRequest("Store not found or not owned by you");

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return badRequest("Product title is required");
    }
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return badRequest("Product description is required");
    }

    let slug = slugify(title);
    const slugExists = await prisma.product.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    const parsedImages = Array.isArray(images)
      ? images
      : typeof images === "string"
        ? images.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: price ? parseFloat(price) : null,
        images: parsedImages,
        slug,
        storeId: store.id,
        ...(category && typeof category === "string" ? { category: category.trim() } : {}),
        ...(variations && Array.isArray(variations) ? { variations } : {}),
        ...(promotions && Array.isArray(promotions) ? { promotions } : {}),
        ...(contentBlocks && Array.isArray(contentBlocks) ? { contentBlocks } : {}),
        ...(shippingFee !== undefined && { shippingFee: shippingFee ? parseFloat(shippingFee) : null }),
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
