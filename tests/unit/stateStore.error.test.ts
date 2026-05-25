// `stateStore.apiError` (API 에러 상태)의 단위 테스트.
// Issue #14 — API 호출 에러 핸들러 구현 (try/catch + 상태 반영).
//
// 검증 범위:
//   1) 초기 상태에서 apiError는 null
//   2) setApiError로 IApiError를 반영하면 그대로 조회된다
//   3) clearApiError로 에러를 해제하면 다시 null
//   4) setApiError(null)도 해제와 동일하게 동작
//   5) resetAll 호출 시 apiError도 함께 null로 초기화
//
// stateStore는 외부 의존성 없는 메모리 store이므로 mock 없이 직접 호출한다.

import { beforeEach, describe, expect, it } from "vitest";
import { useStateStore } from "@/store/stateStore";
import type { IApiError } from "@/types/game";

// 테스트용 샘플 에러 — 실제 ExternalApiError가 정규화되면 이런 형태가 된다.
const sampleError: IApiError = { message: "RAWG request failed", statusCode: 503 };

describe("stateStore.apiError (Issue #14, API 에러 상태)", () => {
  // 각 테스트는 깨끗한 store 상태에서 시작 — 이전 테스트의 에러가 새지 않도록 reset
  beforeEach(() => {
    useStateStore.getState().resetAll();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 초기 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("초기 상태에서 apiError는 null이다", () => {
    // 한 번도 에러가 반영된 적 없으면 정상 상태(null)
    expect(useStateStore.getState().apiError).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 에러 반영 → 조회
  // ───────────────────────────────────────────────────────────────────────────
  it("setApiError로 반영한 IApiError를 그대로 조회한다", () => {
    useStateStore.getState().setApiError(sampleError);

    // 저장한 객체가 message·statusCode 그대로 보존되어야 함
    expect(useStateStore.getState().apiError).toEqual(sampleError);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 명시적 해제
  // ───────────────────────────────────────────────────────────────────────────
  it("clearApiError 호출 시 apiError가 null로 돌아간다", () => {
    // 액션은 항상 최신 getState()로 호출 — 캡처한 스냅샷의 필드는 set 이후에도 옛 값을 가리킨다.
    useStateStore.getState().setApiError(sampleError);
    // 사전 조건 확인 — 실제로 에러가 들어가 있어야 의미 있는 검증
    expect(useStateStore.getState().apiError).not.toBeNull();

    // 해제 — 검색이 다시 성공하는 흐름에서 호출됨
    useStateStore.getState().clearApiError();
    expect(useStateStore.getState().apiError).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) setApiError(null) 해제 동등성
  // ───────────────────────────────────────────────────────────────────────────
  it("setApiError(null)도 해제와 동일하게 동작한다", () => {
    const store = useStateStore.getState();
    store.setApiError(sampleError);

    // null 인자도 해제 경로 — 호출자가 clearApiError와 자유롭게 선택 가능
    store.setApiError(null);
    expect(useStateStore.getState().apiError).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) resetAll 후 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("resetAll 호출 시 apiError도 null로 초기화된다", () => {
    const store = useStateStore.getState();
    store.setApiError(sampleError);

    // 전체 초기화 — F-13(새 토너먼트 시작) 흐름에서 호출됨
    store.resetAll();

    // initialState에 apiError: null이 포함돼 함께 리셋되어야 함
    expect(useStateStore.getState().apiError).toBeNull();
  });
});
