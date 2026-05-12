import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/** 모바일: 430px 중앙 프레임 / 태블릿+: 720px 투명 확장 */
export function PhoneShell({ children }: Props) {
  return (
    <div className="phone-shell-outer">
      <div className="phone-shell-inner">
        {children}
      </div>
    </div>
  );
}
