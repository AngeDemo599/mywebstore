"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Bell,
  ExternalLink,
  LogOut,
  Pencil,
  ShoppingCart,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTokenBalance } from "@/lib/use-token-balance";
import { useStoreContext } from "@/lib/store-context";
import { useTranslation } from "@/components/language-provider";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
}

export default function DashboardHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { balance: tokenBalance, loading: tokenLoading } = useTokenBalance();
  const { activeStore } = useStoreContext();
  const { t } = useTranslation();

  const localRouteLabels: Record<string, string> = {
    dashboard: t("header.dashboard"),
    products: t("header.products"),
    orders: t("header.orders"),
    tokens: t("header.tokens"),
    upgrade: t("header.upgrade"),
    admin: t("header.admin"),
    profile: t("header.profile"),
    new: t("header.new"),
    edit: t("header.edit"),
    analytics: t("header.analytics"),
    affiliates: t("header.affiliates"),
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Fetch on mount and every 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleBellClick = () => {
    setNotifOpen(!notifOpen);
    setProfileOpen(false);
    if (!notifOpen) {
      fetchNotifications();
    }
  };

  const handleAvatarClick = () => {
    setProfileOpen(!profileOpen);
    setNotifOpen(false);
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = localRouteLabels[segment] || segment;
    breadcrumbs.push({ label, href: path });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("header.justNow");
    if (mins < 60) return `${mins}${t("header.minutesAgo")}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t("header.hoursAgo")}`;
    const days = Math.floor(hours / 24);
    return `${days}${t("header.daysAgo")}`;
  }

  function getNotifIcon(type: string) {
    switch (type) {
      case "order":
        return <ShoppingCart size={16} className="text-amber-500" />;
      case "upgrade-approved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "upgrade-rejected":
        return <XCircle size={16} className="text-red-500" />;
      case "upgrade-pending":
        return <Clock size={16} className="text-blue-500" />;
      case "admin-upgrade":
        return <Sparkles size={16} className="text-indigo-500" />;
      default:
        return <Bell size={16} className="text-d-text-sub" />;
    }
  }

  return (
    <header className="sticky top-0 z-20 h-16 bg-d-surface border-b border-d-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-d-text-muted">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-d-text font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-d-text-sub hover:text-d-text transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* View Store */}
        {activeStore && (
          <a
            href={`/store/${activeStore.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-d-border text-d-text-sub hover:text-d-text hover:bg-d-active-bg transition-colors text-sm font-medium"
          >
            <ExternalLink size={15} />
            {t("header.viewStore")}
          </a>
        )}

        {/* Token Balance - Direct Link */}
        <Link
          href="/dashboard/tokens"
          className="flex items-center gap-2 px-3 py-2 bg-[#303030] hover:bg-[#404040] rounded-lg transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-lime-400">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
            <circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.3" />
            <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">T</text>
          </svg>
          <span className="text-sm font-bold text-white">
            {tokenLoading ? "..." : tokenBalance}
          </span>
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleBellClick}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-d-active-bg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-d-text">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" fill="none" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 w-4.5 h-4.5 min-w-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute end-0 top-full mt-2 w-96 bg-d-surface rounded-xl border border-d-border shadow-card z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-d-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-d-text">
                  {t("header.notifications")}
                </h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-d-text-sub">
                    {unreadCount} {t("header.notifNew")}
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifLoading && notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-5 h-5 border-2 border-d-text border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell
                      size={24}
                      className="text-d-text-muted mx-auto mb-2"
                    />
                    <p className="text-sm text-d-text-sub">
                      {t("header.noNotifications")}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-d-hover-bg transition-colors border-b border-d-border last:border-b-0"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-d-text">
                          {notif.title}
                        </p>
                        <p className="text-xs text-d-text-sub mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-d-text-muted mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-d-border bg-d-surface-secondary">
                  <Link
                    href="/dashboard/orders"
                    className="text-xs text-d-link hover:underline font-medium"
                  >
                    {t("header.viewAllOrders")}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={handleAvatarClick}
            className="w-9 h-9 rounded-full bg-d-subtle-bg flex items-center justify-center text-d-text text-sm font-bold hover:ring-2 hover:ring-d-border transition-all cursor-pointer"
          >
            {session?.user?.email?.charAt(0).toUpperCase() || "U"}
          </button>

          {profileOpen && (
            <div className="absolute end-0 top-full mt-2 w-72 bg-d-surface rounded-xl border border-d-border shadow-card py-2 z-50">
              {/* User info — clickable to profile */}
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-3 hover:bg-d-hover-bg transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-d-subtle-bg flex items-center justify-center text-d-text text-base font-bold flex-shrink-0">
                  {session?.user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-d-text truncate">
                    {session?.user?.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        session?.user?.plan === "PRO"
                          ? "bg-d-subtle-bg text-d-text"
                          : "bg-d-surface-secondary text-d-text-sub"
                      }`}
                    >
                      {session?.user?.plan || "FREE"}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        session?.user?.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-d-surface-secondary text-d-text-sub"
                      }`}
                    >
                      {session?.user?.role || "USER"}
                    </span>
                  </div>
                </div>
                <Pencil size={14} className="text-d-text-muted group-hover:text-d-text flex-shrink-0" />
              </Link>

              <div className="border-t border-d-border my-1" />

              {/* Sign out */}
              <button
                onClick={async () => {
                  await signOut({ redirect: false });
                  window.location.href = "/auth/login";
                }}
                className="flex items-center gap-3 mx-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-[calc(100%-16px)]"
              >
                <LogOut size={16} className="flex-shrink-0" />
                {t("header.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
