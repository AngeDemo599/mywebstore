"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (status !== "loading" && session) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error.includes("EMAIL_NOT_VERIFIED")) {
        setError(t("auth.login.verifyFirst"));
      } else {
        setError(t("auth.login.invalidCredentials"));
      }
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  if (status === "loading" || session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-d-bg">
        <div className="w-6 h-6 border-2 border-d-border border-t-d-text rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-d-bg flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Link href="/">
            <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={160} height={48} className="h-14 sm:h-18 w-auto" priority />
          </Link>
        </div>

        <div className="bg-d-surface rounded-2xl shadow-card px-5 py-7 sm:px-10 sm:py-10">
          <h1 className="text-lg sm:text-xl font-semibold text-d-text text-center mb-5 sm:mb-6">
            {t("auth.login.title")}
          </h1>

          {verified && (
            <div className="bg-green-50 text-green-600 px-3 sm:px-4 py-2.5 rounded-lg text-[13px] sm:text-sm font-medium mb-5 text-center">
              {t("auth.login.verifiedSuccess")}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-3 sm:px-4 py-2.5 rounded-lg text-[13px] sm:text-sm font-medium mb-5 text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 border border-d-border rounded-xl bg-transparent text-d-text-muted text-[13px] sm:text-sm font-medium opacity-50 cursor-not-allowed"
            title={t("common.comingSoon")}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t("auth.login.googleButton")}
          </button>

          <div className="relative my-5 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-d-border" />
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="bg-d-surface px-3 text-d-text-muted">{t("common.or")}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] sm:text-sm font-[450] text-d-text-sub mb-1.5">
                {t("auth.login.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[14px] sm:text-[13px] text-d-text placeholder-d-text-muted focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                placeholder={t("auth.login.emailPlaceholder")}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] sm:text-sm font-[450] text-d-text-sub mb-1.5">
                {t("auth.login.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[14px] sm:text-[13px] text-d-text placeholder-d-text-muted focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                placeholder={t("auth.login.passwordPlaceholder")}
              />
            </div>

            <StyledButton
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full mt-2"
            >
              {t("auth.login.submit")}
            </StyledButton>
          </form>
        </div>

        <p className="mt-5 sm:mt-6 text-center text-[13px] sm:text-sm text-d-text-sub">
          {t("auth.login.noAccount")}{" "}
          <Link href="/auth/register" className="text-d-link hover:underline font-medium">
            {t("auth.login.register")}
          </Link>
        </p>
        <p className="mt-2 text-center text-[12px] text-d-text-muted">
          <a href="/store/demo" className="hover:underline">{t("auth.viewDemoStore")}</a>
        </p>
      </div>
    </div>
  );
}
