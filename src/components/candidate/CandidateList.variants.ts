// CandidateList 컴포넌트의 스타일 variants 정의.
// 컨벤션(PR #64): tailwind-variants `tv()` 정의는 컴포넌트 파일에서 분리해 `*.variants.ts`로 둔다.
//
// 색상 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`). 목록은 SearchDropdown과 같은
//   neutral 카드 톤을 쓰고, 삭제 버튼은 destructive 의미라 hover 시 error(red) 톤을 준다.
//   기존 컴포넌트와 동일하게 light/dark 듀얼 모드 유지.

import { tv } from "tailwind-variants";

// ─────────────────────────────────────────────────────────────────────────────
// candidateListVariants — 후보 목록의 6개 slot + thumbKind variant
// ─────────────────────────────────────────────────────────────────────────────
//   list      : <ul> 컨테이너 — 항목 간 구분선
//   empty     : 후보가 없을 때의 안내 문구
//   item      : 각 후보 행 — [썸네일 | 이름 | 삭제버튼] 가로 배치
//   thumb     : 썸네일/placeholder 공통 크기(48×48)
//   name      : 게임명 (남는 공간 차지, 말줄임)
//   deleteBtn : 삭제 버튼 — 터치 타겟 ≥44px(a11y 오버라이드), hover 시 red
//   variants.thumbKind: image(정상 썸네일) / placeholder(빈 썸네일 회색 박스)
export const candidateListVariants = tv({
  slots: {
    list: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800",
    empty: "rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700",
    item: "flex items-center gap-3 px-3 py-2",
    thumb: "h-12 w-12 flex-none rounded",
    name: "min-w-0 flex-1 truncate text-sm font-medium text-neutral-800 dark:text-neutral-100",
    deleteBtn:
      "flex h-11 w-11 flex-none items-center justify-center rounded-md text-neutral-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-950 dark:hover:text-red-400",
  },
  variants: {
    thumbKind: {
      image: { thumb: "object-cover" },
      placeholder: { thumb: "bg-neutral-200 dark:bg-neutral-800" },
    },
  },
});
