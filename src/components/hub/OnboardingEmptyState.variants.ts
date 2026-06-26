// OnboardingEmptyState tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리해 이 파일에서만 관리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)
//   canvas #0a0a0a · surface-card #1a1a1a · primary yellow #faff69
//   ink #ffffff · body #cccccc · muted #888888 · hairline #2a2a2a

import { tv } from "tailwind-variants";

export const onboardingEmptyStateVariants = tv({
  slots: {
    // 빈 상태 전체 컨테이너 — 카드형 테두리·배경
    container: [
      "flex flex-col items-center gap-5 rounded-xl",
      "border border-[#2a2a2a] bg-[#1a1a1a] px-8 py-20 text-center",
    ].join(" "),
    // 아이콘 래퍼 — 서비스 정체성(트로피) 시각화
    iconWrap: "text-5xl leading-none select-none",
    // 타이틀
    title: "text-xl font-semibold text-white",
    // 부제목
    subtitle: "max-w-xs text-sm leading-relaxed text-[#888888]",
    // 첫 토너먼트 만들기 CTA 링크 — primary yellow
    ctaLink: [
      "mt-2 inline-block rounded-lg px-6 py-3 text-sm font-semibold",
      "bg-[#faff69] text-[#0a0a0a]",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "transition-colors duration-150",
    ].join(" "),
  },
});
