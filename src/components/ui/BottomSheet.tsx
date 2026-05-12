"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, subtitle, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-30 transition-opacity duration-200"
        style={{
          background: "rgba(31,32,36,.42)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />
      {/* Sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 z-40 rounded-t-3xl flex flex-col"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-3)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms cubic-bezier(.2,.7,.2,1)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "var(--ink-200)" }}
          />
        </div>
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-5 pt-2 pb-3">
            <div>
              {title && (
                <p className="text-base font-bold" style={{ color: "var(--ink-900)" }}>
                  {title}
                </p>
              )}
              {subtitle && (
                <p className="text-sm mt-0.5" style={{ color: "var(--ink-500)" }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 grid place-items-center rounded-full cursor-pointer"
              style={{ background: "var(--bg-muted)", color: "var(--ink-500)" }}
              aria-label="닫기"
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>
        )}
        {/* Content */}
        <div className="px-5 pb-8">{children}</div>
      </div>
    </>
  );
}
