"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  if (score <= 3) return { label: "Fair", color: "bg-yellow-500", width: "w-2/4" };
  if (score <= 4) return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
  return { label: "Strong", color: "bg-green-500", width: "w-full" };
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }), [password]);

  const allChecksPassed = passwordChecks.length && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.number;

  useEffect(() => {
    if (status !== "loading" && session) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allChecksPassed) {
      setError(t("auth.register.passwordRequirements"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.register.passwordsMismatch"));
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password, confirmPassword, ...(ref ? { ref } : {}) }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
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
    <div className="min-h-screen bg-d-bg flex flex-col items-center px-4 py-6 sm:px-6 sm:py-12 sm:justify-center">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="flex justify-center mb-5 sm:mb-8">
          <Link href="/">
            <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={160} height={48} className="h-14 sm:h-18 w-auto" priority />
          </Link>
        </div>

        <div className="bg-d-surface rounded-2xl shadow-card px-5 py-6 sm:px-10 sm:py-10">
          <h1 className="text-lg sm:text-xl font-semibold text-d-text text-center mb-4 sm:mb-6">
            {t("auth.register.title")}
          </h1>

          {error && (
            <div className="bg-red-50 text-red-600 px-3 sm:px-4 py-2.5 rounded-lg text-[13px] sm:text-sm font-medium mb-4 sm:mb-5 text-center">
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
            {t("auth.register.googleButton")}
          </button>

          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-d-border" />
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="bg-d-surface px-3 text-d-text-muted">{t("common.or")}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="name" className="block text-[13px] sm:text-sm font-[450] text-d-text-sub mb-1.5">
                  {t("auth.register.fullName")}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 sm:py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[14px] sm:text-[13px] text-d-text placeholder-d-text-muted focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                  placeholder={t("auth.register.namePlaceholder")}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-[13px] sm:text-sm font-[450] text-d-text-sub mb-1.5">
                  {t("auth.register.phone")}
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 sm:py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[14px] sm:text-[13px] text-d-text placeholder-d-text-muted focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                  placeholder={t("auth.register.phonePlaceholder")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[13px] sm:text-sm font-[450] text-d-text-sub mb-1.5">
                {t("auth.register.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[14px] sm:text-[13px] text-d-text placeholder-d-text-muted focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                placeholder={t("auth.register.emailPlaceholder")}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] sm:text-sm font-[450] text-d-text-sub mb-1.5">
                {t("auth.register.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[14px] sm:text-[13px] text-d-text placeholder-d-text-muted focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                placeholder={t("auth.register.passwordPlaceholder")}
              />

              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-d-border rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
                    </div>
                    <span className={`text-[11px] font-medium ${
                      strength.label === "Weak" ? "text-red-500" :
                      strength.label === "Fair" ? "text-yellow-500" :
                      strength.label === "Good" ? "text-blue-500" : "text-green-500"
                    }`}>
                      {t(`auth.register.strength.${strength.label.toLowerCase()}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div className={`flex items-center gap-1.5 text-[11px] ${passwordChecks.length ? "text-green-500" : "text-d-text-muted"}`}>
                      <span>{passwordChecks.length ? "\u2713" : "\u2022"}</span> {t("auth.register.check.length")}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] ${passwordChecks.uppercase ? "text-green-500" : "text-d-text-muted"}`}>
                      <span>{passwordChecks.uppercase ? "\u2713" : "\u2022"}</span> {t("auth.register.check.uppercase")}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] ${passwordChecks.lowercase ? "text-green-500" : "text-d-text-muted"}`}>
                      <span>{passwordChecks.lowercase ? "\u2713" : "\u2022"}</span> {t("auth.register.check.lowercase")}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] ${passwordChecks.number ? "text-green-500" : "text-d-text-muted"}`}>
                      <span>{passwordChecks.number ? "\u2713" : "\u2022"}</span> {t("auth.register.check.number")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] sm:text-sm font-[450] text-d-text-sub mb-1.5">
                {t("auth.register.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 border border-d-input-border rounded-lg bg-d-input-bg text-[14px] sm:text-[13px] text-d-text placeholder-d-text-muted focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
                placeholder={t("auth.register.confirmPlaceholder")}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-[11px] mt-1">{t("auth.register.passwordsMismatch")}</p>
              )}
            </div>

            <StyledButton
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full mt-2"
            >
              {t("auth.register.submit")}
            </StyledButton>
          </form>
        </div>

        <p className="mt-5 sm:mt-6 text-center text-[13px] sm:text-sm text-d-text-sub">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/auth/login" className="text-d-link hover:underline font-medium">
            {t("auth.register.signIn")}
          </Link>
        </p>
        <p className="mt-2 text-center text-[12px] text-d-text-muted">
          <Link href="/store/demo" className="hover:underline">{t("auth.viewDemoStore")}</Link>
        </p>
      </div>
    </div>
  );
}
