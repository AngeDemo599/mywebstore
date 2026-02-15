"use client";

import { useState, useEffect, useCallback } from "react";

interface TokenTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export function useTokenBalance() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/user/tokens");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setTransactions(data.transactions);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, transactions, loading, refresh };
}
