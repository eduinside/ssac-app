"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Star, Play, ChevronRight, Layers } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { IconButton } from "@/components/ui/IconButton";
import { storage } from "@/lib/storage";
import { loadWord, loadReview, gradeFromId } from "@/lib/content";

interface FavItem {
  id: string;
  label: string;
  sub: string;
  isReview: boolean;
  grade: number;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getFavorites("v-").then(async (list) => {
      const resolved = await Promise.all(
        list.map(async (p) => {
          const id = p.id;
          const grade = gradeFromId(id);
          const isReview = id.includes("-r");
          if (isReview) {
            const review = await loadReview(grade, id);
            return {
              id,
              label: review?.title ?? id,
              sub: `다섯고개 · ${review?.quizzes.length ?? 0}문항`,
              isReview,
              grade,
            };
          } else {
            const word = await loadWord(grade, id);
            return {
              id,
              label: word?.word ?? id,
              sub: word?.pos ?? "",
              isReview,
              grade,
            };
          }
        })
      );
      setItems(resolved);
      setLoading(false);
    });
  }, []);

  const wordCount = items.filter((i) => !i.isReview).length;

  return (
    <PhoneShell>
      <nav className="grid items-center gap-2 px-4 py-2" style={{ gridTemplateColumns: "40px 1fr 40px" }}>
        <IconButton onClick={() => router.back()} aria-label="뒤로">
          <ChevronLeft size={20} strokeWidth={2.4} />
        </IconButton>
        <p className="text-center text-[17px] font-bold">즐겨찾기</p>
        <span />
      </nav>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-32 flex flex-col gap-2 pt-1">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm" style={{ color: "var(--ink-400)" }}>
            불러오는 중...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: "var(--ink-400)" }}>
            <Star size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">즐겨찾기한 어휘가 없어요</p>
            <p className="text-xs">어휘 목록에서 ☆을 눌러 추가해 보세요</p>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-semibold px-1 pt-1 pb-0.5" style={{ color: "var(--ink-400)" }}>
              {items.length}개 저장됨
            </p>
            {items.map((item) => {
              const href = item.isReview
                ? `/vocab/review/${item.id}`
                : `/vocab/word/${item.id}`;
              return (
                <Link key={item.id} href={href} className="no-underline">
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] cursor-pointer transition-all duration-[120ms] active:scale-[.995]"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--ink-200)",
                      boxShadow: "var(--shadow-1)",
                    }}
                  >
                    {/* Icon */}
                    <span
                      className="w-10 h-10 rounded-[12px] grid place-items-center shrink-0"
                      style={{
                        background: item.isReview
                          ? "var(--section-explore-soft)"
                          : "var(--color-secondary-100)",
                        color: item.isReview
                          ? "var(--section-explore-ink)"
                          : "var(--color-secondary-700)",
                      }}
                    >
                      {item.isReview ? (
                        <Play size={18} fill="currentColor" />
                      ) : (
                        <Star size={18} fill="currentColor" strokeWidth={0} />
                      )}
                    </span>

                    {/* Text */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        className="text-[16px] font-bold leading-tight"
                        style={{ color: "var(--ink-900)", letterSpacing: "-.015em" }}
                      >
                        {item.label}
                      </span>
                      {item.sub && (
                        <span className="text-[12px] font-medium" style={{ color: "var(--ink-400)" }}>
                          {item.sub}
                        </span>
                      )}
                    </div>

                    {/* Grade + arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[11px] font-bold h-5 px-2 rounded-full inline-flex items-center"
                        style={{ background: "var(--bg-muted)", color: "var(--ink-500)" }}
                      >
                        {item.grade}학년
                      </span>
                      <ChevronRight size={16} strokeWidth={2.2} style={{ color: "var(--ink-300)" }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* 플래시카드 CTA — 단어 즐겨찾기가 있을 때만 표시 */}
      {!loading && wordCount > 0 && (
        <div
          className="absolute left-0 right-0 bottom-0 px-5 pb-6 pt-4 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(251,250,247,0) 0%, var(--bg-app) 35%)" }}
        >
          <Link href="/favorites/flashcard" className="pointer-events-auto block">
            <button
              className="w-full h-[52px] rounded-full font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
              style={{
                background: "var(--color-primary-500)",
                boxShadow: "0 4px 0 var(--color-primary-700), var(--shadow-pop)",
              }}
            >
              <Layers size={18} strokeWidth={2.2} />
              플래시카드 학습 시작
              <span
                className="ml-1 h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center"
                style={{ background: "rgba(255,255,255,.25)" }}
              >
                {wordCount}
              </span>
            </button>
          </Link>
        </div>
      )}
    </PhoneShell>
  );
}
