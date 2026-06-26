"use client";

// 클라이언트 세션 초기화 컴포넌트 (F-15).
// 앱 최초 마운트 시 getSession()으로 쿠키 세션을 복원하고,
// onAuthStateChange로 외부 이벤트(탭 전환·토큰 만료·다른 기기 로그아웃)에 반응한다.
//
// WHY: 서버 컴포넌트(requireAuth)는 직접 URL 접근을 차단하지만,
// 클라이언트 측 상태(currentUser)가 없으면 AuthGuard가 세션 유무를 판단할 수 없다.
// AuthProvider는 두 역할을 담당한다:
//   1) Zustand currentUser 초기화 — 페이지 새로고침 후에도 로그인 상태 복원
//   2) 세션 변경 구독 — 외부 이벤트로 세션이 만료되면 즉시 clearUser 호출

import { type ReactNode, useEffect } from "react";
import { authModule } from "@/modules/authModule";
import { useStateStore } from "@/store/stateStore";

interface IAuthProviderProps {
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthProvider — 세션 초기화 + 변경 구독
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: IAuthProviderProps) {
  // store 액션을 셀렉터로 구독해 불필요한 리렌더를 최소화한다
  const setUser = useStateStore((s) => s.setUser);
  const clearUser = useStateStore((s) => s.clearUser);
  const setAuthInitialized = useStateStore((s) => s.setAuthInitialized);

  useEffect(() => {
    // 마운트 해제 후 비동기 콜백이 store를 수정하지 않도록 플래그를 사용한다
    let mounted = true;

    // ─────────────────────────────────────────────────────────────────────────
    // 1) 초기 세션 복원 — async IIFE로 작성해 가독성과 에러 처리를 명확히 한다.
    //    .then()/.catch() 체인보다 제어 흐름이 직관적이다.
    // ─────────────────────────────────────────────────────────────────────────
    (async () => {
      try {
        const user = await authModule.getSession();
        if (!mounted) return;
        if (user) setUser(user);
        // 성공·null 세션 모두 초기화 완료로 처리한다
        setAuthInitialized();
      } catch {
        if (!mounted) return;
        // 네트워크 오류 등 예외 시에도 초기화 완료로 표시해 무한 로딩을 막는다
        setAuthInitialized();
      }
    })();

    // ─────────────────────────────────────────────────────────────────────────
    // 2) 세션 변경 구독 — 탭 전환·토큰 갱신·다른 기기 로그아웃 등을 실시간 반영.
    //    WHY isAuthInitialized guard: getSession()이 완료되기 전에 onAuthStateChange가
    //    INITIAL_SESSION 이벤트를 발생시킬 수 있다. 초기화 전 이벤트는 getSession()의
    //    결과를 덮어쓸 수 있으므로, 초기화 완료 후 이벤트만 처리한다.
    // ─────────────────────────────────────────────────────────────────────────
    const unsubscribe = authModule.onAuthStateChange((user) => {
      // 초기화 완료 전이면 getSession()이 진실 공급원이므로 무시한다
      if (!useStateStore.getState().isAuthInitialized) return;
      if (user) setUser(user);
      else clearUser();
    });

    return () => {
      mounted = false;
      // 컴포넌트 언마운트 시 구독 해제 — 메모리 누수 방지
      unsubscribe();
    };
    // setUser, clearUser, setAuthInitialized는 Zustand가 안정적으로 제공하므로
    // deps 배열에 포함해도 무한 루프 발생 없음
  }, [setUser, clearUser, setAuthInitialized]);

  // 세션 초기화 동안에도 children을 렌더하여 서버 컴포넌트의 HTML이 hydration 오류 없이 유지된다.
  // AuthGuard가 isAuthInitialized를 보고 로딩 상태를 처리하므로 여기서 null 반환은 불필요하다.
  return <>{children}</>;
}
