import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateVerificationToken(email: string) {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { email },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  return verificationToken;
}

export async function validateVerificationToken(token: string) {
  const existingToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return { valid: false as const };
  }

  const hasExpired = existingToken.expiresAt < new Date();

  // Delete the token (single-use)
  await prisma.verificationToken.delete({
    where: { id: existingToken.id },
  });

  if (hasExpired) {
    return { valid: false as const, email: existingToken.email, expired: true };
  }

  return { valid: true as const, email: existingToken.email };
}
