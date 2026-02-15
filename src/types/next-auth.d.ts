import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      plan: string;
      planExpiresAt: string | null;
      analyticsAccessType: string;
      analyticsTrialEndsAt: string | null;
    };
  }

  interface User {
    role?: string;
    plan?: string;
    planExpiresAt?: string | null;
    analyticsAccessType?: string;
    analyticsTrialEndsAt?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    plan: string;
    planExpiresAt: string | null;
    analyticsAccessType: string;
    analyticsTrialEndsAt: string | null;
  }
}
