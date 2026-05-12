import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
}

export function Chip({ active, count, children, className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border",
        "text-[13px] font-semibold cursor-pointer select-none shrink-0 whitespace-nowrap",
        "transition-transform duration-[120ms] active:scale-95",
        active
          ? "bg-[var(--ink-900)] text-white border-[var(--ink-900)]"
          : "border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--bg-muted)]",
        className
      )}
      style={{ background: !active ? "var(--bg-surface)" : undefined }}
    >
      {children}
      {count !== undefined && (
        <span
          className="text-[11px] font-bold px-1.5 py-px rounded-full"
          style={{
            background: active ? "rgba(255,255,255,.18)" : "var(--bg-muted)",
            color: active ? "rgba(255,255,255,.85)" : "var(--ink-500)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
