"use client";

// 클라이언트 측 인증 가드 컴포넌트 (F-15).
// 세션이 없는 상태에서 보호 콘텐츠를 렌더하지 않고, 로그인 유도 UI를 보여준 뒤 /auth로 이동시킨다.
//
// WHY: 서버 가드(requireAuth)는 초기 페이지 요청을 차단하지만,
// 세션이 브라우저에서 만료되거나 클라이언트 측 상태가 없는 경우를 보완한다.
// 사용 예:
//   <AuthGuard>
//     <ProtectedContent />
//   </AuthGuard>

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateStore } from "@/store/stateStore";
import { authGuardVariants } from "./AuthGuard.variants";

interface IAuthGuardProps {
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// 로딩 상태 UI — AuthProvider의 getSession() 완료 전
// ─────────────────────────────────────────────────────────────────────────────
function LoadingState() {
  const { container, spinner } = authGuardVariants();
  return (
    // 세션 초기화 전 — 스피너만 표시
    <div className={container()}>
      <div role="status" aria-label="세션 확인 중">
        <div className={spinner()} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 로그인 유도 UI — 세션 초기화 완료 후 currentUser가 null인 경우
// ─────────────────────────────────────────────────────────────────────────────
function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  const { container, card, iconWrapper, title, description, button } =
    authGuardVariants();
  return (
    // 비로그인 상태 — 로그인 유도 카드 표시
    <div className={container()}>
      <div className={card()}>
        {/* 잠금 아이콘 */}
        <div className={iconWrapper()} aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#faff69"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className={title()}>로그인이 필요합니다</p>
        <p className={description()}>
          이 페이지에 접근하려면 먼저 로그인해 주세요.
        </p>
        {/* 로그인 유도 버튼 */}
        <button type="button" className={button()} onClick={onLogin}>
          로그인하기
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthGuard — 인증 상태에 따라 children 또는 로딩/유도 UI를 렌더
// ─────────────────────────────────────────────────────────────────────────────
export function AuthGuard({ children }: IAuthGuardProps) {
  const currentUser = useStateStore((s) => s.currentUser);
  const isAuthInitialized = useStateStore((s) => s.isAuthInitialized);
  const router = useRouter();

  useEffect(() => {
    // 초기화 완료 후 세션이 없으면 /auth로 이동
    // WHY replace: 뒤로 가기 시 보호 페이지로 되돌아가는 것을 막는다
    if (isAuthInitialized && !currentUser) {
      router.replace("/auth");
    }
  }, [isAuthInitialized, currentUser, router]);

  // 세션 초기화 전 — 스피너 표시
  if (!isAuthInitialized) {
    return <LoadingState />;
  }

  // 비로그인 상태 — 로그인 유도 UI (router.replace가 진행 중인 중간 상태)
  if (!currentUser) {
    return <LoginPrompt onLogin={() => router.replace("/auth")} />;
  }

  // 로그인 상태 — 보호 콘텐츠 렌더
  return <>{children}</>;
}
