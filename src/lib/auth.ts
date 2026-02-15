import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          plan: user.plan,
          planExpiresAt: user.planExpiresAt?.toISOString() || null,
          analyticsAccessType: user.analyticsAccessType,
          analyticsTrialEndsAt: user.analyticsTrialEndsAt?.toISOString() || null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Credentials login is handled in authorize()
      if (account?.provider === "credentials") {
        return true;
      }

      // OAuth (Google) login
      if (account?.provider && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Link account if not already linked
          const existingAccount = existingUser.accounts.find(
            (a) => a.provider === account.provider
          );

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type!,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token as string | undefined,
                access_token: account.access_token as string | undefined,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token as string | undefined,
                session_state: account.session_state as string | undefined,
              },
            });
          }

          // Ensure emailVerified is set
          if (!existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            });
          }
        } else {
          // Create new user via OAuth
          const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          await prisma.user.create({
            data: {
              email: user.email,
              emailVerified: new Date(),
              analyticsAccessType: "TRIAL",
              analyticsTrialEndsAt: trialEndsAt,
              accounts: {
                create: {
                  type: account.type!,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token as string | undefined,
                  access_token: account.access_token as string | undefined,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token as string | undefined,
                  session_state: account.session_state as string | undefined,
                },
              },
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign-in with credentials — user object has all fields
      if (user && account?.provider === "credentials") {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
        token.plan = (user as { plan: string }).plan;
        token.planExpiresAt = (user as { planExpiresAt?: string | null }).planExpiresAt || null;
        token.analyticsAccessType = (user as { analyticsAccessType?: string }).analyticsAccessType || "NONE";
        token.analyticsTrialEndsAt = (user as { analyticsTrialEndsAt?: string | null }).analyticsTrialEndsAt || null;
      }

      // OAuth sign-in — fetch full user from DB
      if (user && account?.provider && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.planExpiresAt = dbUser.planExpiresAt?.toISOString() || null;
          token.analyticsAccessType = dbUser.analyticsAccessType;
          token.analyticsTrialEndsAt = dbUser.analyticsTrialEndsAt?.toISOString() || null;
        }
      }

      return token;
    },
  },
});
