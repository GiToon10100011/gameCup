import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SearchInput } from "@/components/search/SearchInput";

describe("SearchInput (#9)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("마운트 시 빈 문자열로 onDebouncedChange가 1회 호출된다", () => {
    const handler = vi.fn();
    render(<SearchInput onDebouncedChange={handler} delayMs={300} />);
    expect(handler).toHaveBeenCalledWith("");
  });

  it("디바운싱: 300ms 경과 전에는 onDebouncedChange가 호출되지 않는다", () => {
    const handler = vi.fn();
    render(<SearchInput onDebouncedChange={handler} delayMs={300} />);
    handler.mockClear();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zelda" } });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(handler).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(handler).toHaveBeenCalledWith("zelda");
  });

  it("연속 입력 시 마지막 값만 디바운싱되어 한 번 전달된다 (NF-01)", () => {
    const handler = vi.fn();
    render(<SearchInput onDebouncedChange={handler} delayMs={300} />);
    handler.mockClear();

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
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(handler).not.toHaveBeenCalled();

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

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "   " } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(handler).toHaveBeenCalledWith("");
  });

  it("aria-label과 placeholder가 정상 노출된다", () => {
    render(<SearchInput onDebouncedChange={() => {}} placeholder="게임명" />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("aria-label", "게임 검색");
    expect(input).toHaveAttribute("placeholder", "게임명");
  });
});
