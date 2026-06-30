// ResultPage tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리해 이 파일에서만 관리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)
//   canvas #0a0a0a · surface-card #1a1a1a · primary yellow #faff69
//   ink #ffffff · body #cccccc · muted #888888 · hairline #2a2a2a

import { tv } from "tailwind-variants";

export const resultPageVariants = tv({
  slots: {
    // 페이지 전체 레이아웃
    container: "mx-auto max-w-2xl px-6 py-12",
    // 헤더
    header: "mb-8",
    title: "text-3xl font-bold tracking-tight text-white",
    subtitle: "mt-1 text-sm text-[#888888]",
    // 우승자 섹션 — 황금 강조
    winnerSection: [
      "mb-8 flex flex-col items-center gap-3 rounded-xl",
      "border border-[#faff69]/20 bg-[#1a1a1a] px-8 py-10 text-center",
    ].join(" "),
    winnerLabel: "text-xs font-semibold uppercase tracking-widest text-[#faff69]",
    // 우승 게임 썸네일 래퍼 — next/image fill 사용 시 relative 필수 (Task #43, F-10)
    winnerThumbnailWrapper: [
      "relative h-36 w-36 overflow-hidden rounded-xl",
      "border border-[#faff69]/30",
      "shadow-[0_0_24px_rgba(250,255,105,0.12)]",
    ].join(" "),
    // 우승 게임 썸네일 이미지
    winnerThumbnail: "object-cover",
    // 축하 문구 — 우승자 이름 아래 표시 (Task #43, F-10)
    congratsMessage: "text-sm font-medium text-[#faff69]",
    winnerName: "text-4xl font-bold text-white",
    savingText: "text-sm text-[#888888]",
    errorText: "mt-2 text-sm text-[#ef4444]",
    // 이력 섹션
    historySection: "mb-8",
    historyTitle: "mb-3 text-base font-semibold text-[#e6e6e6]",
    historyList: "flex flex-col gap-2",
    historyItem: [
      "flex items-center justify-between rounded-lg",
      "border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3",
    ].join(" "),
    historyWinner: "text-sm font-medium text-white",
    historyDate: "text-xs text-[#888888]",
    // 액션 영역
    actions: "flex flex-col gap-3",
    newButton: [
      "w-full rounded-lg px-6 py-3.5 text-sm font-semibold",
      "bg-[#faff69] text-[#0a0a0a]",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "transition-colors duration-150",
    ].join(" "),
    hubButton: [
      "w-full rounded-lg px-6 py-3.5 text-sm font-semibold",
      "border border-[#2a2a2a] bg-transparent text-[#cccccc]",
      "hover:border-[#3a3a3a] hover:text-white",
      "transition-colors duration-150",
    ].join(" "),
    // 빈 상태 (winner 없음)
    emptyContainer: [
      "flex flex-col items-center gap-4 rounded-xl",
      "border border-[#2a2a2a] bg-[#1a1a1a] px-8 py-16 text-center",
    ].join(" "),
    emptyTitle: "text-xl font-semibold text-white",
    // 공유 섹션 (F-20 UC-10)
    shareSection: "mb-6 flex flex-col gap-3",
    shareButton: [
      "w-full rounded-lg px-6 py-3.5 text-sm font-semibold",
      "border border-[#faff69]/40 bg-transparent text-[#faff69]",
      "hover:border-[#faff69] hover:bg-[#faff69]/10",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "transition-colors duration-150",
    ].join(" "),
    shareUrlRow: [
      "flex items-center gap-2 rounded-lg",
      "border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3",
    ].join(" "),
    shareUrlText: "flex-1 truncate text-sm text-[#cccccc] font-mono",
    copyButton: [
      "shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold",
      "bg-[#2a2a2a] text-white",
      "hover:bg-[#3a3a3a]",
      "transition-colors duration-150",
    ].join(" "),
    copySuccessText: "text-xs text-[#faff69]",
    shareErrorText: "text-sm text-[#ef4444]",
    sharingText: "text-sm text-[#888888]",
  },
});
