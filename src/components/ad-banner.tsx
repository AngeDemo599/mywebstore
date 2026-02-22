"use client";

import { useEffect, useRef } from "react";
import { useAdFreeStatus } from "@/lib/use-ad-free-status";
import { useTranslation } from "@/components/language-provider";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  slot?: string;
  format?: "auto" | "horizontal" | "vertical";
  className?: string;
}

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
}: AdBannerProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const { showAds, loading } = useAdFreeStatus();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!clientId || !showAds || loading || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, [clientId, showAds, loading]);

  // Don't render if no AdSense ID configured (dev mode safe)
  if (!clientId) return null;

  // Don't render while loading or if ads are suppressed
  if (loading || !showAds) return null;

  return (
    <div
      className={`bg-d-surface-secondary border border-d-border rounded-xl p-2 text-center ${className}`}
    >
      <p className="text-[10px] text-d-text-muted mb-1">{t("ads.label")}</p>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot || ""}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
