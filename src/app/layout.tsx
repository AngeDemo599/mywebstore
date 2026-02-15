import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import AuthSessionProvider from "@/components/session-provider";
import { LanguageProvider } from "@/components/language-provider";
import { StoreProvider } from "@/lib/store-context";
import { type Locale, defaultLocale, getDirection } from "@/i18n";

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
      <body
        className={`${inter.variable} ${ibmPlexArabic.variable} antialiased`}
      >
        <AuthSessionProvider>
          <LanguageProvider initialLocale={locale}>
            <StoreProvider>
              {children}
            </StoreProvider>
          </LanguageProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
