// OnboardingEmptyState 단위 테스트 — Task #122 (F-18 · UC-08)
//
// 검증 범위:
//   1) 빈 상태 타이틀이 렌더된다
//   2) 부제목이 렌더된다
//   3) CTA 링크가 /create를 가리킨다 (UC-08 §기본 흐름 3)
//   4) CTA 링크 텍스트가 '첫 토너먼트 만들기'이다 (UC-08 명세 준수)
//   5) 트로피 이미지/아이콘이 aria-hidden으로 처리된다 (접근성)

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingEmptyState } from "@/components/hub/OnboardingEmptyState";

describe("OnboardingEmptyState (Task #122 · UC-08)", () => {
  // 모든 케이스에서 동일 컴포넌트를 렌더하므로 공통 헬퍼
  function renderComponent() {
    return render(<OnboardingEmptyState />);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 타이틀
  // ───────────────────────────────────────────────────────────────────────────
  it("빈 상태 타이틀이 화면에 표시된다", () => {
    renderComponent();
    expect(screen.getByText("아직 토너먼트가 없어요.")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 부제목
  // ───────────────────────────────────────────────────────────────────────────
  it("서비스 안내 부제목이 화면에 표시된다", () => {
    renderComponent();
    // 부분 텍스트 매치 — 줄 바꿈 포함 문구
    expect(screen.getByText(/좋아하는 게임들로 나만의 토너먼트를 만들고/)).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) CTA href
  // ───────────────────────────────────────────────────────────────────────────
  it("CTA 링크가 /create를 가리킨다 (UC-08 §기본 흐름 3 → CreatePage 연결)", () => {
    renderComponent();
    const link = screen.getByRole("link", { name: "첫 토너먼트 만들기" });
    expect(link).toHaveAttribute("href", "/create");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) CTA 텍스트 (UC-08 명세 준수)
  // ───────────────────────────────────────────────────────────────────────────
  it("CTA 링크 텍스트가 '첫 토너먼트 만들기'이다 (UC-08 스펙)", () => {
    renderComponent();
    // UC-08 기본 흐름 step 3: "사용자가 '첫 토너먼트 만들기' 버튼을 클릭한다"
    expect(screen.getByRole("link", { name: "첫 토너먼트 만들기" })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 트로피 아이콘 접근성 — aria-hidden
  // ───────────────────────────────────────────────────────────────────────────
  it("트로피 아이콘은 aria-hidden으로 처리돼 스크린 리더에 노출되지 않는다", () => {
    renderComponent();
    // 🏆 이모지 span은 aria-hidden="true" 속성이어야 한다
    const icon = screen.getByText("🏆");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
