// Vitest API: 단언·모킹·가짜 타이머 + 라이프사이클 훅
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// React 테스트 유틸: render·screen·fireEvent + 타이머 진행을 위한 act + 후처리용 cleanup
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
// 테스트 대상 컴포넌트
import { SearchInput } from "@/components/search/SearchInput";

// SearchInput(#9)의 입력·디바운싱·빈 값·접근성 동작을 검증하는 테스트 묶음
describe("SearchInput (#9)", () => {
  // 디바운싱은 setTimeout 기반이므로 각 테스트마다 가짜 타이머로 시간 흐름을 직접 제어
  beforeEach(() => {
    vi.useFakeTimers();
  });

  // 한 테스트의 타이머/DOM 상태가 다음 테스트로 새지 않도록 정리
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("마운트 시 빈 문자열로 onDebouncedChange가 1회 호출된다", () => {
    // 부모 콜백을 spy로 만들어 호출 여부 추적
    const handler = vi.fn();
    // 컴포넌트를 렌더하면 초기 effect가 즉시 한 번 실행되어 빈 값이 부모에 전달됨
    render(<SearchInput onDebouncedChange={handler} delayMs={300} />);
    expect(handler).toHaveBeenCalledWith("");
  });

  it("디바운싱: 300ms 경과 전에는 onDebouncedChange가 호출되지 않는다", () => {
    // 마운트 시 호출되는 빈 값 알림은 mockClear로 무시하고 이후 동작만 검증
    const handler = vi.fn();
    render(<SearchInput onDebouncedChange={handler} delayMs={300} />);
    handler.mockClear();

    // "zelda" 입력 → 즉시 콜백이 와서는 안 됨 (디바운스 대기 중)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zelda" } });

    // 299ms까지 진행 — 여전히 호출 없음 (디바운스 미만)
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(handler).not.toHaveBeenCalled();

    // 1ms 더 진행해 정확히 300ms 도달 → 디바운스 만료, 콜백 호출
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(handler).toHaveBeenCalledWith("zelda");
  });

  it("연속 입력 시 마지막 값만 디바운싱되어 한 번 전달된다 (NF-01)", () => {
    const handler = vi.fn();
    render(<SearchInput onDebouncedChange={handler} delayMs={300} />);
    handler.mockClear();

    // 중간값들은 부모에 전달되면 안 됨 — 매 입력마다 디바운스가 reset되어 마지막 값만 살아남아야 함
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "ze" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.change(input, { target: { value: "zel" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.change(input, { target: { value: "zelda" } });

    // 마지막 입력 후 299ms — 아직 디바운스 미만이라 호출 없음
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(handler).not.toHaveBeenCalled();

    // 300ms 도달 → 마지막 값 "zelda" 한 번만 전달
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("zelda");
  });

  it("공백만 입력하면 trim되어 빈 문자열을 전달한다 (F-12)", () => {
    const handler = vi.fn();
    render(<SearchInput onDebouncedChange={handler} delayMs={300} />);
    handler.mockClear();

    // "   " 같은 의미 없는 공백 입력은 trim 후 빈 문자열이 되어
    // 부모(useSearchQuery)의 enabled 가드가 API 호출을 막는다.
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "   " } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(handler).toHaveBeenCalledWith("");
  });

  it("aria-label과 placeholder가 정상 노출된다", () => {
    // 접근성 속성과 안내 문구가 props 또는 default대로 렌더링되는지 점검
    render(<SearchInput onDebouncedChange={() => {}} placeholder="게임명" />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("aria-label", "게임 검색");
    expect(input).toHaveAttribute("placeholder", "게임명");
  });
});
