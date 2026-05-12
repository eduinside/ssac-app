"use client";

import { useEffect, useState } from "react";

interface ToastState {
  message: string;
  id: number;
}

let toastQueue: ((msg: string) => void) | null = null;

export function showToast(message: string) {
  toastQueue?.(message);
}

export function ToastProvider() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    toastQueue = (message: string) => {
      setToast({ message, id: Date.now() });
    };
    return () => { toastQueue = null; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      key={toast.id}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-sm font-semibold text-white pointer-events-none"
      style={{
        background: "var(--ink-900)",
        boxShadow: "var(--shadow-3)",
        animation: "fadeInUp 200ms ease-out",
      }}
    >
      {toast.message}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
