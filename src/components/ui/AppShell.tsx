import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface Props {
  children: ReactNode;
}

/** 모바일: 단일 컬럼 / 태블릿+: 사이드바(260px) + 메인 2컬럼 */
export function AppShell({ children }: Props) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
