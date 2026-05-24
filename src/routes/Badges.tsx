import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BADGES } from "@/lib/badges";
import { getBadges, getBadgeTimes, getActiveStudent, getAllProgress } from "@/lib/storage";
import { makeShareUrl, type SharePayload } from "@/lib/share";

export default function Badges() {
  const [earned, setEarned] = useState<string[]>([]);
  const [badgeTimes, setBadgeTimes] = useState<Record<string, number>>({});
  const [grade, setGrade] = useState(1);
  const [name, setName] = useState("친구");
  const [stats, setStats] = useState({ done: 0, star: 0, total: 0 });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const [badges, times, s, map] = await Promise.all([
        getBadges(),
        getBadgeTimes(),
        getActiveStudent(),
        getAllProgress("vocab"),
      ]);
      setEarned(badges);
      setBadgeTimes(times);
      setGrade(s?.grade ?? 1);
      setName(s?.name ?? "친구");
      const arr = Object.values(map);
      setStats({ done: arr.filter((v) => v.done).length, star: arr.filter((v) => v.starred).length, total: arr.length });
    })();
  }, []);

  async function share() {
    const map = await getAllProgress("vocab");
    const perGrade: SharePayload["vocab"]["perGrade"] = {};
    for (const [id, v] of Object.entries(map)) {
      const m = id.match(/^g(\d+)-/);
      const g = m ? m[1] : "?";
      perGrade[g] ??= { d: 0, s: 0, t: 0 };
      perGrade[g].t++;
      if (v.done) perGrade[g].d++;
      if (v.starred) perGrade[g].s++;
    }
    const url = await makeShareUrl({ v: 1, name, grade, vocab: { ...stats, perGrade }, badges: earned, ts: Date.now() });
    setShareUrl(url);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch { }
  }

  const earnedCount = earned.length;
  const totalCount = Object.keys(BADGES).length;

  return (
    <section className="space-y-5 animate-slide-up">
      {/* Header card */}
      <div
        className="rounded-4xl overflow-hidden p-6 text-white relative"
        style={{
          background: "linear-gradient(135deg, #f9a825 0%, #ffd54f 60%, #ffe082 100%)",
          boxShadow: "0 8px 0 #c67a00",
        }}
      >
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/15" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="text-6xl animate-float-slow">🏅</div>
          <div>
            <div className="text-ink-900/70 text-sm font-bold">내가 모은 뱃지</div>
            <div className="font-black text-kid2xl text-ink-900 leading-tight">
              {earnedCount} / {totalCount}
            </div>
            <div className="text-ink-900/60 text-sm">{grade}학년</div>
          </div>
        </div>
        {/* Progress */}
        <div className="relative z-10 mt-4">
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${(earnedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "✅", label: "완료", val: stats.done },
          { icon: "⭐", label: "즐겨찾기", val: stats.star },
          { icon: "🏅", label: "뱃지", val: earnedCount },
        ].map((s) => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-3xl">{s.icon}</div>
            <div className="font-black text-kidxl text-ink-900 mt-1">{s.val}</div>
            <div className="text-xs text-ink-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badge grid */}
      <div>
        <h2 className="font-black text-kidlg text-ink-800 mb-3">뱃지 목록</h2>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(BADGES).map(([code, b]) => {
            const have = earned.includes(code);
            const ts = badgeTimes[code];
            const dateStr = ts
              ? new Date(ts).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
              : null;
            return (
              <div
                key={code}
                className={
                  "rounded-4xl p-4 text-center transition-all " +
                  (have ? "animate-pop-in" : "dim")
                }
                style={
                  have
                    ? {
                      background: "linear-gradient(135deg, #ffd54f, #fff9c4)",
                      boxShadow: "0 5px 0 #c67a00",
                    }
                    : {
                      background: "#e0e0e0",
                      boxShadow: "0 4px 0 #bdbdbd",
                    }
                }
              >
                <div className={"text-4xl " + (have ? "animate-bounce-in" : "")}>{b.emoji}</div>
                <div className="font-black text-sm text-ink-900 mt-1">{b.name}</div>
                <div className="text-xs text-ink-500 mt-0.5">{b.desc}</div>
                {have && dateStr && (
                  <div className="text-[10px] text-ink-400 mt-1.5 font-bold">{dateStr} 획득</div>
                )}
                {!have && <div className="text-xs text-ink-300 mt-1">🔒</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Share section */}
      <div className="card space-y-3">
        <h2 className="font-black text-kidlg text-ink-800">📨 내 학습 공유하기</h2>
        <p className="text-sm text-ink-500">
          링크를 가족이나 선생님께 보내봐요. 내 학습 결과가 담겨요.
        </p>
        <button onClick={share} className="btn-sun w-full">
          🔗 공유 링크 만들기
        </button>
        {shareUrl && (
          <div
            className="rounded-3xl p-4 space-y-2"
            style={{ background: "linear-gradient(135deg, #f0fde8, #dcfac6)" }}
          >
            <div className="font-black text-sprout-700 flex items-center gap-2">
              {copied ? "✅ 링크가 복사됐어!" : "📋 링크 복사하기"}
            </div>
            <div className="text-xs break-all text-ink-500 bg-white rounded-2xl p-2">
              {shareUrl}
            </div>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
              }}
              className="btn-primary text-sm"
            >
              다시 복사
            </button>
          </div>
        )}
      </div>

      <Link to="/" className="btn-soft w-full">
        ← 홈으로
      </Link>
    </section>
  );
}
