import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateVerificationToken } from "@/lib/verification-token";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?status=invalid", req.nextUrl)
      );
    }

    const result = await validateVerificationToken(token);

    if (!result.valid) {
      if (result.expired) {
        return NextResponse.redirect(
          new URL(`/auth/verify-email?status=expired&email=${encodeURIComponent(result.email)}`, req.nextUrl)
        );
      }
      return NextResponse.redirect(
        new URL("/auth/verify-email?status=invalid", req.nextUrl)
      );
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email: result.email },
      data: { emailVerified: new Date() },
    });

    return NextResponse.redirect(
      new URL("/auth/login?verified=true", req.nextUrl)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/auth/verify-email?status=invalid", req.nextUrl)
    );
  }
}
