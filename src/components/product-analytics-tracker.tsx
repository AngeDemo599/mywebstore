"use client";

import { useEffect, useRef, useCallback } from "react";

interface TrackerProps {
  productId: string;
  storeId: string;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older browsers / non-secure contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("_mws_vid");
  if (!id) {
    id = generateId();
    localStorage.setItem("_mws_vid", id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("_mws_sid");
  if (!id) {
    id = generateId();
    sessionStorage.setItem("_mws_sid", id);
  }
  return id;
}

function getDeviceType(): string {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
}

function getBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Other";
}

function getUtmParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
}

export default function ProductAnalyticsTracker({ productId, storeId }: TrackerProps) {
  const hasFiredPageView = useRef(false);
  const hasFiredScroll50 = useRef(false);
  const hasFiredFormView = useRef(false);

  const trackEvent = useCallback(
    (eventType: string) => {
      const utm = getUtmParams();
      const payload = {
        productId,
        storeId,
        eventType,
        sessionId: getSessionId(),
        visitorId: getVisitorId(),
        referrer: document.referrer || undefined,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        ...utm,
      };

      // Use sendBeacon for reliability, fallback to fetch
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/events", blob);
      } else {
        fetch("/api/analytics/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    },
    [productId, storeId]
  );

  useEffect(() => {
    // PAGE_VIEW — fire once
    if (!hasFiredPageView.current) {
      hasFiredPageView.current = true;
      trackEvent("PAGE_VIEW");
    }

    // SCROLL_50 — observe midpoint
    const handleScroll = () => {
      if (hasFiredScroll50.current) return;
      const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (scrollPercent >= 0.5) {
        hasFiredScroll50.current = true;
        trackEvent("SCROLL_50");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // FORM_VIEW — observe order form section
    const formSection = document.getElementById("order-form-section") || document.getElementById("order-form-section-desktop");
    let formObserver: IntersectionObserver | null = null;
    if (formSection) {
      formObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasFiredFormView.current) {
            hasFiredFormView.current = true;
            trackEvent("FORM_VIEW");
          }
        },
        { threshold: 0.3 }
      );
      formObserver.observe(formSection);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      formObserver?.disconnect();
    };
  }, [trackEvent]);

  // Expose trackEvent globally for form interactions
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__mwsTrack = trackEvent;
    return () => {
      delete (window as unknown as Record<string, unknown>).__mwsTrack;
    };
  }, [trackEvent]);

  return null;
}
