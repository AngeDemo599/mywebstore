import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import AuthSessionProvider from "@/components/session-provider";
import { LanguageProvider } from "@/components/language-provider";
import { StoreProvider } from "@/lib/store-context";
import { ToastProvider } from "@/components/toast";
import { type Locale, defaultLocale, getDirection } from "@/i18n";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SouqMaker",
  description: "SaaS e-commerce platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("souqmaker-lang")?.value;
  const locale: Locale =
    savedLocale === "ar" || savedLocale === "fr" ? savedLocale : defaultLocale;
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${ibmPlexArabic.variable} antialiased`}
      >
        <AuthSessionProvider>
          <LanguageProvider initialLocale={locale}>
            <StoreProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </StoreProvider>
          </LanguageProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
