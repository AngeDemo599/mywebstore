"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

export interface StoreData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  theme: Record<string, unknown> | null;
  language: string;
  metaPixelId: string | null;
  sheetsWebhookUrl: string | null;
  createdAt: string;
  _count: { products: number };
}

interface StoreContextValue {
  /** The user's single store (null if not yet created / still loading) */
  activeStore: StoreData | null;
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");
      if (res.ok) {
        const data = await res.json();
        const list: StoreData[] = Array.isArray(data) ? data : [];
        // Single store per account — take the first (and only) store
        setStore(list.length > 0 ? list[0] : null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStore();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchStore]);

  return (
    <StoreContext.Provider
      value={{ activeStore: store, loading, refreshStores: fetchStore }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStoreContext must be used within a StoreProvider");
  }
  return ctx;
}
