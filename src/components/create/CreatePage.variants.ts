// CreatePage tailwind-variants 정의.
// CLAUDE.md §5 — tv() 정의는 컴포넌트 파일과 분리해 이 파일에서만 관리.
// 디자인 기준: docs/03-design/DESIGN.md (getdesign `clickhouse`)
//   canvas #0a0a0a · surface-card #1a1a1a · primary yellow #faff69
//   ink #ffffff · body #cccccc · hairline #2a2a2a

import { tv } from "tailwind-variants";

export const createPageVariants = tv({
  slots: {
    // 페이지 전체 레이아웃 컨테이너
    container: "mx-auto max-w-2xl px-6 py-12",
    // 페이지 헤더 영역
    header: "mb-8",
    // 타이틀
    title: "text-3xl font-bold tracking-tight text-white",
    // 부제목
    subtitle: "mt-2 text-sm text-[#888888]",
    // 섹션 구분선
    divider: "my-6 border-t border-[#2a2a2a]",
    // 토너먼트 이름 입력 섹션 — 검색/후보 목록 아래 배치
    nameSection: "mt-8",
    // 섹션 레이블
    nameLabel:
      "mb-2 block text-sm font-semibold text-[#e6e6e6] uppercase tracking-widest",
    // 이름 입력 필드
    nameInput: [
      "w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]",
      "px-4 py-3 text-base text-white placeholder-[#5a5a5a]",
      "outline-none ring-0",
      "focus:border-[#faff69] focus:ring-1 focus:ring-[#faff69]/30",
      "transition-colors duration-150",
    ].join(" "),
    // 저장 버튼 영역
    saveSection: "mt-6",
    // 저장 버튼 — primary yellow CTA
    saveButton: [
      "w-full rounded-lg px-6 py-3.5",
      "bg-[#faff69] text-[#0a0a0a] font-semibold text-sm",
      "hover:bg-[#e6eb52] active:bg-[#e6eb52]",
      "disabled:bg-[#3a3a1f] disabled:text-[#888888] disabled:cursor-not-allowed",
      "transition-colors duration-150",
    ].join(" "),
    // 에러 메시지
    errorText: "mt-3 text-sm text-[#ef4444]",
    // 후보 개수 경고 (2개 미만일 때)
    warningText: "mt-2 text-xs text-[#888888]",
  },
});
