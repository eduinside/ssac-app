import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getActiveStudent, type Student } from "@/lib/storage";
import { StudentSwitcher } from "./StudentSwitcher";

const ALL_SUBJECTS = [
  { to: "/vocab",   emoji: "🌱", label: "어휘" },
  { to: "/concept", emoji: "💡", label: "개념" },
  { to: "/reading", emoji: "📖", label: "독해" },
  { to: "/english", emoji: "🅰️", label: "영어", comingSoon: true },
];
const DEFAULT_RECENT = ["/vocab", "/concept"];
const LS_KEY = "ssac:recentSubjects";

function getRecentSubjects(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : DEFAULT_RECENT;
    return Array.isArray(arr) ? arr : DEFAULT_RECENT;
  } catch { return DEFAULT_RECENT; }
}
function pushRecentSubject(to: string) {
  const prev = getRecentSubjects().filter((r) => r !== to);
  localStorage.setItem(LS_KEY, JSON.stringify([to, ...prev]));
}

const GRADE_COLORS = [
  "bg-sprout-400",
  "bg-sky2-400",
  "bg-sun-400",
  "bg-coral-400",
  "bg-violet-400",
  "bg-sprout-600",
];
const GRADE_SHADOWS = [
  "#266607","#0d47a1","#c67a00","#bf360c","#4a0070","#1a4a00",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const [student, setStudent] = useState<Student | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const loadStudent = useCallback(() => {
    getActiveStudent().then(setStudent);
  }, []);

  const [recentSubjects, setRecentSubjects] = useState<string[]>(getRecentSubjects);

  useEffect(() => { loadStudent(); }, [loc.pathname, loadStudent]);

  useEffect(() => {
    window.addEventListener("ssac:student-changed", loadStudent);
    return () => window.removeEventListener("ssac:student-changed", loadStudent);
  }, [loadStudent]);

  // Track recently visited subjects and update bottom nav
  useEffect(() => {
    const match = ALL_SUBJECTS.find((s) => loc.pathname.startsWith(s.to));
    if (match) {
      pushRecentSubject(match.to);
      setRecentSubjects(getRecentSubjects());
    }
  }, [loc.pathname]);

  const gradeIdx  = student ? student.grade - 1 : 0;
  const gradeColor  = GRADE_COLORS[gradeIdx];
  const gradeShadow = GRADE_SHADOWS[gradeIdx];

  const midItems = recentSubjects
    .map((to) => ALL_SUBJECTS.find((s) => s.to === to)!)
    .filter((s) => s && !s.comingSoon)
    .slice(0, 2);

  const navItems = [
    { to: "/",       emoji: "🏠", label: "홈" },
    ...midItems,
    { to: "/badges", emoji: "🏅", label: "뱃지" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className={"sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-ink-100/80 shadow-sm" + (!student ? " hidden" : "")}>
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/sprout.svg" className="w-9 h-9 group-hover:animate-wiggle" alt="" />
            <span
              className="font-noto text-kidlg tracking-tight"
              style={{
                background: "linear-gradient(135deg, #4ab50f 0%, #1e88e5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              개념튼튼 ON싹
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {student ? (
              <button
                onClick={() => setShowSwitcher(true)}
                className={"chip text-white border-0 " + gradeColor}
                style={{ boxShadow: `0 4px 0 ${gradeShadow}` }}
              >
                {student.name} · {student.grade}학년 ▾
              </button>
            ) : null}
            {student && (
              <Link to="/badges" className="chip bg-sun-300 text-ink-900 border-sun-400 hover:bg-sun-400 transition">
                🏅
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-28 sm:pb-10">
        {children}
      </main>

      {/* ── Bottom nav ── */}
      {student && (
        <nav className="fixed bottom-0 inset-x-0 z-20 sm:hidden bg-white/90 backdrop-blur-lg border-t border-ink-100 safe-area-inset-bottom">
          <div className="flex">
            {navItems.map((item) => {
              const active =
                item.to === "/"
                  ? loc.pathname === "/"
                  : loc.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    "flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-bold transition-all " +
                    (active ? "text-sprout-600" : "text-ink-300")
                  }
                >
                  <span className={"text-2xl transition-transform " + (active ? "scale-110" : "")}>
                    {item.emoji}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── Student Switcher Modal ── */}
      {showSwitcher && (
        <StudentSwitcher
          onClose={() => setShowSwitcher(false)}
          onSwitch={() => { loadStudent(); setShowSwitcher(false); }}
        />
      )}
    </div>
  );
}
