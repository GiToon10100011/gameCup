// HubPage tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리해 이 파일에서만 관리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)
//   canvas #0a0a0a · surface-card #1a1a1a · surface-elevated #242424
//   primary yellow #faff69 · ink #ffffff · body #cccccc · hairline #2a2a2a

import { tv } from "tailwind-variants";

export const hubPageVariants = tv({
  slots: {
    // 페이지 전체 레이아웃 컨테이너
    container: "mx-auto max-w-2xl px-6 py-12",
    // 페이지 헤더 영역
    header: "mb-8",
    // 페이지 타이틀
    title: "text-3xl font-bold tracking-tight text-white",
    // 페이지 부제목
    subtitle: "mt-2 text-sm text-[#888888]",
    // 로딩 컨테이너 — 목록 조회 중 spinner 영역
    loadingContainer: "flex items-center justify-center py-24",
    // 로딩 텍스트
    loadingText: "text-sm text-[#888888]",
    // 에러 배너 — API 실패 시
    errorText: "mb-4 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ef4444]",
    // 목록 상단 액션 줄 (목록이 있을 때)
    listHeader: "mb-4 flex items-center justify-end",
    // 새 토너먼트 버튼 (목록이 있을 때)
    newButton: [
      "rounded-lg px-4 py-2 text-sm font-semibold",
      "bg-[#faff69] text-[#0a0a0a]",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "transition-colors duration-150",
    ].join(" "),
    // 토너먼트 카드 그리드
    grid: "flex flex-col gap-4",
    // 개별 토너먼트 카드
    card: [
      "rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]",
      "px-5 py-4 flex flex-col gap-3",
    ].join(" "),
    // 카드 헤더 (이름 + 뱃지)
    cardHeader: "flex items-start gap-2",
    // 토너먼트 이름
    cardName: "flex-1 text-base font-semibold text-white leading-tight",
    // 메타 정보 줄 — 후보 개수 + 생성일
    cardMeta: "flex items-center gap-4",
    // 메타 개별 항목
    cardMetaItem: "text-xs text-[#888888]",
    // 카드 액션 버튼 영역
    cardActions: "flex items-center gap-3 mt-1",
    // 시작하기 버튼 — primary yellow CTA
    playButton: [
      "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold",
      "bg-[#faff69] text-[#0a0a0a]",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "disabled:bg-[#3a3a1f] disabled:text-[#888888] disabled:cursor-not-allowed",
      "transition-colors duration-150",
    ].join(" "),
    // 삭제 버튼 — subtle danger
    deleteButton: [
      "rounded-lg px-4 py-2.5 text-sm font-medium",
      "border border-[#3a3a3a] bg-transparent text-[#888888]",
      "hover:border-[#ef4444]/50 hover:text-[#ef4444]",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      "transition-colors duration-150",
    ].join(" "),
    // 빈 상태는 OnboardingEmptyState 컴포넌트에서 자체 스타일 관리 (F-18)
  },
});
