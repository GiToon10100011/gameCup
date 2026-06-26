// 서버 컴포넌트 전용 인증 가드 유틸리티 (F-15).
// Business 계층 위치 — Server Component 페이지 최상단에서 호출해 비로그인 접근을 차단한다.
//
// 3계층 위치: Business (modules/)
//   - Data 방향: src/lib/supabaseClient.ts (createServerSupabaseClient)
//   - 이 모듈은 서버 전용이다. 클라이언트 컴포넌트에서 import하면 런타임 에러가 발생한다.
//   TODO: server-only 패키지 도입 시 `import 'server-only'` 추가
//         (현재 Vitest jsdom 환경에서 별도 mock 인프라가 필요해 추후 적용)
//
// 사용 예:
//   export default async function ProtectedPage() {
//     const user = await requireAuth(); // 비로그인이면 /auth로 redirect
//     return <div>Hello, {user.email}</div>;
//   }

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import type { IUser } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 — Supabase User → IUser 정규화
// ─────────────────────────────────────────────────────────────────────────────
// WHY: authModule.ts는 브라우저 전용 모듈이라 서버 컨텍스트에서 import할 수 없다.
// 동일한 변환 로직을 여기서 독립적으로 정의해 lib 간 순환 의존을 피한다.
function toIUser(user: { id: string; email?: string | null }): IUser {
  return { id: user.id, email: user.email ?? "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth — 세션 검증 후 IUser 반환 또는 /auth로 리다이렉트
// ─────────────────────────────────────────────────────────────────────────────
// WHY getUser(): getSession()은 로컬 쿠키를 신뢰하지만 getUser()는 Supabase Auth 서버와
// 교신해 토큰을 검증하므로 보안상 더 안전하다 (middleware.ts와 동일한 이유).
export async function requireAuth(): Promise<IUser> {
  // 서버 컴포넌트 전용 Supabase 클라이언트 — next/headers 쿠키 어댑터 연결
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 세션이 없으면 로그인 페이지로 즉시 리다이렉트한다.
  // redirect()는 Next.js가 특수 에러로 처리하므로 이후 코드는 실행되지 않는다.
  if (!user) {
    redirect("/auth");
  }

  return toIUser(user);
}
