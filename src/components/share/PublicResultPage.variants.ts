// PublicResultPage tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리해 이 파일에서만 관리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)
//   canvas #0a0a0a · surface-card #1a1a1a · primary yellow #faff69
//   ink #ffffff · body #cccccc · muted #888888 · hairline #2a2a2a

import { tv } from "tailwind-variants";

export const publicResultPageVariants = tv({
  slots: {
    // 페이지 전체 레이아웃
    container: "mx-auto max-w-2xl px-6 py-12",
    // 공유 배지 — 출처 표시
    badge: [
      "mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1",
      "border border-[#faff69]/30 bg-[#faff69]/10 text-xs font-medium text-[#faff69]",
    ].join(" "),
    // 헤더
    header: "mb-8",
    title: "text-3xl font-bold tracking-tight text-white",
    subtitle: "mt-1 text-sm text-[#888888]",
    // 우승자 카드 — 황금 테두리 강조
    winnerSection: [
      "mb-8 flex flex-col items-center gap-3 rounded-xl",
      "border border-[#faff69]/20 bg-[#1a1a1a] px-8 py-10 text-center",
    ].join(" "),
    winnerLabel: "text-xs font-semibold uppercase tracking-widest text-[#faff69]",
    winnerName: "text-4xl font-bold text-white",
    sharedAt: "text-xs text-[#888888]",
    // 로딩 상태
    loadingContainer: "flex items-center justify-center py-24",
    loadingText: "text-sm text-[#888888]",
    // 에러 상태 (share 없음·만료)
    errorContainer: [
      "flex flex-col items-center gap-4 rounded-xl py-16 text-center",
      "border border-[#2a2a2a] bg-[#1a1a1a] px-8",
    ].join(" "),
    errorTitle: "text-xl font-semibold text-white",
    errorSubtitle: "text-sm text-[#888888]",
    // winner 없음 (마이그레이션 이전 공유 레코드)
    noWinnerText: "text-sm text-[#888888]",
  },
});
