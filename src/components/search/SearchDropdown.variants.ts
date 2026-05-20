// SearchDropdown 컴포넌트의 스타일 variants 정의.
// 컴포넌트 파일(SearchDropdown.tsx)에서 분리해 관리 — PR #64 리뷰 피드백 반영.
//
// 분리 이유 (컨벤션):
// 1) 동일 컴포넌트라도 "JSX 구조"와 "시각 스타일"을 다른 파일로 두면 시각 회귀 디자인 검토와
//    로직 변경 리뷰가 서로 간섭하지 않는다.
// 2) 동일 variants를 다른 컴포넌트(예: 미래의 SearchResults·HistoryDropdown)에서 재사용하려 할 때
//    이미 별도 파일이면 import 한 줄로 끝난다.
// 3) Storybook/스토리북 도입 시 variants 파일만 import해 표를 자동 생성 가능.

import { tv } from "tailwind-variants";

// ─────────────────────────────────────────────────────────────────────────────
// dropdownVariants — SearchDropdown의 5개 slot + thumbKind variant
// ─────────────────────────────────────────────────────────────────────────────
//   slots:
//     container : 외곽 박스 (4가지 상태 공통 모양 — 둥근 모서리·테두리·스크롤·다크 모드)
//     message   : 안내 문구용 패딩·텍스트 (로딩/빈 결과 상태에서 사용)
//     item      : 각 결과 행(<button>) — hover·focus 시각 피드백
//     thumb     : 썸네일 또는 placeholder 공통 크기(48×48)
//     name      : 게임명 텍스트
//   variants.thumbKind:
//     image       : 정상 썸네일 — object-cover 적용
//     placeholder : 빈 썸네일 — 회색 배경 div로 동일 레이아웃 유지
export const dropdownVariants = tv({
  slots: {
    container:
      "mt-2 max-h-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900",
    message: "px-4 py-3 text-sm text-neutral-500",
    item:
      "flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none dark:hover:bg-neutral-800 dark:focus:bg-neutral-800",
    thumb: "h-12 w-12 flex-none rounded",
    name: "text-sm font-medium text-neutral-800 dark:text-neutral-100",
  },
  variants: {
    thumbKind: {
      image: { thumb: "object-cover" },
      placeholder: { thumb: "bg-neutral-200 dark:bg-neutral-800" },
    },
  },
});
