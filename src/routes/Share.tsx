import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { decodeShare, type SharePayload } from "@/lib/share";
import { BADGES } from "@/lib/badges";

export default function Share() {
  const loc = useLocation();
  const [p, setP] = useState<SharePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const hash = loc.hash.replace(/^#/, "");
    const search = new URLSearchParams(loc.search);
    const fromHash = hash ? decodeShare(hash) : null;
    if (fromHash) { setP(fromHash); return; }
    const id = search.get("s");
    if (id) {
      fetch(`/api/share?id=${encodeURIComponent(id)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => setP(data as SharePayload))
        .catch(() => setErr("공유 내용을 불러올 수 없어요."));
    } else {
      setErr("공유 코드가 없어요.");
    }
  }, [loc]);

  if (err) return <div className="card text-center py-12 text-ink-500">{err}</div>;
  if (!p) return <p className="text-ink-500 py-12 text-center">불러오는 중…</p>;

  const date = new Date(p.ts).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

  return (
    <section className="space-y-4 animate-slide-up">
      {/* Hero — 자랑 카드 */}
      <div
        className="rounded-4xl overflow-hidden p-6 text-white relative"
        style={{
          background: "linear-gradient(135deg, #4ab50f 0%, #1e88e5 100%)",
          boxShadow: "0 8px 0 #0d3b7a",
        }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="text-white/80 text-sm font-bold mb-1">📨 이만큼 열심히 했어요</div>
          <div className="font-black text-kid2xl leading-tight">
            {p.name} 친구의<br />공부 결과!
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-white/20 rounded-full px-3 py-0.5 text-sm font-bold">
              {p.grade}학년
            </span>
            <span className="text-white/60 text-xs">{date} 기준</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "✅", label: "완료한 낱말", val: p.vocab.done },
          { icon: "⭐", label: "별표 낱말", val: p.vocab.star },
          { icon: "🏅", label: "획득 뱃지", val: p.badges.length },
        ].map((s) => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-3xl">{s.icon}</div>
            <div className="font-black text-kidxl text-ink-900 mt-1">{s.val}</div>
            <div className="text-xs text-ink-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-grade breakdown */}
      {Object.keys(p.vocab.perGrade).length > 0 && (
        <div className="card space-y-2">
          <h2 className="font-black text-kidlg text-ink-800">📚 학년별 어휘</h2>
          {Object.entries(p.vocab.perGrade).map(([g, s]) => (
            <div key={g} className="flex items-center gap-3">
              <span className="text-sm font-bold text-ink-500 w-10">{g}학년</span>
              <div className="flex-1 h-3 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sprout-400 rounded-full transition-all duration-700"
                  style={{ width: s.t ? `${(s.d / s.t) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-xs text-ink-500 w-14 text-right">{s.d} / {s.t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="card space-y-3">
        <h2 className="font-black text-kidlg text-ink-800">🏅 획득한 뱃지</h2>
        {p.badges.length === 0 ? (
          <p className="text-ink-500 text-sm">아직 뱃지가 없어요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {p.badges.map((c) => (
              <span key={c} className="chip bg-sun-400/40 text-ink-800">
                {BADGES[c]?.emoji} {BADGES[c]?.name ?? c}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link to="/" className="btn-primary w-full text-center">
        🌱 나도 개념튼튼 ON싹 시작하기
      </Link>
    </section>
  );
}
