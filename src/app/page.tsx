"use client";

import Navbar from "@/components/navbar";
import { StyledButton } from "@/components/styled-button";
import { useTranslation } from "@/components/language-provider";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Navbar />
      <main>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <img src="/Logo SouqMaker.svg" alt="SouqMaker" className="h-20 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-8">
              {t("homepage.tagline")}
            </p>
            <div className="flex gap-4 justify-center">
              <StyledButton variant="secondary" size="lg" href="/auth/login">
                {t("homepage.login")}
              </StyledButton>
              <StyledButton variant="primary" size="lg" href="/auth/register">
                {t("homepage.getStarted")}
              </StyledButton>
            </div>
            <div className="mt-4">
              <a href="/store/demo" className="text-sm text-gray-500 hover:text-gray-700 underline">
                {t("homepage.viewDemo")}
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
