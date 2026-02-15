import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  demoForbidden,
} from "@/lib/auth-helpers";
import { isDemoUser } from "@/lib/demo";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
    },
  });

  if (!dbUser) return unauthorized();

  return Response.json({ user: dbUser });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (isDemoUser(user)) return demoForbidden();

  const body = await request.json();
  const { email, currentPassword, newPassword } = body;

  // Update email if provided and different
  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest("This email is already in use");
    }
  }

  // Update password if provided
  if (newPassword) {
    if (!currentPassword) {
      return badRequest("Current password is required to set a new password");
    }

    if (newPassword.length < 6) {
      return badRequest("New password must be at least 6 characters");
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return unauthorized();

    if (!dbUser.password) {
      return badRequest("Cannot change password for OAuth accounts. Please set a password first.");
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) {
      return badRequest("Current password is incorrect");
    }
  }

  // Build update data
  const updateData: Record<string, string> = {};
  if (email && email !== user.email) {
    updateData.email = email;
  }
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return badRequest("No changes to save");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
    },
  });

  return Response.json({ user: updated });
}
