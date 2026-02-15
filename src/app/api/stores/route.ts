import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  forbidden,
  demoForbidden,
} from "@/lib/auth-helpers";
import { isDemoUser } from "@/lib/demo";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const VALID_BUTTON_STYLES = ["filled", "gradient", "outline", "pill"];
const VALID_RADIUS = ["none", "sm", "md", "lg", "full"];
const VALID_SHADOW = ["none", "sm", "md", "lg"];
const VALID_INPUT_STYLES = ["default", "underline", "filled"];
const VALID_SUMMARY_STYLES = ["card", "minimal", "bordered"];
const VALID_CARD_STYLES = ["flat", "shadow", "bordered", "glass"];
const VALID_IMAGE_ASPECTS = ["square", "video", "portrait"];
const VALID_COVER_STYLES = ["gradient", "blur", "solid", "wave"];
const VALID_HEADER_STYLES = ["classic", "centered", "banner", "minimal", "hero"];
const VALID_FONTS = ["system", "cairo", "inter", "tajawal"];
const VALID_HEADING_WEIGHTS = ["600", "700", "800", "900"];
const VALID_BODY_SIZES = ["sm", "base", "lg"];
const VALID_PRESETS = ["souqflow", "corporate", "ecommerce", "custom"];

function validateTheme(theme: unknown): string | null {
  if (!theme || typeof theme !== "object") return null;
  const t = theme as Record<string, unknown>;

  // v2 format
  if (t._v === 2) {
    if (t.preset && !VALID_PRESETS.includes(t.preset as string)) return "Invalid preset";
    const colors = t.colors as Record<string, unknown> | undefined;
    if (colors && typeof colors === "object") {
      for (const key of ["primary", "secondary", "background", "text", "textMuted", "surface", "border", "accent"]) {
        if (key in colors && typeof colors[key] === "string" && !HEX_COLOR_REGEX.test(colors[key] as string)) {
          return `Invalid hex color for colors.${key}`;
        }
      }
    }
    const buttons = t.buttons as Record<string, unknown> | undefined;
    if (buttons && typeof buttons === "object") {
      if (buttons.style && !VALID_BUTTON_STYLES.includes(buttons.style as string)) return "Invalid button style";
      if (buttons.radius && !VALID_RADIUS.includes(buttons.radius as string)) return "Invalid button radius";
      if (buttons.shadow && !VALID_SHADOW.includes(buttons.shadow as string)) return "Invalid button shadow";
    }
    const form = t.form as Record<string, unknown> | undefined;
    if (form && typeof form === "object") {
      if (form.inputStyle && !VALID_INPUT_STYLES.includes(form.inputStyle as string)) return "Invalid input style";
      if (form.inputRadius && !VALID_RADIUS.includes(form.inputRadius as string)) return "Invalid input radius";
      if (form.summaryStyle && !VALID_SUMMARY_STYLES.includes(form.summaryStyle as string)) return "Invalid summary style";
    }
    const layout = t.layout as Record<string, unknown> | undefined;
    if (layout && typeof layout === "object") {
      if (layout.cardStyle && !VALID_CARD_STYLES.includes(layout.cardStyle as string)) return "Invalid card style";
      if (layout.imageAspect && !VALID_IMAGE_ASPECTS.includes(layout.imageAspect as string)) return "Invalid image aspect";
      if (layout.coverStyle && !VALID_COVER_STYLES.includes(layout.coverStyle as string)) return "Invalid cover style";
      if (layout.headerStyle && !VALID_HEADER_STYLES.includes(layout.headerStyle as string)) return "Invalid header style";
      if (layout.productGrid !== undefined && ![2, 3].includes(layout.productGrid as number)) return "Invalid product grid";
    }
    const typography = t.typography as Record<string, unknown> | undefined;
    if (typography && typeof typography === "object") {
      if (typography.font && !VALID_FONTS.includes(typography.font as string)) return "Invalid font";
      if (typography.headingWeight && !VALID_HEADING_WEIGHTS.includes(typography.headingWeight as string)) return "Invalid heading weight";
      if (typography.bodySize && !VALID_BODY_SIZES.includes(typography.bodySize as string)) return "Invalid body size";
    }
    return null;
  }

  // v1 format
  const keys = ["primaryColor", "secondaryColor", "backgroundColor", "textColor"];
  for (const key of keys) {
    if (key in t && typeof t[key] === "string" && !HEX_COLOR_REGEX.test(t[key] as string)) {
      return `Invalid hex color for ${key}`;
    }
  }
  return null;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const stores = await prisma.store.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error("GET /api/stores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (isDemoUser(user)) return demoForbidden();

  const currentCount = await prisma.store.count({ where: { ownerId: user.id } });
  if (currentCount >= 1) {
    return forbidden("You already have a store");
  }

  const { name, logo, theme, language } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return badRequest("Store name is required");
  }

  if (theme) {
    const themeError = validateTheme(theme);
    if (themeError) return badRequest(themeError);
  }

  let slug = slugify(name);
  const slugExists = await prisma.store.findUnique({ where: { slug } });
  if (slugExists) {
    slug = `${slug}-${Date.now()}`;
  }

  const WELCOME_BONUS_TOKENS = 50;

  const [store] = await prisma.$transaction([
    prisma.store.create({
      data: {
        name: name.trim(),
        slug,
        ownerId: user.id,
        ...(logo && typeof logo === "string" ? { logo } : {}),
        ...(theme ? { theme } : {}),
        ...(language === "fr" ? { language: "fr" } : {}),
      },
    }),
    prisma.tokenBalance.upsert({
      where: { userId: user.id },
      create: { userId: user.id, balance: WELCOME_BONUS_TOKENS },
      update: { balance: { increment: WELCOME_BONUS_TOKENS } },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        type: "ADMIN_CREDIT",
        amount: WELCOME_BONUS_TOKENS,
        description: "Welcome bonus: 50 free tokens for creating your store",
      },
    }),
  ]);

  return NextResponse.json(store, { status: 201 });
}
