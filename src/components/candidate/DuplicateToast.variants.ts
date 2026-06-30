// DuplicateToast 컴포넌트의 스타일 variants 정의.
// 컨벤션(PR #64): tailwind-variants `tv()` 정의는 컴포넌트 파일에서 분리해 `*.variants.ts`로 둔다.
//
// 색상 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`)의 `warning` 토큰 `#f59e0b`
//   (= Tailwind `amber-500` 계열). 중복은 에러(빨강)가 아니라 "주의" 성격이라 amber로 구분.
//   기존 컴포넌트와 동일하게 light/dark 듀얼 모드 유지.

import { tv } from "tailwind-variants";

// ─────────────────────────────────────────────────────────────────────────────
// duplicateToastVariants — 화면 하단 중앙 고정 토스트의 3개 slot
// ─────────────────────────────────────────────────────────────────────────────
//   container : 하단 중앙 고정(fixed) 배너 — amber 톤, 그림자, 아이콘+텍스트 가로 배치
//   icon      : 좌측 경고 아이콘(장식)
//   text      : 안내 문구
export const duplicateToastVariants = tv({
  slots: {
    container:
      "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
    icon: "flex-none text-base leading-none text-amber-500",
    text: "text-sm font-medium",
  },
});
