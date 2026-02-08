import React, { createContext, useCallback, useMemo, useState } from "react";

export type ToastVariant = "neutral" | "success" | "warning" | "danger";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
};

type Ctx = {
  show: (t: Omit<Toast, "id">) => void;
};

export const ToasterContext = createContext<Ctx | null>(null);

function toastClasses(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "toast-success";
    case "warning":
      return "toast-warning";
    case "danger":
      return "toast-danger";
    default:
      return "";
  }
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, variant: "neutral", ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${toastClasses(t.variant ?? "neutral")}`}>
            <div className="font-medium">{t.title}</div>
            {t.message && <div className="mt-1 text-sm text-muted">{t.message}</div>}
          </div>
        ))}
      </div>
    </ToasterContext.Provider>
  );
}
