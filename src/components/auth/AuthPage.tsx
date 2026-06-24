"use client";

// AuthPage 컴포넌트 (Task #109 — F-14 OTP 이메일 로그인 UI).
// UML v2.0.1 §AuthPage note · Story #107.
//
// 2단계 인증 흐름:
//   1단계 (email) — 이메일 입력 → "코드 전송" → authModule.signInWithOtp
//   2단계 (otp)   — 6자리 코드 입력 → "확인" → authModule.verifyOtp → 홈으로 이동
//
// 책임: 폼 상태 관리·로딩·오류 표시를 담당하며, 인증 로직은 authModule에 위임한다.
//   - TanStack Query v5 `useMutation`으로 로딩·에러 상태를 일관되게 관리한다(수동 setState 최소화).
// 3계층 위치: Presentation (components/auth/)
//   - Business 방향: src/modules/authModule.ts (signInWithOtp, verifyOtp)
//   - 라우팅       : Next.js App Router useRouter (로그인 성공 후 "/" 이동)
//
// 브라우저(클라이언트 컴포넌트) 전용 — authModule이 브라우저 Supabase 클라이언트를 사용하기 때문.
// 디자인 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`) — dark canvas + electric yellow CTA.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authModule } from "@/modules/authModule";
// 경로 별칭(@/) 사용 — src 내부 import는 항상 @/* 로 통일한다 (CodeRabbit 반영)
import { authPageVariants } from "@/components/auth/AuthPage.variants";

// ─────────────────────────────────────────────────────────────────────────────
// 내부 타입 — 현재 인증 단계 식별자
// ─────────────────────────────────────────────────────────────────────────────
// "email" : 1단계 — 이메일 입력·코드 전송
// "otp"   : 2단계 — 수신한 6자리 코드 입력·검증
type AuthStep = "email" | "otp";

