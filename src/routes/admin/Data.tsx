/**
 * /admin/data  — 학습 데이터 관리 (관리자 전용)
 *
 * 배포본에도 포함되지만 PIN으로 보호됩니다.
 * PIN은 환경변수 VITE_ADMIN_PIN (기본: 0000)
 * sessionStorage에 인증 상태를 보관하므로 탭 닫으면 재인증 필요.
 */
import { useEffect, useState } from "react";
import {
  getStudents,
  getAllProgressForStudent,
  getRecent,
  getBadges,
  deleteStudent,
  type Student,
  type ItemProgress,
  type RecentEntry,
} from "@/lib/storage";
import { BADGES } from "@/lib/badges";

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? "0000";
const SESSION_KEY = "ssac_admin_auth";

/* ── PIN gate ────────────────────────────────────────────────────── */
function PinGate({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  function attempt() {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onAuth();
    } else {
      setErr(true);
      setPin("");
    }
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 animate-slide-up">
      <div className="text-6xl">🔒</div>
      <div className="font-black text-kidxl text-ink-900">관리자 확인</div>
      <div className="card w-full max-w-xs space-y-4">
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => { setPin(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          className={
            "w-full rounded-2xl border-2 px-4 py-3 text-center text-kidlg font-black outline-none " +
            (err ? "border-coral-400 text-coral-500" : "border-sprout-200 focus:border-sprout-500")
          }
          placeholder="PIN 입력"
        />
        {err && <p className="text-coral-500 text-sm text-center font-bold">PIN이 틀렸어요.</p>}
        <button onClick={attempt} className="btn-primary w-full">확인</button>
      </div>
      <p className="text-xs text-ink-300">기본 PIN: VITE_ADMIN_PIN 환경변수</p>
    </div>
  );
}

/* ── Student detail card ─────────────────────────────────────────── */
function StudentCard({
  student,
  onDelete,
}: {
  student: Student;
  onDelete: () => void;
}) {
  const [progress, setProgress] = useState<Record<string, ItemProgress>>({});
  const [recent, setRecent]     = useState<RecentEntry[]>([]);
  const [badges, setBadges]     = useState<string[]>([]);
  const [open, setOpen]         = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      getAllProgressForStudent(student.id),
      getRecent(student.id),
      getBadges(student.id),
    ]).then(([p, r, b]) => { setProgress(p); setRecent(r); setBadges(b); });
  }, [open, student.id]);

  const vocabEntries = Object.entries(progress).filter(([k]) => k.startsWith("vocab|"));
  const doneCnt  = vocabEntries.filter(([, v]) => v.done).length;
  const starCnt  = vocabEntries.filter(([, v]) => v.starred).length;
  const total    = vocabEntries.length;

  async function exportStudent() {
    const data = {
      student,
      progress: await getAllProgressForStudent(student.id),
      recent:   await getRecent(student.id),
      badges:   await getBadges(student.id),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${student.name}-data.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="card space-y-3">
      {/* Summary row */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #4ab50f, #1e88e5)" }}
        >
          {student.grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-kid text-ink-900">{student.name}</div>
          <div className="text-xs text-ink-400">
            {student.grade}학년 · 가입 {new Date(student.createdAt).toLocaleDateString("ko")}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            어휘 {doneCnt}/{total} 완료 · ⭐{starCnt} · 🏅{badges.length}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => setOpen((o) => !o)} className="chip bg-sprout-100 text-sprout-700 text-xs border-0">
            {open ? "접기" : "상세"}
          </button>
          <button onClick={exportStudent} className="chip bg-sky2-400/20 text-sky2-600 text-xs border-0">
            내보내기
          </button>
        </div>
      </div>

      {/* Detail panel */}
      {open && (
        <div className="space-y-3 animate-slide-up">
          {/* Badges */}
          {badges.length > 0 && (
            <div>
              <div className="text-xs font-bold text-ink-500 mb-1.5">획득한 뱃지</div>
              <div className="flex flex-wrap gap-1">
                {badges.map((c) => (
                  <span key={c} className="chip bg-sun-300/50 text-ink-800 text-xs border-0">
                    {BADGES[c]?.emoji} {BADGES[c]?.name ?? c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <div>
              <div className="text-xs font-bold text-ink-500 mb-1.5">최근 학습</div>
              <div className="space-y-1">
                {recent.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-ink-100 rounded-xl px-3 py-1.5">
                    <span className="font-bold text-ink-700">{r.label}</span>
                    <span className="text-ink-400">{r.subject} · {new Date(r.at).toLocaleDateString("ko")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocab progress detail */}
          {vocabEntries.length > 0 && (
            <div>
              <div className="text-xs font-bold text-ink-500 mb-1.5">어휘 진도 ({doneCnt}/{total})</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${total ? (doneCnt / total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="border-t border-ink-100 pt-3">
            <div className="text-xs font-bold text-ink-400 mb-2">위험 구역</div>
            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                className="chip bg-coral-400/10 text-coral-500 text-xs border-0"
              >
                🗑 이 학생 데이터 삭제
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-coral-500 font-bold">정말 삭제?</span>
                <button
                  onClick={async () => { await deleteStudent(student.id); onDelete(); }}
                  className="chip bg-coral-400 text-white text-xs border-0"
                >
                  삭제
                </button>
                <button onClick={() => setConfirmDel(false)} className="chip bg-ink-200 text-ink-600 text-xs border-0">
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function AdminData() {
  const [authed, setAuthed] = useState(sessionStorage.getItem(SESSION_KEY) === "1");
  const [students, setStudents] = useState<Student[]>([]);

  async function load() {
    setStudents(await getStudents());
  }
  useEffect(() => { if (authed) load(); }, [authed]);

  async function exportAll() {
    const rows = await Promise.all(
      students.map(async (s) => ({
        student:  s,
        progress: await getAllProgressForStudent(s.id),
        recent:   await getRecent(s.id),
        badges:   await getBadges(s.id),
      }))
    );
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), students: rows }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ssac-study-all-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!authed) return <PinGate onAuth={() => setAuthed(true)} />;

  return (
    <section className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-black text-kidxl text-ink-900">📊 학습 데이터 관리</h1>
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
          className="text-xs text-ink-400 underline"
        >
          잠금
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "학생 수",   val: students.length, icon: "👥" },
          { label: "총 학습",   val: "–",             icon: "📚" },
          { label: "오늘 날짜", val: new Date().toLocaleDateString("ko"), icon: "📅" },
        ].map((s) => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-2xl">{s.icon}</div>
            <div className="font-black text-kidlg text-ink-900 mt-1">{s.val}</div>
            <div className="text-xs text-ink-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={exportAll} className="btn-soft text-sm">
          📥 전체 데이터 내보내기
        </button>
        <button onClick={load} className="btn-ghost text-sm">
          🔄 새로고침
        </button>
      </div>

      {/* Student cards */}
      {students.length === 0 ? (
        <div className="card-bordered text-center py-10">
          <div className="text-4xl mb-2">👶</div>
          <p className="text-ink-500">아직 등록된 학생이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <StudentCard key={s.id} student={s} onDelete={load} />
          ))}
        </div>
      )}

      {/* Back links */}
      <div className="flex gap-3">
        <a href="/admin/vocab" className="btn-soft text-sm">⚙️ 콘텐츠 관리</a>
        <a href="/"           className="btn-ghost text-sm">← 홈</a>
      </div>
    </section>
  );
}
