"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { StyledButton } from "@/components/styled-button";
import { Mail, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "@/components/language-provider";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setResendMessage(data.message || "Verification email sent");
    } catch {
      setResendMessage("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-d-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={160} height={48} className="h-14 sm:h-16 w-auto" priority />
          </Link>
        </div>

        <div className="bg-d-surface rounded-2xl shadow-card px-8 py-10">
          {/* Default: Check Your Email */}
          {!status && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Mail className="w-12 h-12 text-d-link" />
              </div>
              <h1 className="text-xl font-semibold text-d-text mb-2">
                {t("auth.verify.checkEmail")}
              </h1>
              <p className="text-[13px] text-d-text-sub mb-6">
                {t("auth.verify.sentLink")}{" "}
                {email ? <span className="font-medium text-d-text">{email}</span> : t("auth.verify.yourEmail")}
                {t("auth.verify.clickLink")}
              </p>
              {email && (
                <>
                  {resendMessage && (
                    <div className="bg-green-50 text-green-600 px-4 py-2.5 rounded-lg text-[13px] font-medium mb-4 text-center">
                      {resendMessage}
                    </div>
                  )}
                  <StyledButton
                    variant="outline"
                    onClick={handleResend}
                    isLoading={resending}
                    className="w-full"
                  >
                    {t("auth.verify.resend")}
                  </StyledButton>
                </>
              )}
            </div>
          )}

          {/* Success: Email Verified */}
          {status === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-d-text mb-2">
                {t("auth.verify.verified")}
              </h1>
              <p className="text-[13px] text-d-text-sub mb-6">
                {t("auth.verify.verifiedDesc")}
              </p>
              <Link href="/auth/login">
                <StyledButton variant="primary" className="w-full">
                  {t("auth.login.submit")}
                </StyledButton>
              </Link>
            </div>
          )}

          {/* Expired: Link Expired */}
          {status === "expired" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Clock className="w-12 h-12 text-yellow-500" />
              </div>
              <h1 className="text-xl font-semibold text-d-text mb-2">
                {t("auth.verify.expired")}
              </h1>
              <p className="text-[13px] text-d-text-sub mb-6">
                {t("auth.verify.expiredDesc")}
              </p>
              {resendMessage && (
                <div className="bg-green-50 text-green-600 px-4 py-2.5 rounded-lg text-[13px] font-medium mb-4 text-center">
                  {resendMessage}
                </div>
              )}
              {email ? (
                <StyledButton
                  variant="primary"
                  onClick={handleResend}
                  isLoading={resending}
                  className="w-full"
                >
                  {t("auth.verify.resend")}
                </StyledButton>
              ) : (
                <Link href="/auth/register">
                  <StyledButton variant="primary" className="w-full">
                    {t("auth.verify.registerAgain")}
                  </StyledButton>
                </Link>
              )}
            </div>
          )}

          {/* Invalid: Invalid Link */}
          {status === "invalid" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold text-d-text mb-2">
                {t("auth.verify.invalid")}
              </h1>
              <p className="text-[13px] text-d-text-sub mb-6">
                {t("auth.verify.invalidDesc")}
              </p>
              <Link href="/auth/register">
                <StyledButton variant="primary" className="w-full">
                  {t("auth.register.submit")}
                </StyledButton>
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[13px] text-d-text-sub">
          {t("auth.verify.alreadyVerified")}{" "}
          <Link href="/auth/login" className="text-d-link hover:underline font-medium">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
