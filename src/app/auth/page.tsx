// /auth 라우트 — 2단계 OTP 이메일 로그인 페이지 (F-14, Task #109).
// Next.js App Router 규약에 따라 라우트 파일은 서버 컴포넌트로 작성하고,
// 클라이언트 상태가 필요한 실제 UI는 AuthPage 컴포넌트에 위임한다.

import { AuthPage } from "@/components/auth/AuthPage";

// Next.js 메타데이터 — 브라우저 탭 제목 오버라이드
export const metadata = {
  title: "로그인 — GameCup",
};

// AuthPage를 감싸는 라우트 래퍼 — 클라이언트 컴포넌트 분리 패턴
export default function AuthRoute() {
  return <AuthPage />;
}
