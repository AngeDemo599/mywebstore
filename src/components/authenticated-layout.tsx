"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { useStoreContext } from "@/lib/store-context";
import { useEffectivePlan } from "@/lib/use-effective-plan";
import { useTranslation } from "@/components/language-provider";
import { playNotification } from "@/lib/sounds";
import AdBanner from "@/components/ad-banner";
import {
  X,
  Sparkles,
  ShoppingCart,
  Package,
  Coins,
  BarChart3,
  Palette,
  Check,
  Menu,
  Bell,
  LogOut,
  Pencil,
  Clock,
  CheckCircle,
  XCircle,
  EyeOff,
} from "lucide-react";

interface MobileNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { effectivePlan } = useEffectivePlan();
  const { t } = useTranslation();
  const { activeStore, loading } = useStoreContext();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile notification & profile state
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileNotifs, setMobileNotifs] = useState<MobileNotification[]>([]);
  const [mobileUnread, setMobileUnread] = useState(0);
  const [mobileNotifLoading, setMobileNotifLoading] = useState(false);
  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  const fetchMobileNotifs = useCallback(async () => {
    setMobileNotifLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setMobileNotifs(data.notifications);
        setMobileUnread((prev) => {
          if (data.unreadCount > prev && prev > 0) {
            playNotification();
          }
          return data.unreadCount;
        });
      }
    } catch { /* ignore */ }
    finally { setMobileNotifLoading(false); }
  }, []);

  useEffect(() => {
    fetchMobileNotifs();
    const interval = setInterval(fetchMobileNotifs, 60000);
    return () => clearInterval(interval);
  }, [fetchMobileNotifs]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileNotifRef.current && !mobileNotifRef.current.contains(e.target as Node)) setMobileNotifOpen(false);
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(e.target as Node)) setMobileProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close sidebar + dropdowns on route change
  useEffect(() => {
    setSidebarOpen(false);
    setMobileNotifOpen(false);
    setMobileProfileOpen(false);
  }, [pathname]);

  function mobileTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("header.justNow");
    if (mins < 60) return `${mins}${t("header.minutesAgo")}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t("header.hoursAgo")}`;
    const days = Math.floor(hours / 24);
    return `${days}${t("header.daysAgo")}`;
  }

  function getMobileNotifIcon(type: string) {
    switch (type) {
      case "order": return <ShoppingCart size={14} className="text-amber-500" />;
      case "upgrade-approved": return <CheckCircle size={14} className="text-green-500" />;
      case "upgrade-rejected": return <XCircle size={14} className="text-red-500" />;
      case "upgrade-pending": return <Clock size={14} className="text-blue-500" />;
      case "admin-upgrade": return <Sparkles size={14} className="text-indigo-500" />;
      default: return <Bell size={14} className="text-d-text-sub" />;
    }
  }

  const proFeatures = [
    { icon: ShoppingCart, label: t("proWelcome.allOrders") },
    { icon: Package, label: t("proWelcome.100products") },
    { icon: Coins, label: t("proWelcome.200tokens") },
    { icon: BarChart3, label: t("proWelcome.analytics") },
    { icon: Palette, label: t("proWelcome.customPages") },
    { icon: EyeOff, label: t("proWelcome.adFree") },
  ];
  const [showProWelcome, setShowProWelcome] = useState(false);

  useEffect(() => {
    if (
      effectivePlan === "PRO" &&
      !localStorage.getItem("_mws_pro_welcome_seen")
    ) {
      setShowProWelcome(true);
    }
  }, [effectivePlan]);

  // Redirect to onboarding if user has no store
  useEffect(() => {
    if (!loading && !activeStore) {
      router.replace("/onboarding");
    }
  }, [loading, activeStore, router]);

  function dismissWelcome() {
    localStorage.setItem("_mws_pro_welcome_seen", "1");
    setShowProWelcome(false);
  }

  // Show loading while checking store
  if (loading || !activeStore) {
    return (
      <div className="flex h-screen items-center justify-center bg-d-bg">
        <div className="w-6 h-6 border-2 border-d-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${effectivePlan === "PRO" ? "pro-dark" : ""}`}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ms-64 min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 h-14 lg:hidden bg-d-surface border-b border-d-border flex items-center justify-between px-3 flex-shrink-0">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-d-hover-bg transition-colors"
            >
              <Menu size={20} className="text-d-text" />
            </button>
            <Link href="/dashboard" className="flex-shrink-0">
              <Image src="/Logo SouqMaker.svg" alt="SouqMaker" width={110} height={32} className="h-6 w-auto pro-dark:hidden" />
              <Image src="/Logo SouqMakerDarkmode.svg" alt="SouqMaker" width={110} height={32} className="h-6 w-auto hidden pro-dark:block" />
            </Link>
          </div>

          {/* Right: notification + avatar */}
          <div className="flex items-center gap-1.5">
            {/* Notification bell */}
            <div className="relative" ref={mobileNotifRef}>
              <button
                onClick={() => { setMobileNotifOpen(!mobileNotifOpen); setMobileProfileOpen(false); if (!mobileNotifOpen) fetchMobileNotifs(); }}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-d-hover-bg transition-colors"
              >
                <Bell size={18} className="text-d-text" />
                {mobileUnread > 0 && (
                  <span className="absolute top-0.5 end-0.5 w-4 h-4 min-w-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {mobileUnread > 9 ? "9+" : mobileUnread}
                  </span>
                )}
              </button>

              {mobileNotifOpen && (
                <div className="absolute end-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm bg-d-surface rounded-xl border border-d-border shadow-card z-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-d-border flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-d-text">{t("header.notifications")}</h3>
                    {mobileUnread > 0 && <span className="text-xs text-d-text-sub">{mobileUnread} {t("header.notifNew")}</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {mobileNotifLoading && mobileNotifs.length === 0 ? (
                      <div className="p-5 text-center"><div className="w-4 h-4 border-2 border-d-text border-t-transparent rounded-full animate-spin mx-auto" /></div>
                    ) : mobileNotifs.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell size={20} className="text-d-text-muted mx-auto mb-1.5" />
                        <p className="text-xs text-d-text-sub">{t("header.noNotifications")}</p>
                      </div>
                    ) : (
                      mobileNotifs.map((n) => (
                        <Link key={n.id} href={n.href} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-d-hover-bg transition-colors border-b border-d-border last:border-b-0">
                          <div className="mt-0.5 flex-shrink-0">{getMobileNotifIcon(n.type)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-d-text">{n.title}</p>
                            <p className="text-[11px] text-d-text-sub mt-0.5 line-clamp-1">{n.message}</p>
                            <p className="text-[10px] text-d-text-muted mt-0.5">{mobileTimeAgo(n.createdAt)}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  {mobileNotifs.length > 0 && (
                    <div className="px-4 py-2 border-t border-d-border bg-d-surface-secondary">
                      <Link href="/dashboard/orders" className="text-xs text-d-link hover:underline font-medium">{t("header.viewAllOrders")}</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="relative" ref={mobileProfileRef}>
              <button
                onClick={() => { setMobileProfileOpen(!mobileProfileOpen); setMobileNotifOpen(false); }}
                className="w-8 h-8 rounded-full bg-d-subtle-bg flex items-center justify-center text-d-text text-xs font-bold hover:ring-2 hover:ring-d-border transition-all"
              >
                {session?.user?.email?.charAt(0).toUpperCase() || "U"}
              </button>

              {mobileProfileOpen && (
                <div className="absolute end-0 top-full mt-2 w-64 bg-d-surface rounded-xl border border-d-border shadow-card py-2 z-50">
                  <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-d-hover-bg transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-d-subtle-bg flex items-center justify-center text-d-text text-sm font-bold flex-shrink-0">
                      {session?.user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-d-text truncate">{session?.user?.email}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${session?.user?.plan === "PRO" ? "bg-d-subtle-bg text-d-text" : "bg-d-surface-secondary text-d-text-sub"}`}>
                          {session?.user?.plan || "FREE"}
                        </span>
                      </div>
                    </div>
                    <Pencil size={12} className="text-d-text-muted group-hover:text-d-text flex-shrink-0" />
                  </Link>
                  <div className="border-t border-d-border my-1" />
                  <button
                    onClick={async () => { await signOut({ redirect: false }); window.location.href = "/auth/login"; }}
                    className="flex items-center gap-3 mx-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-[calc(100%-16px)]"
                  >
                    <LogOut size={15} className="flex-shrink-0" />
                    {t("header.signOut")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 bg-d-bg">
          <AdBanner slot="dashboard-top" format="horizontal" className="mb-4" />
          {children}
        </main>
      </div>

      {showProWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-gradient-to-b from-[#3a3a3a] to-[#262626] border border-white/10 shadow-2xl p-8">
            <button
              onClick={dismissWelcome}
              className="absolute top-4 end-4 text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles size={22} className="text-lime-400" />
              <h2 className="text-white font-bold text-xl">
                {t("proWelcome.title")}
              </h2>
            </div>

            <p className="text-white/60 text-sm mb-6">
              {t("proWelcome.subtitle")}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {proFeatures.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 bg-white/[0.07] rounded-lg px-3 py-2.5 border border-white/[0.08]"
                >
                  <Check
                    size={16}
                    className="text-emerald-400 flex-shrink-0"
                  />
                  <span className="text-white/90 text-sm font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={dismissWelcome}
              className="w-full bg-white text-[#303030] py-3 rounded-lg text-sm font-bold hover:bg-[#f1f1f1] transition-colors"
            >
              {t("proWelcome.getStarted")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutInner>{children}</LayoutInner>
  );
}
