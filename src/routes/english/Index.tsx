import { availableFor } from "@/lib/content";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "@/lib/storage";

export default function EnglishIndex() {
  const [grade, setGrade] = useState(3);
  useEffect(() => { getProfile().then((p) => setGrade(p?.grade ?? 3)); }, []);
  const tabs = availableFor(grade, "english");

  return (
    <section className="space-y-5 animate-slide-up">
      <h1 className="font-black text-kidxl text-ink-900">
        <span>🅰️</span> 영어싹
      </h1>
      <div
        className="rounded-4xl p-5"
        style={{ background: "linear-gradient(135deg, #e91e8c, #f48fb1)", boxShadow: "0 6px 0 #880e4f" }}
      >
        <div className="text-3xl mb-2">🎬</div>
        <div className="font-black text-kidlg text-white">영상 목록 준비 중</div>
        <p className="text-white/80 text-sm mt-1">mp4 링크를 content/english에 추가하면 여기에 표시돼요.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tabs.map((t) => (
          <div key={t.label} className={"rounded-4xl p-4 text-center relative overflow-hidden " + (t.dimmed ? "dim" : "")}
            style={{ background: "linear-gradient(135deg, #e91e8c, #f48fb1)", boxShadow: "0 5px 0 #880e4f" }}>
            <div className="text-3xl mb-2">🅰️</div>
            <div className="font-black text-white">{t.label}</div>
            <div className="text-xs text-white/70">영상 학습</div>
          </div>
        ))}
      </div>
      <Link to="/" className="btn-soft w-full">← 홈으로</Link>
    </section>
  );
}
