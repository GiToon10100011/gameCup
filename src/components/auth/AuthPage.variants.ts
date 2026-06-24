// AuthPage 컴포넌트의 스타일 variants 정의.
// 컨벤션(PR #64): tailwind-variants `tv()` 정의는 컴포넌트 파일에서 분리해 `*.variants.ts`로 둔다.
//
// 디자인 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`)
//   - canvas       : #0a0a0a (near-pure black page floor)
//   - surface-card : #1a1a1a (인증 카드 배경)
//   - primary      : #faff69 (electric yellow — 브랜드 CTA)
//   - on-primary   : #0a0a0a (yellow 위 검은 텍스트)
//   - on-dark      : #ffffff (white headline)
//   - body         : #cccccc (본문 색)
//   - muted        : #888888 (보조 텍스트)
//   - muted-soft   : #5a5a5a (placeholder)
//   - hairline     : #2a2a2a (카드·인풋 테두리)
//   - error        : #ef4444 (오류 강조)
//
// 접근성: 버튼 터치 타겟 ≥44px, focus ring은 primary 색으로 표시해 dark 배경에서 잘 보이게 함.

import { tv } from "tailwind-variants";

// ─────────────────────────────────────────────────────────────────────────────
// authPageVariants — 2단계 OTP 인증 화면의 슬롯 모음
// ─────────────────────────────────────────────────────────────────────────────
//   root         : 전체 화면 — canvas 배경 + 수직 중앙 정렬
//   card         : 중앙 카드 — surface-card 배경 + hairline 테두리
//   brand        : 상단 GameCup 브랜드명 (primary yellow)
//   title        : 단계 제목 ("로그인" / "코드 입력")
//   subtitle     : 단계 안내 문구
//   fieldGroup   : 입력 필드들을 세로로 쌓는 래퍼
//   label        : 인풋 위 소문자 레이블
//   input        : 텍스트 인풋 — canvas 배경 + focus 시 primary ring
//   emailDisplay : 이메일 읽기 전용 표시 (2단계에서 확인용)
//   otpHint      : OTP 입력 아래 스팸함 안내 문구
//   submitButton : 단계별 제출 버튼 (primary yellow, disabled 상태 포함)
//   backLink     : "다른 이메일로 변경" 텍스트 버튼
//   errorBox     : 인라인 오류 메시지 박스
export const authPageVariants = tv({
  slots: {
    // 전체 화면: canvas 배경, 수직·수평 중앙 정렬, 모바일 패딩
    root: "flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-12",

    // 인증 카드: 최대 440px, surface-card 배경, hairline 테두리, 라운드 xl
    card: "w-full max-w-[440px] rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-8 py-10",

    // 브랜드명: primary yellow, bold, 가운데 정렬
    brand: "mb-8 text-center text-2xl font-bold tracking-tight text-[#faff69]",

    // 단계 제목: white, display-sm 수준 크기
    title: "text-[22px] font-bold leading-tight tracking-tight text-white",

    // 안내 문구: muted 색, body-sm 크기
    subtitle: "mt-2 text-sm text-[#888888]",

    // 인풋 그룹 래퍼: 세로 쌓기 + 간격
    fieldGroup: "mt-6 flex flex-col gap-5",

    // 인풋 레이블: caption-uppercase 토큰 (12px, 600, letter-spacing 1.5px)
    label: "mb-1.5 block text-[11px] font-semibold uppercase tracking-[1.5px] text-[#888888]",

    // 텍스트 인풋: canvas 배경, hairline 테두리, primary focus ring
    input: [
      "w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a]",
      "px-4 py-3 text-sm text-white placeholder-[#5a5a5a]",
      "outline-none transition-colors",
      "focus:border-[#faff69] focus:ring-1 focus:ring-[#faff69]",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),

    // 이메일 읽기 전용 표시: canvas 배경, hairline 테두리, muted 텍스트
    emailDisplay:
      "rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-[#888888]",

    // OTP 스팸함 안내: muted, xs 크기
    otpHint: "mt-1.5 text-xs text-[#888888]",

    // 제출 버튼: primary yellow bg, on-primary text, hover/active/disabled 상태
    submitButton: [
      "mt-6 h-11 w-full rounded-lg text-sm font-semibold transition-colors",
      "bg-[#faff69] text-[#0a0a0a]",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "disabled:cursor-not-allowed disabled:bg-[#3a3a1f] disabled:text-[#5a5a5a]",
    ].join(" "),

    // "다른 이메일로 변경" 텍스트 버튼: muted, hover 시 white
    // min-h-11(44px) + inline-flex 중앙 정렬 — 모바일 터치 타겟 ≥44px 보장 (CodeRabbit 반영)
    backLink: [
      "mt-3 inline-flex min-h-11 w-full items-center justify-center text-center text-xs text-[#888888]",
      "transition-colors hover:text-white",
    ].join(" "),

    // 인라인 오류 박스: error 색, 반투명 배경
    errorBox:
      "mt-4 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ef4444]",
  },
});
