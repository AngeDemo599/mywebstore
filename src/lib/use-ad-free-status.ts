"use client";

import { useState, useEffect, useCallback } from "react";

interface AdFreeStatus {
  showAds: boolean;
  adFreeUntil: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useAdFreeStatus(): AdFreeStatus {
  const [showAds, setShowAds] = useState(true);
  const [adFreeUntil, setAdFreeUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/user/ad-free-status");
      if (res.ok) {
        const data = await res.json();
        setShowAds(data.showAds);
        setAdFreeUntil(data.adFreeUntil);
      }
    } catch {
      // Default to showing ads on error
      setShowAds(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { showAds, adFreeUntil, loading, refresh };
}
