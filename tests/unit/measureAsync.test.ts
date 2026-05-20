// 비동기 측정 유틸 `measureAsync`의 단위 테스트.
// Issue #13 — 검색 응답 시간 측정 유틸 기반 검증.

import { afterEach, describe, expect, it, vi } from "vitest";
import { measureAsync } from "@/utils/measureAsync";

describe("measureAsync (Issue #13)", () => {
  // 각 테스트는 timer mock을 깨끗하게 정리한 상태로 시작
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 성공 케이스
  // ───────────────────────────────────────────────────────────────────────────
  it("정상 완료한 비동기 함수의 결과를 그대로 반환하고 측정 콜백을 호출한다", async () => {
    // performance.now를 가짜 값으로 대체 — 시작 100, 종료 175로 75ms 차이
    let nowCallCount = 0;
    vi.spyOn(performance, "now").mockImplementation(() => {
      nowCallCount += 1;
      return nowCallCount === 1 ? 100 : 175;
    });

    const onMeasure = vi.fn();
    const result = await measureAsync(async () => "ok", onMeasure);

    // 결과가 그대로 전달
    expect(result).toBe("ok");
    // 콜백은 한 번 호출 + 측정값 75ms + success=true
    expect(onMeasure).toHaveBeenCalledTimes(1);
    expect(onMeasure).toHaveBeenCalledWith(75, true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 실패 케이스
  // ───────────────────────────────────────────────────────────────────────────
  it("fn이 throw해도 측정 콜백을 한 번 호출하고 원본 에러를 재throw한다", async () => {
    let nowCallCount = 0;
    vi.spyOn(performance, "now").mockImplementation(() => {
      nowCallCount += 1;
      // 시작 0, 종료 1234 → 측정값 1234ms (NF-01 임계 초과 시나리오)
      return nowCallCount === 1 ? 0 : 1234;
    });

    const boom = new Error("network down");
    const onMeasure = vi.fn();

    // rejects matcher로 비동기 throw 검증
    await expect(
      measureAsync(async () => {
        throw boom;
      }, onMeasure),
    ).rejects.toBe(boom);

    // 실패해도 콜백은 호출되어야 함 (타임아웃 진단 목적)
    expect(onMeasure).toHaveBeenCalledTimes(1);
    expect(onMeasure).toHaveBeenCalledWith(1234, false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 측정값은 항상 0 이상
  // ───────────────────────────────────────────────────────────────────────────
  it("동일 시점에 시작·종료가 측정되어도 durationMs는 0 이상이다", async () => {
    // performance.now가 같은 값을 두 번 반환 — 매우 빠른 동기 비동기 흐름
    vi.spyOn(performance, "now").mockReturnValue(500);

    const onMeasure = vi.fn();
    await measureAsync(async () => undefined, onMeasure);

    // 0ms는 정상 (Promise.resolve가 즉시 처리)
    const [duration, success] = onMeasure.mock.calls[0];
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(success).toBe(true);
  });
});
