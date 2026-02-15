import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { REFERRAL_BONUS_TOKENS } from "@/lib/auth-helpers";
import { generateVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password, confirmPassword, ref } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one lowercase letter" },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Look up referrer by referral code
    let referrer: { id: string } | null = null;
    if (ref && typeof ref === "string") {
      referrer = await prisma.user.findUnique({
        where: { referralCode: ref },
        select: { id: true },
      });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email,
        password: hashedPassword,
        analyticsAccessType: "TRIAL",
        analyticsTrialEndsAt: trialEndsAt,
        ...(referrer ? { referredById: referrer.id } : {}),
      },
    });

    // If referrer found, create Referral record + award bonus tokens
    if (referrer) {
      await prisma.$transaction([
        prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
          },
        }),
        prisma.tokenBalance.upsert({
          where: { userId: referrer.id },
          create: { userId: referrer.id, balance: REFERRAL_BONUS_TOKENS },
          update: { balance: { increment: REFERRAL_BONUS_TOKENS } },
        }),
        prisma.tokenTransaction.create({
          data: {
            userId: referrer.id,
            type: "REFERRAL_BONUS",
            amount: REFERRAL_BONUS_TOKENS,
            description: `Referral bonus: ${email} signed up`,
          },
        }),
        prisma.referralEarning.create({
          data: {
            userId: referrer.id,
            referralId: user.id,
            amount: REFERRAL_BONUS_TOKENS,
            description: `New signup: ${email}`,
          },
        }),
      ]);
    }

    // Generate verification token and send email (skip if email service unavailable)
    try {
      const verificationToken = await generateVerificationToken(email);
      await sendVerificationEmail(email, verificationToken.token);
    } catch (emailError) {
      console.warn("Failed to send verification email, skipping:", emailError);
      // Mark user as verified since email service is unavailable
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id, requiresVerification: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
