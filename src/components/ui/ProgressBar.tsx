interface Props {
  value: number; // 0–100
  color?: string; // CSS color or gradient
  height?: number;
  bgColor?: string;
}

export function ProgressBar({ value, color, height = 6, bgColor }: Props) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{
        height,
        background: bgColor ?? "var(--color-primary-100)",
      }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background:
            color ??
            "linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))",
        }}
      />
    </div>
  );
}
