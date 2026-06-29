// TournamentPage tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리해 이 파일에서만 관리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)
//   canvas #0a0a0a · surface-card #1a1a1a · primary yellow #faff69
//   ink #ffffff · body #cccccc · muted #888888 · hairline #2a2a2a

import { tv } from "tailwind-variants";

export const tournamentPageVariants = tv({
  slots: {
    // 페이지 전체 레이아웃 컨테이너
    container: "mx-auto max-w-2xl px-6 py-12",
    // 페이지 헤더 영역
    header: "mb-10",
    // 토너먼트 이름 타이틀
    title: "text-3xl font-bold tracking-tight text-white",
    // 후보 개수 등 메타 정보
    subtitle: "mt-2 text-sm text-[#888888]",

    // ── 시작 전 섹션 ─────────────────────────────────────────────────────────
    // 시작하기 버튼 래퍼
    startSection: "flex flex-col items-center gap-4",
    // 시작하기 CTA — primary yellow, 비활성 시 dim
    startButton: [
      "w-full max-w-xs rounded-xl px-8 py-4 text-lg font-bold",
      "bg-[#faff69] text-[#0a0a0a]",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "disabled:bg-[#3a3a1f] disabled:text-[#888888] disabled:cursor-not-allowed",
      "transition-colors duration-150",
    ].join(" "),
    // 후보 부족 경고 문구
    warningText: "text-sm text-[#888888]",

    // ── 진행 중 섹션 (Task #31+ 에서 MatchCard로 교체) ─────────────────────
    inProgressSection: [
      "rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]",
      "px-6 py-10 flex flex-col items-center gap-3",
    ].join(" "),
    inProgressText: "text-sm text-[#888888]",
  },
});