// ─────────────────────────────────────────────────────────────────────────────
// AuthPage — 2단계 OTP 인증 화면 (F-14)
// ─────────────────────────────────────────────────────────────────────────────
export function AuthPage() {
  // Next.js 라우터 — 로그인 성공 시 홈("/")으로 이동하는 데 사용
  const router = useRouter();

  // 현재 단계 — email(1단계) 또는 otp(2단계)
  const [step, setStep] = useState<AuthStep>("email");
  // 이메일 입력값 — 1·2단계 모두에서 authModule 호출에 전달
  const [email, setEmail] = useState("");
  // OTP 코드 입력값 — 숫자만 허용(onChange에서 필터링)
  const [token, setToken] = useState("");

  // variants에서 slot 클래스 추출 (스타일은 AuthPage.variants.ts가 단일 소스)
  const {
    root,
    card,
    brand,
    title,
    subtitle,
    fieldGroup,
    label,
    input,
    emailDisplay,
    otpHint,
    submitButton,
    backLink,
    errorBox,
  } = authPageVariants();

  // ─── 1단계 Mutation: 이메일로 OTP 코드 전송 ──────────────────────────────
  // TanStack Query useMutation — isPending/error를 직접 읽어 UI 상태를 표현한다.
  // onSuccess: 코드 전송 성공 → 2단계로 전환.
  const sendOtpMutation = useMutation({
    mutationFn: (emailArg: string) => authModule.signInWithOtp(emailArg),
    onSuccess: () => {
      // 전송 성공 → 2단계(코드 입력)로 전환
      setStep("otp");
    },
  });

  // ─── 2단계 Mutation: OTP 코드 검증 → 로그인 완료 ─────────────────────────
  // TanStack Query useMutation — 성공 시 StateStore에 IUser가 저장되고 홈("/")으로 이동.
  // 실패(코드 만료·오류) 시 error가 non-null 이 되어 인라인 오류 박스를 표시한다.
  const verifyOtpMutation = useMutation({
    mutationFn: ({
      emailArg,
      tokenArg,
    }: {
      emailArg: string;
      tokenArg: string;
    }) => authModule.verifyOtp(emailArg, tokenArg),
    onSuccess: () => {
      // 로그인 성공 → 홈("/")으로 이동
      router.push("/");
    },
  });

  // ─── 1단계 제출 핸들러 ────────────────────────────────────────────────────
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    sendOtpMutation.mutate(email.trim());
  };

  // ─── 2단계 제출 핸들러 ────────────────────────────────────────────────────
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) return;
    verifyOtpMutation.mutate({ emailArg: email.trim(), tokenArg: token.trim() });
  };

  // ─── 이메일 단계로 돌아가기 ──────────────────────────────────────────────
  // "다른 이메일로 변경" 클릭 시 1단계로 되돌리고 코드·mutation 오류를 초기화한다.
  const handleBack = () => {
    setStep("email");
    setToken("");
    // 두 mutation의 오류 상태를 초기화해 이전 오류가 다음 시도에 남지 않도록 한다
    sendOtpMutation.reset();
    verifyOtpMutation.reset();
  };

  // ─── 각 단계의 오류 문자열 추출 ──────────────────────────────────────────
  // mutation.error는 Error 인스턴스이거나 unknown일 수 있으므로 방어적으로 처리한다.
  const sendError =
    sendOtpMutation.error instanceof Error
      ? sendOtpMutation.error.message
      : sendOtpMutation.error
        ? "코드 전송에 실패했습니다."
        : null;

  const verifyError =
    verifyOtpMutation.error instanceof Error
      ? verifyOtpMutation.error.message
      : verifyOtpMutation.error
        ? "코드 인증에 실패했습니다."
        : null;

  // ─── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <div className={root()}>
      <div className={card()}>
        {/* 브랜드명 — 페이지 최상단에 서비스 아이덴티티 표시 */}
        <p className={brand()}>GameCup</p>

        {step === "email" ? (
          // ──────────────────────────────────────────
          // 1단계: 이메일 입력 폼
          // ──────────────────────────────────────────
          <form onSubmit={handleSendOtp} noValidate>
            <h1 className={title()}>로그인</h1>
            <p className={subtitle()}>
              이메일로 일회용 코드를 받아 로그인합니다.
            </p>

            <div className={fieldGroup()}>
              {/* 이메일 입력 필드 */}
              <div>
                <label htmlFor="email" className={label()}>
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input()}
                  disabled={sendOtpMutation.isPending}
                  aria-describedby={sendError ? "email-error" : undefined}
                />
              </div>
            </div>

            {/* 1단계 인라인 오류 메시지 */}
            {sendError && (
              <p id="email-error" role="alert" className={errorBox()}>
                {sendError}
              </p>
            )}

            {/* 코드 전송 버튼 — 이메일이 비어있거나 전송 중이면 비활성화 */}
            <button
              type="submit"
              disabled={sendOtpMutation.isPending || !email.trim()}
              className={submitButton()}
            >
              {sendOtpMutation.isPending ? "전송 중…" : "코드 전송"}
            </button>
          </form>
        ) : (
          // ──────────────────────────────────────────
          // 2단계: OTP 코드 입력 폼
          // ──────────────────────────────────────────
          <form onSubmit={handleVerifyOtp} noValidate>
            <h1 className={title()}>코드 입력</h1>
            <p className={subtitle()}>
              아래 이메일로 6자리 코드를 전송했습니다.
            </p>

            <div className={fieldGroup()}>
              {/* 이메일 읽기 전용 표시 — 어떤 이메일인지 사용자가 확인하도록 */}
              <div>
                <p className={label()} aria-hidden="true">
                  이메일
                </p>
                <p className={emailDisplay()}>{email}</p>
              </div>

              {/* OTP 코드 입력 필드 — 숫자만 허용, 최대 6자리 */}
              <div>
                <label htmlFor="token" className={label()}>
                  인증 코드
                </label>
                <input
                  id="token"
                  type="text"
                  // 모바일에서 숫자 키패드 표시
                  inputMode="numeric"
                  // 브라우저·iOS 자동완성 힌트 — "123456" 형태 OTP를 SMS/이메일에서 자동 채움
                  autoComplete="one-time-code"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={token}
                  // 숫자 이외의 문자는 입력 즉시 제거해 6자리 숫자만 허용
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={input()}
                  disabled={verifyOtpMutation.isPending}
                  // 에러가 없을 땐 token-error ID가 DOM에 없으므로 참조하지 않는다 (CodeRabbit 반영)
                  aria-describedby={
                    verifyError ? "token-hint token-error" : "token-hint"
                  }
                />
                {/* 스팸함 안내 — OTP가 안 올 때 사용자가 먼저 확인할 곳 */}
                <p id="token-hint" className={otpHint()}>
                  이메일이 도착하지 않으면 스팸함을 확인하세요.
                </p>
              </div>
            </div>

            {/* 2단계 인라인 오류 메시지 */}
            {verifyError && (
              <p id="token-error" role="alert" className={errorBox()}>
                {verifyError}
              </p>
            )}

            {/* 확인 버튼 — 6자리 입력이 완료되기 전·검증 중에는 비활성화 */}
            <button
              type="submit"
              disabled={verifyOtpMutation.isPending || token.length !== 6}
              className={submitButton()}
            >
              {verifyOtpMutation.isPending ? "확인 중…" : "확인"}
            </button>

            {/* 이메일 변경 링크 — 잘못 입력한 이메일로 돌아갈 탈출구 */}
            <button
              type="button"
              onClick={handleBack}
              className={backLink()}
              disabled={verifyOtpMutation.isPending}
            >
              다른 이메일로 변경
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
