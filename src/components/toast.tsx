"use client";

import { createContext, useContext, useCallback, useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  ShoppingCart,
  Package,
  Palette,
  Upload,
  Download,
  Trash2,
  UserCheck,
  Sparkles,
  Copy,
  Bell,
} from "lucide-react";
import { playSuccess, playError, playNotification, playSale, playDelete } from "@/lib/sounds";

type ToastType = "success" | "error" | "warning" | "info";
type ToastIcon =
  | "check"
  | "error"
  | "warning"
  | "info"
  | "order"
  | "product"
  | "style"
  | "upload"
  | "download"
  | "delete"
  | "profile"
  | "upgrade"
  | "copy"
  | "notification";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  icon?: ToastIcon;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void;
  success: (title: string, message?: string, icon?: ToastIcon) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

const ICONS: Record<ToastIcon, React.ReactNode> = {
  check: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  order: <ShoppingCart size={18} />,
  product: <Package size={18} />,
  style: <Palette size={18} />,
  upload: <Upload size={18} />,
  download: <Download size={18} />,
  delete: <Trash2 size={18} />,
  profile: <UserCheck size={18} />,
  upgrade: <Sparkles size={18} />,
  copy: <Copy size={18} />,
  notification: <Bell size={18} />,
};

const TYPE_DEFAULTS: Record<ToastType, { icon: ToastIcon; color: string; bg: string; border: string }> = {
  success: { icon: "check", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  error: { icon: "error", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  warning: { icon: "warning", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  info: { icon: "info", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: Omit<Toast, "id">) => {
      const id = `toast-${++toastId}`;
      const duration = options.duration ?? 3500;
      setToasts((prev) => [...prev.slice(-4), { ...options, id }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      // Play sound based on toast type/icon
      try {
        if (options.icon === "order") playSale();
        else if (options.icon === "delete") playDelete();
        else if (options.icon === "notification") playNotification();
        else if (options.type === "success") playSuccess();
        else if (options.type === "error") playError();
        else if (options.type === "warning") playError();
        else if (options.type === "info") playNotification();
      } catch { /* audio may not be available */ }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string, icon?: ToastIcon) =>
      addToast({ type: "success", title, message, icon }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) =>
      addToast({ type: "error", title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) =>
      addToast({ type: "warning", title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) =>
      addToast({ type: "info", title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}

      {/* Toast container — fixed bottom-end */}
      <div className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const defaults = TYPE_DEFAULTS[t.type];
          const iconKey = t.icon || defaults.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-toast-in ${defaults.bg} ${defaults.border}`}
            >
              <span className={`flex-shrink-0 mt-0.5 ${defaults.color}`}>
                {ICONS[iconKey]}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${defaults.color}`}>{t.title}</p>
                {t.message && (
                  <p className="text-xs text-d-text-sub mt-0.5">{t.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 mt-0.5 text-d-text-muted hover:text-d-text transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
