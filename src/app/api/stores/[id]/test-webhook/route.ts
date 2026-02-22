import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, notFound } from "@/lib/auth-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const store = await prisma.store.findFirst({
      where: { id, ownerId: user.id },
      select: { sheetsWebhookUrl: true },
    });
    if (!store) return notFound("Store not found");

    if (!store.sheetsWebhookUrl) {
      return NextResponse.json({ error: "No webhook URL configured" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(store.sheetsWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: "TEST",
        date: new Date().toISOString(),
        productTitle: "Test Product",
        customerName: "Test",
        phone: "0000",
        address: "Test",
        quantity: 1,
        variants: "",
        status: "TEST",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "Webhook returned an error" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reach webhook" }, { status: 502 });
  }
}
