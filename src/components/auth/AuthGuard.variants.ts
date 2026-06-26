// AuthGuard 컴포넌트 tailwind-variants 정의 (CLAUDE.md — variants 분리 규칙).
// clickhouse 디자인 토큰 기준: canvas #0a0a0a, surface-card #1a1a1a, primary #faff69.

import { tv } from "tailwind-variants";

export const authGuardVariants = tv({
  slots: {
    // 전체 화면을 채우는 어두운 배경 — 로딩/로그인 유도 공통
    container:
      "flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a]",
    // 스피너 — 테두리 base는 hairline, 회전 부분은 primary yellow
    spinner:
      "h-8 w-8 animate-spin rounded-full border-2 border-[#2a2a2a] border-t-[#faff69]",
    // 로그인 유도 카드
    card: "flex flex-col items-center gap-5 rounded-xl bg-[#1a1a1a] px-8 py-10 text-center",
    // 아이콘 영역 — 잠금 아이콘 등 SVG가 들어갈 자리
    iconWrapper:
      "flex h-12 w-12 items-center justify-center rounded-full bg-[#242424]",
    // 제목
    title: "text-xl font-semibold text-white",
    // 설명 텍스트
    description: "max-w-xs text-sm text-[#888888]",
    // 로그인 버튼 — primary yellow CTA
    button:
      "rounded-lg bg-[#faff69] px-6 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#e6eb52] active:bg-[#d4d948]",
  },
});
