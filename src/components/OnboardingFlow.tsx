import { useRef, useState } from "react";
import { addStudent } from "@/lib/storage";

const GRADE_CFG = [
  { emoji: "🌱", color: "bg-sprout-400", shadow: "#266607" },
  { emoji: "🐣", color: "bg-sky2-400", shadow: "#0d47a1" },
  { emoji: "🌻", color: "bg-sun-400", shadow: "#c67a00" },
  { emoji: "🦋", color: "bg-coral-400", shadow: "#bf360c" },
  { emoji: "🔭", color: "bg-violet-400", shadow: "#4a0070" },
  { emoji: "🚀", color: "bg-sprout-600", shadow: "#1a4a00" },
];

const SUBJECTS = [
  { emoji: "🌱", label: "어휘싹", desc: "어휘력 키우기", bg: "from-sprout-400 to-sprout-300" },
  { emoji: "💡", label: "개념싹", desc: "교과 문해력 기르기", bg: "from-sun-400 to-sun-300" },
  { emoji: "📖", label: "독해싹", desc: "독해력 기르기", bg: "from-sky2-400 to-sky2-300" },
  { emoji: "🅰️", label: "영어싹", desc: "영어 표현력 기르기", bg: "from-coral-400 to-coral-300" },
];

export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"name" | "grade">("name");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  async function finish(grade: number) {
    setSaving(true);
    await addStudent(name.trim() || "친구", grade);
    onDone();
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      formRef.current?.querySelector("input")?.focus();
    }, 500);
  }

  return (
    <div className="-mx-4 -mt-6 -mb-28 sm:-mb-10" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}>
      {/* ── 고정 배경 ── */}
      <div
        className="fixed inset-0 -z-10"
        style={{ background: "linear-gradient(160deg, #f0fde8 0%, #e8f5ff 55%, #fff9e6 100%)" }}
      >
        <div className="blob w-72 h-72 bg-sprout-300 -top-20 -left-28 animate-float-slow opacity-50" />
        <div className="blob w-56 h-56 bg-sky2-300 bottom-24 -right-24 animate-float-fast opacity-40" />
        <div className="blob w-40 h-40 bg-sun-300 top-1/3 right-8 animate-float-slow opacity-30" />
        <div className="blob w-44 h-44 bg-sprout-200 bottom-1/3 -left-16 animate-float-fast opacity-35" />
      </div>

      {/* ── 섹션 1: 앱 소개 ── */}
      <section className="relative min-h-svh flex flex-col items-center justify-center px-6 pb-10">
        <div className="w-full max-w-sm space-y-8 text-center animate-slide-up">
          {/* 로고 */}
          <div>
            <img src="/app-icon.png" alt="개념튼튼 ON싹" className="w-28 h-28 mx-auto mb-3 animate-float-slow select-none drop-shadow-lg" />
            <h1
              className="font-black text-kid2xl leading-none"
              style={{
                background: "linear-gradient(135deg, #4ab50f, #1e88e5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              개념튼튼 ON싹
            </h1>
            <p className="mt-2 text-ink-600 font-bold text-sm">초등 기초·기본을 다져요</p>
          </div>

          {/* 과목 카드 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS.map((s, i) => (
              <div
                key={s.label}
                className={"rounded-3xl p-4 text-white text-left bg-gradient-to-br " + s.bg + " animate-pop-in stagger-" + (i + 1)}
                style={{ boxShadow: "0 4px 0 rgba(0,0,0,0.15)" }}
              >
                <div className="text-3xl mb-1">{s.emoji}</div>
                <div className="font-black text-kidlg leading-tight">{s.label}</div>
                <div className="text-xs text-white/80 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* 시작 버튼 */}
          <button onClick={scrollToForm} className="btn-primary w-full text-kidlg">
            지금 시작하기 🚀
          </button>
        </div>
      </section>

      {/* ── 섹션 2: 이름·학년 입력 ── */}
      <section
        ref={formRef}
        className="relative min-h-svh flex flex-col justify-center px-6 py-12"
      >
        <div className="w-full max-w-sm mx-auto space-y-8">
          {step === "name" && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center">
                <div className="text-5xl mb-3">👋</div>
                <div className="font-black text-kidxl text-ink-900">안녕! 이름이 뭐야?</div>
                <p className="text-ink-500 mt-1 text-sm">별명이어도 괜찮아 😊</p>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("grade")}
                maxLength={10}
                className="w-full rounded-3xl border-2 border-sprout-200 px-5 py-4 text-kidlg font-black text-center outline-none focus:border-sprout-500 transition bg-white/80"
                placeholder="예) 새싹이, 공부왕"
              />
              <button
                disabled={!name.trim()}
                onClick={() => setStep("grade")}
                className="btn-primary w-full text-kidlg disabled:opacity-30"
              >
                다음 →
              </button>
              <p className="text-center text-xs text-ink-400 leading-relaxed">
                🔒 입력한 정보는 이 기기에만 저장돼요.
              </p>
            </div>
          )}

          {step === "grade" && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center">
                <div className="text-5xl mb-3">🎒</div>
                <div className="font-black text-kidxl text-ink-900">
                  <span className="text-sprout-500">{name}</span> 친구야,<br />몇 학년이야?
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {GRADE_CFG.map((cfg, i) => {
                  const g = i + 1;
                  return (
                    <button
                      key={g}
                      disabled={saving}
                      onClick={() => finish(g)}
                      className={
                        "animate-pop-in stagger-" + g +
                        " aspect-square rounded-4xl flex flex-col items-center justify-center " +
                        "font-black text-white transition-all hover:scale-105 active:scale-95 " +
                        cfg.color
                      }
                      style={{ boxShadow: `0 7px 0 ${cfg.shadow}` }}
                    >
                      <span className="text-4xl">{cfg.emoji}</span>
                      <span className="text-kidlg">{g}학년</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setStep("name")} className="btn-ghost w-full text-sm">
                ← 이름 다시 입력
              </button>
            </div>
          )}
        </div>

        {/* 카피라이트 */}
        <p className="absolute bottom-4 left-0 right-0 text-center text-ink-400 text-xs leading-relaxed px-4">
          대구광역시교육청 개발 자료를 활용해 제작하였습니다.<br />
          2026년 5월 업데이트
        </p>
      </section>
    </div>
  );
}
