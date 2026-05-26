import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/AppShell";

const Home        = lazy(() => import("./routes/Home"));
const VocabIndex  = lazy(() => import("./routes/vocab/Index"));
const VocabWord   = lazy(() => import("./routes/vocab/Word"));
const VocabReview = lazy(() => import("./routes/vocab/Review"));
const ConceptIndex= lazy(() => import("./routes/concept/Index"));
const ConceptBookView= lazy(() => import("./routes/concept/BookView"));
const ConceptKeywordLearn= lazy(() => import("./routes/concept/KeywordLearn"));
const ReadingIndex= lazy(() => import("./routes/reading/Index"));
const ReadingTopic= lazy(() => import("./routes/reading/Topic"));
const EnglishIndex= lazy(() => import("./routes/english/Index"));
const EnglishItem = lazy(() => import("./routes/english/Item"));
const Badges      = lazy(() => import("./routes/Badges"));
const Share       = lazy(() => import("./routes/Share"));

// Admin routes — included in all builds, /data is PIN-gated, /vocab is dev-only
const AdminVocab  = lazy(() => import("./routes/admin/Vocab"));
const AdminData   = lazy(() => import("./routes/admin/Data"));

const Fallback = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="text-4xl animate-float-slow">🌱</div>
    <p className="text-ink-500">불러오는 중…</p>
  </div>
);

const wrap = (el: React.ReactNode) => (
  <AppShell>
    <Suspense fallback={<Fallback />}>{el}</Suspense>
  </AppShell>
);

export const router = createBrowserRouter([
  { path: "/",                  element: wrap(<Home />) },
  { path: "/vocab",             element: wrap(<VocabIndex />) },
  { path: "/vocab/:grade",      element: wrap(<VocabIndex />) },
  { path: "/vocab/:grade/review/:afterIndex", element: wrap(<VocabReview />) },
  { path: "/vocab/:grade/:wordId", element: wrap(<VocabWord />) },
  
  { path: "/concept",           element: wrap(<ConceptIndex />) },
  { path: "/concept/:grade/:semester", element: wrap(<ConceptBookView />) },
  { path: "/concept/:grade/keyword/:kid", element: wrap(<ConceptKeywordLearn />) },
  
  { path: "/reading",           element: wrap(<ReadingIndex />) },
  { path: "/reading/:grade",   element: wrap(<ReadingIndex />) },
  { path: "/reading/:grade/:topicId", element: wrap(<ReadingTopic />) },
  { path: "/english",           element: wrap(<EnglishIndex />) },
  { path: "/english/:grade",   element: wrap(<EnglishIndex />) },
  { path: "/english/:grade/:itemId", element: wrap(<EnglishItem />) },
  { path: "/badges",            element: wrap(<Badges />) },
  { path: "/share",             element: wrap(<Share />) },

  // /admin/data : PIN-gated, 배포본 포함 (학생 기기에서 URL 몰라야 함)
  { path: "/admin/data",        element: wrap(<AdminData />) },

  // /admin/vocab : dev 전용 (콘텐츠 JSON 생성)
  ...(import.meta.env.DEV
    ? [{ path: "/admin/vocab", element: wrap(<AdminVocab />) }]
    : []),

  { path: "*", element: <Navigate to="/" replace /> },
]);
