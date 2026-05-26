// Supabase 클라이언트 게이트웨이 — Data 계층 진입점.
// RAWG용 externalApiClient.ts와 동일한 위상: Business 모듈(AuthModule·TournamentStorageModule)만
// import할 수 있으며, Presentation 계층이 직접 import하는 것은 3계층 원칙 위반이다.
// 역할: "올바르게 설정된 Supabase 클라이언트 인스턴스를 제공"까지만 — auth/DB 메서드는
// 후속 Business 모듈이 이 클라이언트를 받아 구현한다 (게이트웨이를 얇게 유지).

import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
// Next.js 14 App Router에서 서버 컴포넌트·라우트 핸들러에서만 사용 가능한 쿠키 API.
// 클라이언트 컴포넌트 환경에서 이 import 경로를 호출하면 런타임 에러가 발생하므로,
// createServerSupabaseClient 는 서버 측에서만 호출해야 한다.
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// 환경 변수 가드 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 모듈 로드 시점(빌드·import)이 아닌 **호출 시점**에 env를 검사한다.
// 빌드 단계에서는 env가 없어도 통과해야 하고(CI·Vercel preview 등), 실제
// 클라이언트 생성이 요청될 때만 누락을 감지해 빠른 피드백을 주기 위함이다.
/**
 * 환경 변수에서 Supabase URL과 Anon Key를 읽어 반환한다.
 * 하나라도 누락이면 명확한 메시지와 함께 즉시 throw해 개발 중 실수를 빠르게 감지한다.
 */
function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 누락 시 docs/06-setup/supabase-setup.md 참조 링크를 포함해 안내한다
  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 설정되지 않았습니다. " +
        "docs/06-setup/supabase-setup.md 참조",
    );
  }

  return { url, anonKey };
}

// ─────────────────────────────────────────────────────────────────────────────
// 브라우저(클라이언트 컴포넌트)용 팩토리
// ─────────────────────────────────────────────────────────────────────────────
// WHY: @supabase/ssr의 createBrowserClient는 브라우저 쿠키를 직접 관리하므로
// 클라이언트 컴포넌트에서만 사용해야 한다. 서버 측에서 호출하면 document가 없어
// 쿠키 접근이 실패하므로 팩토리를 분리하여 용도를 명확히 구분한다.
/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트를 생성해 반환한다.
 * 매직 링크 인증·세션 갱신 구독(onAuthStateChange) 등 브라우저 전용 Auth 흐름에 사용.
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  // createBrowserClient: 브라우저의 document.cookie를 자동으로 관리한다
  return createBrowserClient(url, anonKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// 서버(라우트 핸들러·서버 컴포넌트)용 팩토리
// ─────────────────────────────────────────────────────────────────────────────
// WHY: App Router에서 PKCE 흐름(매직 링크 콜백)은 서버 라우트 핸들러가
// ?code= 파라미터를 받아 exchangeCodeForSession()을 호출하고 세션 쿠키를 수립한다.
// 이때 서버가 쿠키를 읽고 쓸 수 있어야 하므로 Next.js `next/headers`의 cookies()를
// 어댑터로 연결한다. getAll/setAll 패턴을 사용하는 이유: @supabase/ssr 권장 방식이며,
// 구형 get/set/remove는 deprecated + edge case 미처리 문제가 있다.
/**
 * 서버 컴포넌트 / 라우트 핸들러용 Supabase 클라이언트를 생성해 반환한다.
 * Next.js `next/headers`의 쿠키 어댑터를 연결해 PKCE 세션 쿠키를 수립·갱신한다.
 *
 * @important 요청마다 새 클라이언트 인스턴스를 생성해야 한다. 공유 금지.
 * @important 클라이언트 컴포넌트에서 호출하지 말 것 — 서버 전용 API 사용.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseEnv();

  // Next.js 14.2의 cookies()는 동기적으로 ReadonlyRequestCookies를 반환한다(Promise 아님).
  // 그럼에도 await를 두는 이유: Next 15부터 cookies()가 Promise를 반환하도록 바뀌므로,
  // await로 감싸 두면 동기(14)·비동기(15) 양쪽에서 동일하게 동작한다(동기 값의 await는 무해).
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      // getAll: 현재 요청 헤더의 모든 쿠키를 Supabase가 읽을 수 있도록 전달한다.
      // Supabase 세션 쿠키(sb-*-auth-token)를 포함한 전체 쿠키 배열을 반환.
      getAll() {
        return cookieStore.getAll();
      },
      // setAll: Supabase가 토큰 갱신 등으로 쿠키를 써야 할 때 호출된다.
      // 라우트 핸들러 또는 서버 액션에서는 setAll을 통해 응답 쿠키가 설정된다.
      // 서버 컴포넌트에서는 쿠키를 직접 set할 수 없어 경고가 나타날 수 있으나,
      // 미들웨어가 세션 갱신을 처리하는 경우 정상이다(Supabase SSR 가이드 참조).
      setAll(
        cookiesToSet: { name: string; value: string; options: object }[],
      ) {
        // try/catch로 감싸는 이유: 서버 컴포넌트(read-only 쿠키 컨텍스트)에서
        // cookies().set()을 호출하면 예외가 발생할 수 있다. 라우트 핸들러·미들웨어에서는
        // 정상 동작하므로 서버 컴포넌트 컨텍스트의 실패는 무시해도 안전하다.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // options 타입 캐스팅: @supabase/ssr의 CookieOptions는 next/headers의
            // ResponseCookies.set 옵션과 호환되지만 타입 선언이 다르므로 Record<string, unknown> 경유 캐스트.
            cookieStore.set(name, value, options as Record<string, unknown>);
          });
        } catch {
          // 서버 컴포넌트 read-only 컨텍스트에서의 예외는 의도적으로 무시한다.
          // 미들웨어가 설정되어 있으면 세션 갱신은 미들웨어가 담당한다.
        }
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 export (테스트 가용)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: getSupabaseEnv를 export하면 테스트에서 env 누락 시 에러 throw를 직접 검증할 수 있다.
// Business 모듈에서는 사용하지 않는다 — 팩토리 함수 내부에서만 호출됨.
export { getSupabaseEnv };
