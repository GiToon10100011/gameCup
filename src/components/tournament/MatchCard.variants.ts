// MatchCard tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)
//   canvas #0a0a0a · surface-card #1a1a1a · primary yellow #faff69
//   ink #ffffff · body #cccccc · muted #888888 · hairline #2a2a2a

import { tv } from "tailwind-variants";

export const matchCardVariants = tv({
  slots: {
    // 전체 레이아웃 — 두 카드 + VS 구분자를 가로로 배치
    root: "flex items-stretch gap-3 w-full",

    // 개별 게임 카드 컨테이너
    card: [
      "flex-1 flex flex-col rounded-xl overflow-hidden",
      "border border-[#2a2a2a] bg-[#1a1a1a]",
    ].join(" "),

    // 썸네일 영역 — 정사각형 비율, 배경으로 placeholder 대비
    thumbnailWrapper: "relative w-full aspect-square bg-[#121212]",

    // 실제 이미지 — fill 모드로 wrapper에 꽉 채움
    thumbnailImg: "object-cover",

    // 썸네일 없을 때 회색 placeholder
    thumbnailPlaceholder: "absolute inset-0 bg-[#242424]",

    // 카드 하단 정보 영역 (이름 + 버튼)
    gameInfo: "flex flex-col flex-1 items-center gap-3 p-3 w-full",

    // 게임 이름 — 최대 2줄, 초과 시 ellipsis
    gameName: "text-center text-sm font-semibold text-white line-clamp-2 leading-tight",

    // 선택 버튼 — primary yellow CTA
    selectButton: [
      "mt-auto w-full rounded-lg px-4 py-2 text-sm font-bold",
      "bg-[#faff69] text-[#0a0a0a]",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "disabled:bg-[#3a3a1f] disabled:text-[#888888] disabled:cursor-not-allowed",
      "transition-colors duration-150",
    ].join(" "),

    // VS 구분자 — 두 카드 사이 세로 중앙 정렬
    vs: "flex-shrink-0 self-center text-base font-bold text-[#888888] px-1",

    // 부전승 뱃지 — gameA 단독 진출 안내
    byeBadge: [
      "mt-auto w-full rounded-lg py-2 text-xs font-medium",
      "bg-[#121212] text-[#888888] text-center",
    ].join(" "),
  },
});
