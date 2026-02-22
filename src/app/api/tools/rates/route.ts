import { NextResponse } from "next/server";

interface Rates {
  usd: { buy: number; sell: number };
  eur: { buy: number; sell: number };
  updatedAt: string;
}

let cache: { data: Rates; fetchedAt: number } | null = null;

function nextMidnight(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
}

function isCacheFresh(): boolean {
  if (!cache) return false;
  const today = new Date();
  const lastMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).getTime();
  return cache.fetchedAt >= lastMidnight;
}

/**
 * Extracts buy and sell rates from a currency section.
 *
 * HTML structure per currency:
 *   <div class="pull-right buy">
 *       <h1>239<span>.00</span></h1>
 *       ...BUY RATE...
 *   </div>
 *   ...
 *   <div class="pull-left sell">
 *       <h1>236<span>.00</span></h1>
 *       ...SELL RATE...
 *   </div>
 */
function extractRate(sectionHtml: string, type: "buy" | "sell"): number {
  // Match the buy or sell div, then capture the <h1>NUMBER<span>.DECIMAL</span></h1> inside it
  const divPattern = type === "buy"
    ? /class="pull-right buy">\s*<h1>(\d+)(?:<span>\.(\d+)<\/span>)?<\/h1>/i
    : /class="pull-left sell">\s*<h1>(\d+)(?:<span>\.(\d+)<\/span>)?<\/h1>/i;

  const match = sectionHtml.match(divPattern);
  if (!match) return 0;

  const integer = match[1];
  const decimal = match[2] || "0";
  return parseFloat(`${integer}.${decimal}`);
}

async function scrapeRates(): Promise<Rates> {
  const res = await fetch("https://devisesquare.com/", {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  const html = await res.text();

  // Split by <article> to isolate each currency section
  // Page order: POUND, EURO, US DOLLAR, CA DOLLAR
  const articles = html.split(/<article>/i);

  const usd = { buy: 0, sell: 0 };
  const eur = { buy: 0, sell: 0 };

  for (const article of articles) {
    if (/1\s*US\s*DOLLAR/i.test(article)) {
      usd.buy = extractRate(article, "buy");
      usd.sell = extractRate(article, "sell");
    } else if (/1\s*EURO/i.test(article)) {
      eur.buy = extractRate(article, "buy");
      eur.sell = extractRate(article, "sell");
    }
  }

  const timeMatch = html.match(/Last\s*update:\s*([^<]+)/i);
  const updatedAt = timeMatch ? timeMatch[1].trim() : new Date().toISOString();

  return { usd, eur, updatedAt };
}

export async function GET() {
  if (isCacheFresh() && cache) {
    return NextResponse.json(cache.data, {
      headers: {
        "Cache-Control": `public, max-age=${Math.floor((nextMidnight() - Date.now()) / 1000)}`,
      },
    });
  }

  try {
    const rates = await scrapeRates();

    if (rates.usd.buy > 0 && rates.eur.buy > 0) {
      cache = { data: rates, fetchedAt: Date.now() };
    }

    return NextResponse.json(rates, {
      headers: {
        "Cache-Control": `public, max-age=${Math.floor((nextMidnight() - Date.now()) / 1000)}`,
      },
    });
  } catch {
    if (cache) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json(
      { usd: { buy: 0, sell: 0 }, eur: { buy: 0, sell: 0 }, updatedAt: "" },
      { status: 502 }
    );
  }
}
