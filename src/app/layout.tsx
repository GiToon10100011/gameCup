// 모든 페이지를 감싸는 루트 레이아웃 (Next.js App Router 규약).
// 전역 스타일·Provider(TanStack Query 등)·문서 메타데이터를 여기서 주입한다.

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// 브라우저 탭 제목·검색엔진 메타데이터. 페이지별로 덮어쓸 수 있음.
export const metadata: Metadata = {
  title: "GameCup",
  description: "Tournament-style game preference selector",
};

/**
 * 루트 레이아웃 — html/body를 직접 정의하는 유일한 컴포넌트.
 * children은 페이지별 콘텐츠가 들어오는 슬롯.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 한국어가 주된 사용자 언어이므로 lang="ko" 명시 (스크린리더 발음·번역 정확도 향상)
    <html lang="ko">
      <body>
        {/* 전역 QueryClientProvider 등은 Providers에 위임 — 클라이언트 컴포넌트 분리 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
