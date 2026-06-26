// 서버 컴포넌트 전용 인증 가드 유틸리티 (F-15).
// Server Component 페이지 최상단에서 호출해 비로그인 접근을 차단한다.
//
// WHY: Next.js App Router의 서버 컴포넌트는 렌더 전에 redirect()를 호출할 수 있다.
// 이 유틸리티를 사용하면 Presentation 계층에서 auth 로직을 반복 작성할 필요가 없다.
// 3계층 위치: Presentation 계층 보조 유틸리티 (lib/)
//   - createServerSupabaseClient(Data) → supabase.auth.getUser()(Data) → redirect(Next.js)

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import type { IUser } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 — Supabase User → IUser 정규화
// ─────────────────────────────────────────────────────────────────────────────
// WHY: authModule.ts와 동일한 변환 로직을 중복하지 않도록 여기서도 별도 함수로 분리.
// lib 간 순환 의존을 피하기 위해 authModule을 import하지 않고 직접 정의한다.
function toIUser(user: { id: string; email?: string | null }): IUser {
  return { id: user.id, email: user.email ?? "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth — 세션 검증 후 IUser 반환 또는 /auth로 리다이렉트
// ─────────────────────────────────────────────────────────────────────────────
// WHY getUser(): getSession()은 로컬 쿠키를 신뢰하지만 getUser()는 Supabase Auth 서버와
// 교신해 토큰을 검증하므로 보안상 더 안전하다 (middleware.ts와 동일한 이유).
//
// 사용 예:
//   export default async function ProtectedPage() {
//     const user = await requireAuth(); // 비로그인이면 /auth로 redirect
//     return <div>Hello, {user.email}</div>;
//   }
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
