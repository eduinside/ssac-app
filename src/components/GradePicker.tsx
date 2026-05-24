const GRADE_CFG = [
  { label: "1학년", emoji: "🌱", bg: "bg-sprout-400",  shadow: "#266607",  delay: "stagger-1" },
  { label: "2학년", emoji: "🐣", bg: "bg-sky2-400",    shadow: "#0d47a1",  delay: "stagger-2" },
  { label: "3학년", emoji: "🌻", bg: "bg-sun-400",     shadow: "#c67a00",  delay: "stagger-3" },
  { label: "4학년", emoji: "🦋", bg: "bg-coral-400",   shadow: "#bf360c",  delay: "stagger-4" },
  { label: "5학년", emoji: "🔭", bg: "bg-violet-400",  shadow: "#4a0070",  delay: "stagger-5" },
  { label: "6학년", emoji: "🚀", bg: "bg-sprout-600",  shadow: "#1a4a00",  delay: "stagger-6" },
];

export function GradePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (g: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
      {GRADE_CFG.map((cfg, i) => {
        const g = i + 1;
        const active = value === g;
        return (
          <button
            key={g}
            onClick={() => onChange(g)}
            aria-pressed={active}
            className={
              "animate-pop-in " + cfg.delay +
              " relative group flex flex-col items-center justify-center " +
              "aspect-square rounded-4xl font-black text-white " +
              "transition-all duration-150 cursor-pointer " +
              cfg.bg +
              (active ? " scale-105" : " hover:scale-105")
            }
            style={{
              boxShadow: active
                ? `0 8px 0 ${cfg.shadow}, 0 0 0 4px white, 0 0 0 6px ${cfg.shadow}`
                : `0 7px 0 ${cfg.shadow}`,
            }}
          >
            <span
              className={
                "text-4xl mb-1 transition-transform duration-300 " +
                (active ? "animate-bounce-in" : "group-hover:scale-110")
              }
            >
              {cfg.emoji}
            </span>
            <span className="text-base leading-none">{cfg.label}</span>
            {active && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm animate-bounce-in">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
