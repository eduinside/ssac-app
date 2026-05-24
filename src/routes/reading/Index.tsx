import { availableFor } from "@/lib/content";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "@/lib/storage";

export default function ReadingIndex() {
  const [grade, setGrade] = useState(2);
  useEffect(() => { getProfile().then((p) => setGrade(p?.grade ?? 2)); }, []);
  const tabs = availableFor(grade, "reading");

  return (
    <section className="space-y-5 animate-slide-up">
      <h1 className="font-black text-kidxl text-ink-900">
        <span className="text-sky2-500">📖</span> 독해싹
      </h1>
      <div
        className="rounded-4xl p-5"
        style={{ background: "linear-gradient(135deg, #1e88e5, #5ab8ff)", boxShadow: "0 6px 0 #0d47a1" }}
      >
        <div className="text-3xl mb-2">🚧</div>
        <div className="font-black text-kidlg text-white">콘텐츠 준비 중</div>
        <p className="text-white/80 text-sm mt-1">PDF 주제별 읽기 자료를 추가하면 여기에 표시돼요.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tabs.map((t) => (
          <div key={t.label} className={"rounded-4xl p-4 text-center relative overflow-hidden " + (t.dimmed ? "dim" : "")}
            style={{ background: "linear-gradient(135deg, #1e88e5, #5ab8ff)", boxShadow: "0 5px 0 #0d47a1" }}>
            <div className="text-3xl mb-2">📖</div>
            <div className="font-black text-white">{t.label}</div>
            <div className="text-xs text-white/70">30개 주제</div>
          </div>
        ))}
      </div>
      <Link to="/" className="btn-soft w-full">← 홈으로</Link>
    </section>
  );
}
