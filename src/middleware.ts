// Supabase SSR 세션 쿠키 갱신 미들웨어 (NF-07).
// 모든 페이지 요청 진입 시 Supabase Auth 세션 토큰을 자동으로 검증·갱신해
// 브라우저 재진입이나 네트워크 단절 후에도 세션이 유지되도록 한다.
// OTP 방식은 /auth/callback 리다이렉트가 불필요 — 본 미들웨어가 세션 지속성만 담당.
//
// WHY Edge Runtime 분리: supabaseClient.ts의 createBrowserClient는 document.cookie를
// 사용해 Edge Runtime에서 실패한다. 미들웨어는 NextRequest/NextResponse의 쿠키 API를
// 직접 사용하므로 supabaseClient.ts에 의존하지 않고 독립적으로 작성한다.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// middleware — Supabase 세션 갱신
// ─────────────────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  // 환경 변수 미설정 시 세션 갱신을 건너뛰고 요청을 그대로 통과시킨다.
  // 빌드·CI 환경에서 env 없이도 미들웨어가 정상적으로 렌더링 패스를 막지 않도록 방어한다.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  // 미들웨어는 항상 NextResponse.next()로 응답을 시작한다.
  // Supabase가 쿠키를 갱신할 때 이 응답 객체에 Set-Cookie 헤더를 추가한다.
  let supabaseResponse = NextResponse.next({ request });

  // createServerClient에 미들웨어 전용 쿠키 어댑터를 연결한다.
  // next/headers 대신 NextRequest/NextResponse의 cookies API를 직접 사용한다.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // getAll: 현재 요청의 쿠키 전체를 Supabase에 전달한다.
      getAll() {
        return request.cookies.getAll();
      },
      // setAll: 토큰 갱신 시 Supabase가 새 쿠키를 쓰는 경로.
      // request.cookies와 supabaseResponse.cookies 양쪽에 모두 반영해야
      // 이후 서버 컴포넌트가 갱신된 세션 쿠키를 올바르게 읽을 수 있다.
      setAll(
        cookiesToSet: { name: string; value: string; options: object }[],
      ) {
        // request.cookies에 먼저 반영해 후속 미들웨어 체인이 최신 값을 본다.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // response를 재생성해 변경된 request 쿠키 상태를 포함시킨다.
        supabaseResponse = NextResponse.next({ request });
        // 응답 Set-Cookie 헤더에 추가해 브라우저까지 갱신된 쿠키를 전달한다.
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            options as Record<string, unknown>,
          ),
        );
      },
    },
  });

  // WHY getUser() 사용: getSession()은 로컬 쿠키를 그대로 신뢰해 보안상 부적절하다.
  // getUser()는 Supabase Auth 서버에 토큰을 검증·갱신 요청해 신뢰할 수 있는 세션을 보장한다.
  // 네트워크 오류 시에도 미들웨어가 요청을 막지 않도록 에러는 무시한다.
  await supabase.auth.getUser();

  return supabaseResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// config — 미들웨어 실행 대상 경로 필터
// ─────────────────────────────────────────────────────────────────────────────
// 정적 파일·이미지·favicon은 세션 갱신이 불필요하므로 제외해 요청당 오버헤드를 최소화한다.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
