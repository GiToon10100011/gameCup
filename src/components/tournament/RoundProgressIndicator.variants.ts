// RoundProgressIndicator tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)

import { tv } from "tailwind-variants";

export const roundProgressIndicatorVariants = tv({
  slots: {
    // 전체 컨테이너 — 헤더 아래, MatchCard 위 배치
    root: "flex flex-col gap-2 w-full",

    // 상단 행 — 라운드 레이블 + 경기 카운터
    infoRow: "flex items-center justify-between",

    // 라운드 레이블 — "라운드 N" (Task #36에서 "8강" 형태로 교체 예정)
    roundLabel: "text-sm font-semibold text-white",

    // 경기 카운터 — "N/M 경기"
    matchCounter: "text-sm text-[#888888]",

    // 진행 막대 배경
    progressTrack: "h-1 w-full rounded-full bg-[#2a2a2a]",

    // 진행 막대 채움 — width는 인라인 스타일로 설정
    progressFill: "h-full rounded-full bg-[#faff69] transition-all duration-300",
  },
});
