"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Sparkles,
  Shield,
  BarChart3,
  Users,
  Palette,
  Lock,
  Timer,
  ExternalLink,
} from "lucide-react";
import { useStoreContext } from "@/lib/store-context";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { useTranslation } from "@/components/language-provider";
import LanguageSwitcher from "@/components/language-switcher";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: <Package size={20} />,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: <ShoppingCart size={20} />,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart3 size={20} />,
  },
  {
    label: "SouqStyle",
    href: "/dashboard/style",
    icon: <Palette size={20} />,
  },
  {
    label: "Affiliates",
    href: "/dashboard/affiliates",
    icon: <Users size={20} />,
  },
  {
    label: "Upgrade",
    href: "/dashboard/upgrade",
    icon: <Sparkles size={20} />,
    highlight: true,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: <Shield size={20} />,
    adminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { activeStore } = useStoreContext();
  const { effectivePlan, remainingDays } = useEffectivePlan();
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [analyticsTrialDays, setAnalyticsTrialDays] = useState<number | null>(null);
  const { t } = useTranslation();

  const fetchNewOrderCount = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const orders = await res.json();
      if (!Array.isArray(orders)) return;
      let filtered = orders;
      if (activeStore) {
        filtered = orders.filter(
          (o: { product: { store: { id: string } } }) =>
            o.product.store.id === activeStore.id
        );
      }
      const lastSeen = localStorage.getItem("_mws_orders_seen_at") || "1970-01-01T00:00:00.000Z";
      const lastSeenDate = new Date(lastSeen).getTime();
      setNewOrderCount(
        filtered.filter((o: { createdAt: string }) => new Date(o.createdAt).getTime() > lastSeenDate).length
      );
    } catch {
      // ignore
    }
  }, [activeStore]);

  useEffect(() => {
    if (session) {
      const timeout = setTimeout(fetchNewOrderCount, 0);
      const interval = setInterval(fetchNewOrderCount, 30000);
      return () => { clearTimeout(timeout); clearInterval(interval); };
    }
  }, [session, fetchNewOrderCount]);

  // Fetch analytics trial days for badge
  useEffect(() => {
    if (!session || effectivePlan === "PRO") return;
    const fetchTrialDays = async () => {
      try {
        const res = await fetch("/api/analytics/dashboard?period=7d");
        if (res.ok) {
          const json = await res.json();
          if (json.access?.reason === "trial" && json.access?.trialDaysLeft > 0) {
            setAnalyticsTrialDays(json.access.trialDaysLeft);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchTrialDays();
  }, [session, effectivePlan]);

  // Listen for orders-seen event from orders page to update badge immediately
  useEffect(() => {
    const handler = () => fetchNewOrderCount();
    window.addEventListener("orders-seen", handler);
    return () => window.removeEventListener("orders-seen", handler);
  }, [fetchNewOrderCount]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };


  return (
    <aside className="fixed top-0 start-0 w-64 h-full bg-d-surface border-r border-d-border flex flex-col overflow-y-auto z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-d-border flex-shrink-0">
        <Link href="/dashboard">
          <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={140} height={40} className="h-9 w-auto pro-dark:hidden" />
          <Image src="/Logo SouqMakerDarkmode.svg" alt="SouqMaker" width={140} height={40} className="h-9 w-auto hidden pro-dark:block" />
        </Link>
      </div>

      {/* Store Display */}
      {activeStore && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-d-surface-secondary border border-d-border">
          {activeStore.logo ? (
            <img
              src={activeStore.logo}
              alt={activeStore.name}
              className="w-7 h-7 rounded-lg object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-d-subtle-bg flex items-center justify-center text-d-text text-xs font-bold flex-shrink-0">
              {activeStore.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-d-text truncate">
              {activeStore.name}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && session?.user?.role !== "ADMIN") return null;

          const active = isActive(item.href);

          return (
            <div key={item.href} className={item.highlight ? "mt-4" : ""}>
              <Link
                href={item.href}
                className={
                  item.highlight
                    ? `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                        active
                          ? "bg-gradient-to-b from-[#3a3a3a] to-[#262626] text-white border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)]"
                          : "bg-gradient-to-b from-[#3a3a3a] to-[#262626] text-white border border-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)] hover:from-[#404040] hover:to-[#2b2b2b]"
                      }`
                    : `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-d-surface-tertiary text-d-text font-[550]"
                          : "text-d-text-sub hover:bg-d-hover-bg hover:text-d-text"
                      }`
                }
              >
                <span className={item.highlight ? "text-lime-400" : active ? "text-d-text" : "text-d-text-sub"}>
                  {item.icon}
                </span>
                <span className="flex-1">
                  {item.highlight && effectivePlan === "PRO" ? t("sidebar.proSubscription") : t(`sidebar.${item.label.toLowerCase().replace("souqstyle", "souqstyle")}`)}
                </span>
                {item.highlight && effectivePlan === "PRO" && remainingDays !== Infinity && (
                  <span className="text-white/60 text-[11px] font-medium">
                    {remainingDays} {t("sidebar.daysLeft")}
                  </span>
                )}
                {item.label === "SouqStyle" && (
                  effectivePlan === "PRO" ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-400 text-[#1a1a1a]">
                      PRO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-400/20 text-lime-700">
                      <Lock size={10} />
                      PRO
                    </span>
                  )
                )}
                {item.label === "Analytics" && (
                  effectivePlan === "PRO" ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-400 text-[#1a1a1a]">
                      PRO
                    </span>
                  ) : analyticsTrialDays !== null && analyticsTrialDays > 0 ? (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      analyticsTrialDays <= 2
                        ? "bg-red-100 text-red-700"
                        : "bg-lime-400/20 text-lime-700"
                    }`}>
                      <Timer size={9} />
                      PRO {analyticsTrialDays}d
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-400/20 text-lime-700">
                      <Lock size={10} />
                      PRO
                    </span>
                  )
                )}
                {item.label === "Orders" && newOrderCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {newOrderCount > 99 ? "99+" : newOrderCount}
                  </span>
                )}
              </Link>

            </div>
          );
        })}
      </nav>
      <div className="px-3 pb-4 mt-auto border-t border-d-border pt-3">
        <a href="/store/demo" target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm text-d-text-muted hover:text-d-text transition-colors">
          <ExternalLink size={14} />
          {t("sidebar.demoStore")}
        </a>
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
