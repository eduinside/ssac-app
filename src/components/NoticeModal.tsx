export type Notice = { id: number; title: string; body: string; created_at: number };

const LS_KEY = (id: number) => `ssac:notice-read-${id}`;

export function isNoticeRead(id: number) {
  try { return !!localStorage.getItem(LS_KEY(id)); } catch { return false; }
}
export function markNoticeRead(id: number) {
  try { localStorage.setItem(LS_KEY(id), "1"); } catch { /* ignore */ }
}

export function NoticeModal({
  notice,
  onClose,
  fullScreen = false,
}: {
  notice: Notice;
  onClose: () => void;
  fullScreen?: boolean;
}) {
  const date = new Date(notice.created_at).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  function handleClose() {
    markNoticeRead(notice.id);
    onClose();
  }

  const topClass = fullScreen ? "top-0" : "top-[61px]";

  return (
    <div
      className={`fixed ${topClass} inset-x-0 bottom-0 z-40 flex items-end sm:items-center justify-center p-4`}
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-4xl overflow-hidden animate-slide-up"
        style={{ background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 relative"
          style={{ background: "linear-gradient(135deg, #4ab50f 0%, #1e88e5 100%)" }}
        >
          <div className="text-white/70 text-xs font-bold mb-1">📢 공지사항 · {date}</div>
          <h2 className="font-black text-kidlg text-white leading-tight">{notice.title}</h2>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-ink-700 text-kid leading-relaxed whitespace-pre-line">{notice.body}</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleClose}
            className="btn-primary w-full"
          >
            확인했어요 ✓
          </button>
        </div>
      </div>
    </div>
  );
}
