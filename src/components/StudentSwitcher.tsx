import { useEffect, useState } from "react";
import {
  getStudents,
  getActiveStudentId,
  switchStudent,
  deleteStudent,
  addStudent,
  type Student,
} from "@/lib/storage";

const GRADE_CFG = [
  { emoji: "🌱", color: "bg-sprout-400", shadow: "#266607" },
  { emoji: "🐣", color: "bg-sky2-400",   shadow: "#0d47a1" },
  { emoji: "🌻", color: "bg-sun-400",    shadow: "#c67a00" },
  { emoji: "🦋", color: "bg-coral-400",  shadow: "#bf360c" },
  { emoji: "🔭", color: "bg-violet-400", shadow: "#4a0070" },
  { emoji: "🚀", color: "bg-sprout-600", shadow: "#1a4a00" },
];

export function StudentSwitcher({
  onClose,
  onSwitch,
}: {
  onClose: () => void;
  onSwitch: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    const [s, id] = await Promise.all([getStudents(), getActiveStudentId()]);
    setStudents(s);
    setActiveId(id);
  }
  useEffect(() => { load(); }, []);

  async function doSwitch(id: string) {
    await switchStudent(id);
    onSwitch();
    onClose();
  }

  async function doAdd() {
    if (!newName.trim() || !newGrade) return;
    await addStudent(newName.trim(), newGrade);
    onSwitch();
    onClose();
  }

  async function doDelete(id: string) {
    await deleteStudent(id);
    setConfirmDelete(null);
    onSwitch();
    await load();
  }

  return (
    <div
      className="fixed inset-0 bg-ink-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-4xl overflow-hidden animate-pop-in"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #4ab50f, #1e88e5)" }}
        >
          <div className="font-black text-kidlg text-white">👥 학생 전환</div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        <div className="bg-white p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Student list */}
          {students.map((s) => {
            const cfg = GRADE_CFG[s.grade - 1];
            const isActive = s.id === activeId;
            return (
              <div key={s.id}>
                <div
                  className={
                    "flex items-center gap-3 rounded-3xl p-3 transition " +
                    (isActive ? "bg-sprout-50 border-2 border-sprout-400" : "bg-ink-100 hover:bg-ink-100/80 border-2 border-transparent")
                  }
                >
                  <div
                    className={"w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 " + cfg.color}
                    style={{ boxShadow: `0 4px 0 ${cfg.shadow}` }}
                  >
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-kid text-ink-900 truncate">{s.name}</div>
                    <div className="text-xs text-ink-400">{s.grade}학년</div>
                  </div>
                  {isActive ? (
                    <span className="chip bg-sprout-100 text-sprout-700 text-xs">현재</span>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => doSwitch(s.id)}
                        className="chip bg-sprout-500 text-white text-xs border-0"
                      >
                        전환
                      </button>
                      {confirmDelete === s.id ? (
                        <button
                          onClick={() => doDelete(s.id)}
                          className="chip bg-coral-400 text-white text-xs border-0"
                        >
                          확인
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(s.id)}
                          className="chip bg-ink-200 text-ink-500 text-xs border-0"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add new student */}
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full rounded-3xl border-2 border-dashed border-sprout-300 py-4 font-bold text-sprout-600 hover:border-sprout-500 hover:bg-sprout-50 transition"
            >
              + 새 친구 추가
            </button>
          ) : (
            <div className="rounded-3xl border-2 border-sprout-300 bg-sprout-50 p-4 space-y-3 animate-slide-up">
              <div className="font-black text-ink-800">새 친구 정보</div>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={10}
                className="w-full rounded-2xl border-2 border-sprout-200 px-4 py-2 font-bold text-kid outline-none focus:border-sprout-500"
                placeholder="이름 (별명 OK)"
              />
              <div className="grid grid-cols-6 gap-1.5">
                {GRADE_CFG.map((cfg, i) => {
                  const g = i + 1;
                  return (
                    <button
                      key={g}
                      onClick={() => setNewGrade(g)}
                      className={
                        "aspect-square rounded-2xl flex flex-col items-center justify-center text-white font-black text-xs transition " +
                        cfg.color +
                        (newGrade === g ? " ring-4 ring-white ring-offset-2 scale-110" : " opacity-70 hover:opacity-100")
                      }
                      style={{ boxShadow: `0 4px 0 ${cfg.shadow}` }}
                    >
                      <span className="text-lg">{cfg.emoji}</span>
                      <span>{g}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setAdding(false); setNewName(""); setNewGrade(null); }}
                  className="btn-soft flex-1 text-sm"
                >
                  취소
                </button>
                <button
                  disabled={!newName.trim() || !newGrade}
                  onClick={doAdd}
                  className="btn-primary flex-1 text-sm disabled:opacity-30"
                >
                  추가
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
