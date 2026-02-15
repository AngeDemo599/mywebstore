"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

export default function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <nav className="bg-white border-b border-[#e3e3e3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          {/* Logo + nav links (left side) */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={140} height={40} className="h-9 w-auto pro-dark:hidden" />
              <Image src="/Logo SouqMakerDarkmode.svg" alt="SouqMaker" width={140} height={40} className="h-9 w-auto hidden pro-dark:block" />
            </Link>

            {!session && (
              <nav className="flex items-center gap-5">
                <Link href="/#features" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.features")}
                </Link>
                <Link href="/#about" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.about")}
                </Link>
                <Link href="/#pricing" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.pricing")}
                </Link>
                <Link href="/#contact" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.contact")}
                </Link>
                <Link href="/store/demo" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.demo")}
                </Link>
              </nav>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 ml-auto">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.dashboard")}
                </Link>
                <span className="text-sm text-d-text-sub">
                  {session.user.email}
                </span>
                <StyledButton
                  variant="secondary"
                  size="sm"
                  onClick={async () => { await signOut({ redirect: false }); window.location.href = "/auth/login"; }}
                >
                  {t("navbar.signOut")}
                </StyledButton>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.login")}
                </Link>
                <StyledButton variant="primary" size="sm" href="/auth/register">
                  {t("navbar.register")}
                </StyledButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
