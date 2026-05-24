import { Link } from "react-router-dom";

export type SubjectKey = "vocab" | "concept" | "reading" | "english";

const SUBJECT_CFG: Record<
  SubjectKey,
  { gradient: string; shadow: string; iconBg: string; textColor: string }
> = {
  vocab: {
    gradient: "linear-gradient(135deg, #4ab50f 0%, #8fe558 60%, #dcfac6 100%)",
    shadow: "#266607",
    iconBg: "bg-white/30",
    textColor: "text-white",
  },
  concept: {
    gradient: "linear-gradient(135deg, #f9a825 0%, #ffd54f 60%, #fff9c4 100%)",
    shadow: "#b56a00",
    iconBg: "bg-white/30",
    textColor: "text-ink-900",
  },
  reading: {
    gradient: "linear-gradient(135deg, #1e88e5 0%, #5ab8ff 60%, #bbdefb 100%)",
    shadow: "#0d47a1",
    iconBg: "bg-white/30",
    textColor: "text-white",
  },
  english: {
    gradient: "linear-gradient(135deg, #e91e8c 0%, #f48fb1 60%, #f8bbd9 100%)",
    shadow: "#880e4f",
    iconBg: "bg-white/30",
    textColor: "text-white",
  },
};

export function SubjectCard({
  to,
  title,
  emoji,
  tag,
  subjectKey,
  recommended,
  disabled,
  comingSoon,
  progress,
}: {
  to: string;
  title: string;
  emoji: string;
  tag: string;
  subjectKey?: SubjectKey;
  recommended?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  progress?: { done: number; total: number };
  color?: string;
}) {
  const cfg = subjectKey
    ? SUBJECT_CFG[subjectKey]
    : { gradient: "linear-gradient(135deg, #bdbdbd, #e0e0e0)", shadow: "#9e9e9e", iconBg: "bg-white/20", textColor: "text-white" };

  return (
    <Link
      to={to}
      aria-disabled={disabled || comingSoon}
      className={
        "relative block rounded-4xl overflow-hidden group transition-all duration-150 " +
        (disabled || comingSoon ? "dim pointer-events-none" : "hover:scale-[1.02] active:scale-[0.98]")
      }
      style={{
        background: cfg.gradient,
        boxShadow: `0 8px 0 ${cfg.shadow}`,
      }}
    >
      {/* Decorative circle */}
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/15" />
      <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative p-5">
        {/* Badge */}
        {comingSoon ? (
          <span className="absolute top-3 right-3 text-xs font-black bg-black/40 text-white rounded-full px-2 py-0.5 shadow backdrop-blur-[2px]">
            ⏳ 준비중
          </span>
        ) : recommended ? (
          <span className="absolute top-3 right-3 text-xs font-black bg-white/90 rounded-full px-2 py-0.5 text-sprout-700 shadow">
            ✨ 추천
          </span>
        ) : null}

        {/* Icon */}
        <div
          className={"w-14 h-14 rounded-2xl flex items-center justify-center text-4xl mb-3 " + cfg.iconBg}
          style={{ backdropFilter: "blur(4px)" }}
        >
          {emoji}
        </div>

        {/* Text */}
        <div className={"font-black text-kidlg leading-tight " + cfg.textColor}>{title}</div>
        <div className={"text-sm mt-0.5 " + cfg.textColor + " opacity-80"}>{tag}</div>

        {/* Progress mini bar */}
        {progress && progress.total > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <div className={"text-xs mt-1 font-bold " + cfg.textColor + " opacity-80"}>
              {progress.done}/{progress.total} 완료
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
