import { availableFor } from "@/lib/content";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "@/lib/storage";

export default function ConceptIndex() {
  const [grade, setGrade] = useState(3);
  useEffect(() => { getProfile().then((p) => setGrade(p?.grade ?? 3)); }, []);
  const tabs = availableFor(grade, "concept");

  return (
    <section className="space-y-5 animate-slide-up">
      <h1 className="font-black text-kidxl text-ink-900">
        <span className="text-sun-500">💡</span> 개념싹
      </h1>
      <div
        className="rounded-4xl p-5 text-ink-900"
        style={{ background: "linear-gradient(135deg, #ffd54f, #fff9c4)", boxShadow: "0 6px 0 #c67a00" }}
      >
        <div className="text-3xl mb-2">🚧</div>
        <div className="font-black text-kidlg">콘텐츠 준비 중</div>
        <p className="text-ink-600 text-sm mt-1">유튜브 영상 목록을 넣으면 자동으로 학습 화면이 만들어져요.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tabs.map((t) => (
          <div key={t.label} className={"rounded-4xl p-5 relative overflow-hidden " + (t.dimmed ? "dim" : "")}
            style={{ background: "linear-gradient(135deg, #f9a825, #ffd54f)", boxShadow: "0 5px 0 #c67a00" }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15" />
            <div className="text-3xl mb-2">💡</div>
            <div className="font-black text-kidlg text-ink-900">{t.label}</div>
            <div className="text-xs text-ink-600">수·사·과</div>
          </div>
        ))}
      </div>
      <Link to="/" className="btn-soft w-full">← 홈으로</Link>
    </section>
  );
}
