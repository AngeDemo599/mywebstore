export async function sendOrderToGoogleSheets(
  webhookUrl: string,
  data: {
    orderId: string;
    date: string;
    productTitle: string;
    customerName: string;
    phone: string;
    address: string;
    quantity: number;
    variants: string;
    status: string;
  }
) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeout);
  } catch {
    // Fire-and-forget — never fail the order creation
  }
}
