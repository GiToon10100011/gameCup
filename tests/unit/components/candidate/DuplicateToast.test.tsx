// DuplicateToast 컴포넌트(#19)의 단위 테스트.
// open 제어 표시/비표시, 기본·커스텀 메시지, durationMs 후 자동 onClose 호출을 검증.
//
// 자동 닫힘은 setTimeout 기반이라 vi.useFakeTimers로 시간을 제어한다.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { DuplicateToast } from "@/components/candidate/DuplicateToast";

describe("DuplicateToast (#19, F-04)", () => {
  // setTimeout 기반 자동 닫힘을 결정적으로 검증하기 위해 가짜 타이머 사용
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // 마운트 정리 + 실제 타이머 복구 — 테스트 간 누수 방지
    cleanup();
    vi.useRealTimers();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) open=false → 렌더 안 함
  // ───────────────────────────────────────────────────────────────────────────
  it("open=false면 아무것도 렌더하지 않는다", () => {
    render(<DuplicateToast open={false} onClose={() => {}} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) open=true → role=status + 기본 메시지
  // ───────────────────────────────────────────────────────────────────────────
  it("open=true면 role=status로 기본 중복 안내 문구를 표시한다", () => {
    render(<DuplicateToast open onClose={() => {}} />);

    const toast = screen.getByRole("status");
    expect(toast).toBeInTheDocument();
    expect(screen.getByText("이미 후보에 등록된 게임입니다.")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 커스텀 메시지
  // ───────────────────────────────────────────────────────────────────────────
  it("message prop을 주면 해당 문구를 표시한다", () => {
    render(<DuplicateToast open message="중복!" onClose={() => {}} />);
    expect(screen.getByText("중복!")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) durationMs 후 자동 onClose 호출
  // ───────────────────────────────────────────────────────────────────────────
  it("durationMs가 지나면 onClose를 자동 호출한다", () => {
    const onClose = vi.fn();
    render(<DuplicateToast open onClose={onClose} durationMs={3000} />);

    // 아직 시간 전 — 호출되지 않음
    expect(onClose).not.toHaveBeenCalled();

    // 3초 경과 — 타이머가 onClose를 호출해야 함 (act로 타이머 콜백의 상태 변화 flush)
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) open=false면 타이머도 걸리지 않는다
  // ───────────────────────────────────────────────────────────────────────────
  it("open=false면 시간이 지나도 onClose가 호출되지 않는다", () => {
    const onClose = vi.fn();
    render(<DuplicateToast open={false} onClose={onClose} durationMs={3000} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
