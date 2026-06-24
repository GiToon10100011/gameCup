"use client";

// AuthPage 컴포넌트 (Task #109 — F-14 OTP 이메일 로그인 UI).
// UML v2.0.1 §AuthPage note · Story #107.
//
// 2단계 인증 흐름:
//   1단계 (email) — 이메일 입력 → "코드 전송" → authModule.signInWithOtp
//   2단계 (otp)   — 6자리 코드 입력 → "확인" → authModule.verifyOtp → 홈으로 이동
//
// 책임: 폼 상태 관리·로딩·오류 표시를 담당하며, 인증 로직은 authModule에 위임한다.
// 3계층 위치: Presentation (components/auth/)
//   - Business 방향: src/modules/authModule.ts (signInWithOtp, verifyOtp)
//   - 라우팅       : Next.js App Router useRouter (로그인 성공 후 "/" 이동)
//
// 브라우저(클라이언트 컴포넌트) 전용 — authModule이 브라우저 Supabase 클라이언트를 사용하기 때문.
// 디자인 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`) — dark canvas + electric yellow CTA.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authModule } from "@/modules/authModule";
import { authPageVariants } from "./AuthPage.variants";

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
  // 비동기 호출 중 버튼 비활성화 + 로딩 텍스트 표시용 플래그
  const [loading, setLoading] = useState(false);
  // 각 단계의 API 오류 메시지 — null이면 오류 박스 미표시
  const [error, setError] = useState<string | null>(null);

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

  // ─── 1단계 핸들러: 이메일로 OTP 코드 전송 ────────────────────────────────
  // authModule.signInWithOtp 성공 시 2단계로 전환한다.
  // 실패 시 에러 메시지를 인라인으로 표시하고 1단계를 유지한다.
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await authModule.signInWithOtp(email.trim());
      // 코드 전송 성공 → 2단계(코드 입력)으로 전환
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "코드 전송에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── 2단계 핸들러: OTP 코드 검증 → 로그인 완료 ──────────────────────────
  // authModule.verifyOtp 성공 시 StateStore에 IUser가 저장되고 홈("/")으로 이동한다.
  // 실패(코드 만료·오류 등) 시 인라인 오류를 표시하고 2단계를 유지한다.
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      await authModule.verifyOtp(email.trim(), token.trim());
      // 로그인 성공 → 홈("/")으로 이동
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "코드 인증에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── 이메일 단계로 돌아가기 ──────────────────────────────────────────────
  // "다른 이메일로 변경" 클릭 시 1단계로 되돌리고 코드·오류를 초기화한다.
  const handleBack = () => {
    setStep("email");
    setToken("");
    setError(null);
  };

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
                  // 페이지 로드 시 즉시 포커스 — 빠른 입력 유도
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input()}
                  disabled={loading}
                  aria-describedby={error ? "email-error" : undefined}
                />
              </div>
            </div>

            {/* 1단계 인라인 오류 메시지 */}
            {error && (
              <p id="email-error" role="alert" className={errorBox()}>
                {error}
              </p>
            )}

            {/* 코드 전송 버튼 — 이메일이 비어있거나 로딩 중이면 비활성화 */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={submitButton()}
            >
              {loading ? "전송 중…" : "코드 전송"}
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
                  // 2단계 진입 시 즉시 포커스 — 사용자가 바로 입력할 수 있게
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={token}
                  // 숫자 이외의 문자는 입력 즉시 제거해 6자리 숫자만 허용
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={input()}
                  disabled={loading}
                  aria-describedby="token-hint token-error"
                />
                {/* 스팸함 안내 — OTP가 안 올 때 사용자가 먼저 확인할 곳 */}
                <p id="token-hint" className={otpHint()}>
                  이메일이 도착하지 않으면 스팸함을 확인하세요.
                </p>
              </div>
            </div>

            {/* 2단계 인라인 오류 메시지 */}
            {error && (
              <p id="token-error" role="alert" className={errorBox()}>
                {error}
              </p>
            )}

            {/* 확인 버튼 — 6자리 입력이 완료되기 전·로딩 중에는 비활성화 */}
            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className={submitButton()}
            >
              {loading ? "확인 중…" : "확인"}
            </button>

            {/* 이메일 변경 링크 — 잘못 입력한 이메일로 돌아갈 탈출구 */}
            <button
              type="button"
              onClick={handleBack}
              className={backLink()}
              disabled={loading}
            >
              다른 이메일로 변경
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
