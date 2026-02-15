import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize is handled in the full auth.ts, this is just for the middleware
      authorize: () => null,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { plan: string }).plan = token.plan as string;
        (session.user as { planExpiresAt: string | null }).planExpiresAt = token.planExpiresAt as string | null;
        (session.user as { analyticsAccessType: string }).analyticsAccessType = token.analyticsAccessType as string;
        (session.user as { analyticsTrialEndsAt: string | null }).analyticsTrialEndsAt = token.analyticsTrialEndsAt as string | null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as { role?: string })?.role === "ADMIN";
      const pathname = nextUrl.pathname;

      if (pathname.startsWith("/dashboard") && !isLoggedIn) {
        return Response.redirect(new URL("/auth/login", nextUrl));
      }

      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/auth/login", nextUrl));
        }
        if (!isAdmin) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
