// Business 계층 — 인증 모듈.
// UML v2.0.1 §AuthModule 정의를 구현한다.
//
// 책임: Supabase Auth API를 래핑해 OTP 이메일 인증 흐름을 제공하고,
// 세션 사용자 정보를 StateStore(IUser)로 정규화·저장한다.
//
// 3계층 위치: Business (modules/)
//   - Data 방향: src/lib/supabaseClient.ts (createBrowserSupabaseClient)
//   - Data Store 방향: src/store/stateStore.ts (setUser, clearUser)
//   - Presentation 계층은 이 모듈만 import하며 supabaseClient에 직접 접근하지 않는다.
//
// 브라우저(클라이언트 컴포넌트) 전용 모듈이다.
// 서버 측에서 호출하면 createBrowserSupabaseClient() 내부에서 런타임 에러가 발생한다.

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { useStateStore } from "@/store/stateStore";
import type { IUser } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 — Supabase User 객체 → 도메인 IUser 정규화
// ─────────────────────────────────────────────────────────────────────────────
// WHY: Supabase의 User 타입에 직접 의존하지 않고 도메인 IUser로 변환한다.
// 향후 Supabase SDK 버전이 바뀌어도 이 헬퍼만 수정하면 도메인 전체에 영향이 없다.
// email이 null/undefined일 수 있으므로 빈 문자열로 폴백해 IUser 타입 안전성을 유지한다.
function toIUser(user: { id: string; email?: string | null }): IUser {
  return {
    id: user.id,
    // email이 없는 경우(익명 계정 등)를 방어적으로 처리한다
    email: user.email ?? "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// signInWithOtp — OTP 코드 발송
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 매직 링크 대신 OTP(6자리 코드)를 선택한 이유는 모바일 환경에서도
// 이메일 앱 전환 없이 코드만 입력하면 인증이 완료되어 UX가 더 단순하기 때문이다.
// shouldCreateUser: true — 신규 사용자도 회원가입 없이 첫 OTP로 계정이 생성된다.
async function signInWithOtp(email: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // 신규 이메일도 OTP 발송 즉시 계정을 만들어 별도 회원가입 UI를 없앤다 (F-14)
      shouldCreateUser: true,
    },
  });

  // Supabase가 에러를 반환하면 즉시 throw해 호출 측(Presentation)에서 처리하도록 위임
  if (error) {
    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// verifyOtp — OTP 검증 → 세션 생성 → IUser 반환
// ─────────────────────────────────────────────────────────────────────────────
// WHY: OTP 검증 성공 시 Supabase가 세션 쿠키를 설정하고 User를 반환한다.
// User를 IUser로 정규화한 뒤 StateStore에 저장해 앱 전체에서 로그인 상태를 공유한다.
// type: 'email'은 이메일 OTP를 사용함을 Supabase에 명시한다(phone OTP와 구분).
async function verifyOtp(email: string, token: string): Promise<IUser> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    // 이메일 OTP 타입 명시 — 'email'은 signInWithOtp(email)로 발송된 코드에 대응한다
    type: "email",
  });

  // Supabase 에러 응답 처리
  if (error) {
    throw new Error(error.message);
  }

  // user가 없는 응답은 인증 실패 또는 예기치 않은 상태이므로 에러로 처리한다
  if (!data.user) {
    throw new Error("OTP 검증 후 사용자 정보를 받지 못했습니다.");
  }

  // Supabase User → 도메인 IUser로 정규화
  const user = toIUser(data.user);

  // StateStore에 저장해 Presentation 계층이 currentUser를 구독할 수 있게 한다
  useStateStore.getState().setUser(user);

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// getSession — 현재 세션 조회
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 앱이 처음 로드될 때(예: AuthProvider 마운트) 브라우저에 저장된 세션 쿠키를
// 읽어 로그인 상태를 복원한다. 세션이 없으면 null을 반환해 비인증 상태를 표현한다.
async function getSession(): Promise<IUser | null> {
  const supabase = createBrowserSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 세션이 없으면 비인증 상태 — null 반환
  if (!session?.user) {
    return null;
  }

  return toIUser(session.user);
}

// ─────────────────────────────────────────────────────────────────────────────
// signOut — 로그아웃
// ─────────────────────────────────────────────────────────────────────────────
// WHY: Supabase 세션을 서버·로컬 모두 무효화한 뒤 StateStore를 비워야
// 다음 사용자가 이전 세션 데이터를 볼 수 없다(보안 + UX 일관성).
async function signOut(): Promise<void> {
  const supabase = createBrowserSupabaseClient();

  await supabase.auth.signOut();

  // StateStore에서 사용자 정보를 제거해 로그아웃 상태를 앱 전체에 반영한다
  useStateStore.getState().clearUser();
}

// ─────────────────────────────────────────────────────────────────────────────
// onAuthStateChange — 세션 변경 구독
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 탭 전환·토큰 만료·다른 기기에서의 로그아웃 등 외부 이벤트로 세션이 변경될 때
// 앱이 즉각적으로 반응하려면 Supabase의 onAuthStateChange를 구독해야 한다.
// callback은 IUser | null을 받아 Presentation(예: AuthProvider)이 상태를 동기화한다.
function onAuthStateChange(callback: (user: IUser | null) => void): void {
  const supabase = createBrowserSupabaseClient();

  supabase.auth.onAuthStateChange((_event, session) => {
    // 세션이 있으면 IUser로 변환, 없으면 null — Presentation에 정규화된 형태로 전달
    const user = session?.user ? toIUser(session.user) : null;
    callback(user);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 모듈 객체 export — 함수형 모듈 방식
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 클래스 인스턴스 대신 단순 객체로 묶어 export하면 tree-shaking이 유리하고
// 테스트에서 특정 함수만 vi.spyOn으로 교체하기 쉽다.
export const authModule = {
  signInWithOtp,
  verifyOtp,
  getSession,
  signOut,
  onAuthStateChange,
};
