// useDebounce 훅 단위 테스트.
// Issue #75 — it.todo 1건을 fake timer 기반 실제 단언으로 구현.
//
// 검증 범위:
//   - 초기값은 렌더 시 즉시 반영된다
//   - delay 경과 전에는 변경된 값이 반영되지 않는다 (NF-01 API 호출 최소화)
//   - delay 경과 후 최신 값으로 한 번만 업데이트된다
//   - delay 내 연속 변경 시 마지막 값만 살아남는다 (타이머 리셋)
//
// 패턴 참고: SearchInput.test.tsx (vi.useFakeTimers / act / vi.advanceTimersByTime)

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce (UT-09)", () => {
  // 각 테스트에서 시간 흐름을 직접 제어하기 위해 가짜 타이머를 사용한다.
  // 실제 setTimeout이 개입하면 테스트 소요 시간이 길어지고 타이밍이 불안정해진다.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  // 한 테스트의 타이머 상태가 다음 테스트로 새지 않도록 실제 타이머로 복원한다
  afterEach(() => {
    vi.useRealTimers();
  });

  it("300ms 내 연속 입력 시 마지막 값만 반환한다", () => {
    // 초기값 "initial"로 훅을 렌더한다
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    );

    // 초기값은 delay 없이 즉시 반영되어야 한다
    expect(result.current).toBe("initial");

    // 중간값 "intermediate"를 전달한다. delay 경과 전이므로 반영되지 않아야 한다.
    rerender({ value: "intermediate", delay: 300 });

    act(() => {
      // 299ms까지 — 아직 디바운스 미만이므로 이전 값이 유지되어야 한다
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("initial");

    // 다시 새로운 값 "final"을 전달한다. 이전 타이머가 리셋되어 새 300ms가 시작된다.
    // 중간값 "intermediate"는 절대 반영되어서는 안 된다.
    rerender({ value: "final", delay: 300 });

    act(() => {
      // 또 299ms — 새 타이머의 디바운스 미만이므로 여전히 이전 값 "initial"
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("initial");

    // 마지막 1ms를 진행해 정확히 300ms가 되면 "final"만 반영되어야 한다.
    // "intermediate"는 중간에 사라지고 마지막 값만 살아남는 것이 디바운싱의 핵심 동작이다.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("final");
  });

  it("delay 경과 후 값이 즉시 반영된다", () => {
    // 값 변경 후 정확히 delay가 지나면 업데이트되는지 검증한다
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: "alpha", delay: 500 } }
    );

    // 새 값으로 변경하고 500ms를 정확히 대기한다
    rerender({ value: "beta", delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // delay가 정확히 경과했으므로 "beta"로 업데이트되어야 한다
    expect(result.current).toBe("beta");
  });

  it("delay가 0이면 값 변경이 즉시 반영된다", () => {
    // delay=0은 사실상 디바운싱 없음 — 값 변경 즉시(다음 tick에) 반영되어야 한다
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: "start", delay: 0 } }
    );

    rerender({ value: "end", delay: 0 });

    act(() => {
      // 0ms 타이머는 즉시 만료된다
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe("end");
  });
});
