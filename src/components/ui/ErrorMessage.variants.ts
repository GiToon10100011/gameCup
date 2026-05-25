// ErrorMessage 컴포넌트의 스타일 variants 정의.
// 컨벤션(PR #64): tailwind-variants `tv()` 정의는 컴포넌트 파일에서 분리해 `*.variants.ts`로 둔다.
//
// 색상 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`)의 `error` 토큰 `#ef4444`
//   (= Tailwind `red-500` 계열). 기존 컴포넌트(SearchDropdown)와 동일하게 light/dark 듀얼 모드 유지.
// 접근성: 닫기 버튼은 DESIGN.md a11y 오버라이드에 따라 터치 타겟 ≥44×44px(`h-11 w-11`)로 키운다.

import { tv } from "tailwind-variants";

// ─────────────────────────────────────────────────────────────────────────────
// errorMessageVariants — 인라인 오류 alert의 6개 slot
// ─────────────────────────────────────────────────────────────────────────────
//   container : 외곽 박스 — 빨강 테두리 + 옅은 빨강 배경, [아이콘 | 본문 | 닫기] 가로 배치
//   icon      : 좌측 경고 아이콘(장식) — 본문 첫 줄과 정렬
//   body      : 메시지 + 보조 상태코드를 담는 세로 래퍼 (남는 가로 공간 차지)
//   message   : 사용자용 오류 문구 (긴 메시지 줄바꿈 허용)
//   status    : HTTP 상태코드 보조 표기 (작고 흐린 텍스트)
//   dismiss   : 닫기(✕) 버튼 — 터치 타겟 ≥44px, 포커스 링 포함
export const errorMessageVariants = tv({
  slots: {
    container:
      "flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    icon: "mt-0.5 flex-none text-base leading-none text-red-500",
    body: "min-w-0 flex-1",
    message: "break-words text-sm font-medium",
    status: "mt-0.5 text-xs text-red-600 dark:text-red-300",
    dismiss:
      "flex h-11 w-11 flex-none items-center justify-center rounded-md text-red-500 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-900",
  },
});
