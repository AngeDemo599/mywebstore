"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

export default function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[#e3e3e3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={140} height={40} className="h-8 sm:h-9 w-auto pro-dark:hidden" />
            <Image src="/Logo SouqMakerDarkmode.svg" alt="SouqMaker" width={140} height={40} className="h-8 sm:h-9 w-auto hidden pro-dark:block" />
          </Link>

          {/* Desktop nav links */}
          {!session && (
            <div className="hidden md:flex items-center gap-5 ms-6">
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
            </div>
          )}

          {/* Right side — desktop */}
          <div className="hidden sm:flex items-center gap-4 ml-auto">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-d-text-sub hover:text-d-text transition-colors">
                  {t("navbar.dashboard")}
                </Link>
                <span className="text-sm text-d-text-sub hidden md:inline">
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-[#e3e3e3] bg-white px-4 py-3 space-y-2">
          {!session && (
            <>
              <Link href="/#features" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-d-text-sub">{t("navbar.features")}</Link>
              <Link href="/#about" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-d-text-sub">{t("navbar.about")}</Link>
              <Link href="/#pricing" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-d-text-sub">{t("navbar.pricing")}</Link>
              <Link href="/#contact" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-d-text-sub">{t("navbar.contact")}</Link>
              <Link href="/store/demo" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-d-text-sub">{t("navbar.demo")}</Link>
              <div className="border-t border-[#e3e3e3] pt-3 flex items-center gap-3">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-d-text-sub">{t("navbar.login")}</Link>
                <StyledButton variant="primary" size="sm" href="/auth/register">{t("navbar.register")}</StyledButton>
              </div>
            </>
          )}
          {session && (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-d-text">{t("navbar.dashboard")}</Link>
              <button
                onClick={async () => { await signOut({ redirect: false }); window.location.href = "/auth/login"; }}
                className="block py-2 text-sm font-medium text-red-600"
              >
                {t("navbar.signOut")}
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
