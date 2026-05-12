import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "fav" | "done";
  size?: "md" | "sm";
}

export function IconButton({ variant = "default", size = "md", className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        "grid place-items-center rounded-full border cursor-pointer select-none",
        "transition-transform duration-[120ms]",
        "active:scale-[.94]",
        size === "md" ? "w-10 h-10" : "w-8 h-8",
        variant === "default" && [
          "border-[var(--ink-200)] text-[var(--ink-700)]",
          "hover:bg-[var(--bg-muted)]",
        ],
        variant === "fav" && [
          "bg-[var(--color-secondary-100)] border-[var(--color-secondary-300)]",
          "text-[var(--color-secondary-700)]",
        ],
        variant === "done" && [
          "bg-[var(--color-primary-500)] border-[var(--color-primary-600)] text-white",
        ],
        className
      )}
      style={{ background: variant === "default" ? "var(--bg-surface)" : undefined }}
    />
  );
}
