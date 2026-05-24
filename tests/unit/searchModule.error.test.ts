// 검색 에러 핸들러(`modules/searchModule.ts`)의 단위 테스트.
// Issue #14 — API 호출 에러 핸들러 구현 (try/catch + 상태 반영).
//
// 검증 범위:
//   1) toApiError: ExternalApiError / 일반 Error / 비-Error throw를 표준 IApiError로 정규화
//   2) searchWithErrorHandling: 성공 시 결과 반환 + 직전 에러 해제(clearApiError)
//   3) searchWithErrorHandling: 실패 시 빈 배열 반환 + store.apiError 반영 (graceful degradation)
//   4) searchWithErrorHandling: 실패 후 재호출 성공 시 에러가 해제되어 정상 복귀
//
// 외부 API 호출은 `vi.mock`으로 fetchGames를 가짜로 대체하되,
// ExternalApiError 클래스는 실제 구현을 그대로 노출해야 instanceof 분기를 검증할 수 있다.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// fetchGames만 mock하고 ExternalApiError는 실제 클래스를 유지 — importActual로 원본을 가져와 병합.
vi.mock("@/lib/externalApiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/externalApiClient")>(
    "@/lib/externalApiClient",
  );
  return {
    ...actual,
    fetchGames: vi.fn(),
  };
});

// 위 mock 이후에 import해야 mock된 fetchGames가 주입된다.
import {
  toApiError,
  searchWithErrorHandling,
  resetSearchDurationMeasurement,
} from "@/modules/searchModule";
import { ExternalApiError, fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";

// fetchGames mock 핸들 — mockResolvedValue/mockRejectedValue를 타입 안전하게 호출
const mockedFetchGames = fetchGames as unknown as ReturnType<typeof vi.fn>;

describe("searchModule 에러 처리 (Issue #14)", () => {
  // 각 테스트는 깨끗한 store + mock 카운터 + 측정값에서 시작
  beforeEach(() => {
    useStateStore.getState().resetAll();
    mockedFetchGames.mockReset();
    resetSearchDurationMeasurement();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) toApiError 정규화
  // ───────────────────────────────────────────────────────────────────────────
  describe("toApiError", () => {
    it("ExternalApiError는 message와 statusCode를 그대로 보존한다", () => {
      // 우리가 던진 표준 에러 — HTTP 상태가 의미 있으므로 보존되어야 함
      const error = new ExternalApiError("RAWG request failed", 503);
      expect(toApiError(error)).toEqual({
        message: "RAWG request failed",
        statusCode: 503,
      });
    });

    it("일반 Error는 메시지를 살리되 statusCode 0으로 정규화한다", () => {
      // 네트워크 끊김 등 — HTTP 의미가 없으므로 0
      const error = new Error("Network down");
      expect(toApiError(error)).toEqual({ message: "Network down", statusCode: 0 });
    });

    it("Error가 아닌 throw(문자열 등)는 기본 안내 문구로 대체한다", () => {
      // 신뢰할 메시지가 없으므로 사용자용 기본 문구 + statusCode 0
      expect(toApiError("boom")).toEqual({
        message: "알 수 없는 오류가 발생했습니다.",
        statusCode: 0,
      });
      // null/undefined 같은 falsy 값도 안전하게 처리
      expect(toApiError(undefined)).toEqual({
        message: "알 수 없는 오류가 발생했습니다.",
        statusCode: 0,
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 성공 흐름 — 결과 반환 + 에러 해제
  // ───────────────────────────────────────────────────────────────────────────
  describe("searchWithErrorHandling — 성공", () => {
    it("성공하면 결과를 반환하고 apiError를 null로 유지한다", async () => {
      const fakeResult = [{ id: "1", name: "Zelda", thumbnailUrl: "" }];
      mockedFetchGames.mockResolvedValueOnce(fakeResult);

      const result = await searchWithErrorHandling("zelda");

      // 결과는 그대로 통과, 에러 상태는 없어야 함
      expect(result).toEqual(fakeResult);
      expect(useStateStore.getState().apiError).toBeNull();
    });

    it("직전에 남아 있던 에러를 성공 시 해제한다", async () => {
      // 사전 조건 — 이전 검색이 실패해 에러가 남아 있는 상태를 모사
      useStateStore.getState().setApiError({ message: "old", statusCode: 500 });

      const fakeResult = [{ id: "2", name: "Mario", thumbnailUrl: "" }];
      mockedFetchGames.mockResolvedValueOnce(fakeResult);

      await searchWithErrorHandling("mario");

      // 성공 흐름이 clearApiError를 호출해 배너가 사라져야 함
      expect(useStateStore.getState().apiError).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 실패 흐름 — 빈 배열 + 상태 반영
  // ───────────────────────────────────────────────────────────────────────────
  describe("searchWithErrorHandling — 실패", () => {
    it("ExternalApiError 발생 시 빈 배열을 반환하고 에러를 상태에 반영한다", async () => {
      // console.warn은 NF-01 측정 경로에서 호출될 수 있으니 잡아둠
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "debug").mockImplementation(() => {});

      mockedFetchGames.mockRejectedValueOnce(
        new ExternalApiError("RAWG request failed", 503),
      );

      const result = await searchWithErrorHandling("zelda");

      // 호출자는 크래시 없이 빈 결과를 받는다 (#16 오류 상태 안정성)
      expect(result).toEqual([]);
      // 에러는 정규화돼 상태에 보존 — ErrorMessage(#15)가 구독
      expect(useStateStore.getState().apiError).toEqual({
        message: "RAWG request failed",
        statusCode: 503,
      });
    });

    it("실패 결과는 캐시에 저장되지 않는다", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "debug").mockImplementation(() => {});

      mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("boom", 500));

      await searchWithErrorHandling("zelda");

      // 실패한 검색어는 캐시 미스로 남아야 함 — 다음 시도에서 재호출 가능
      expect(useStateStore.getState().getCache("zelda")).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 실패 → 재시도 성공 시 복귀
  // ───────────────────────────────────────────────────────────────────────────
  describe("searchWithErrorHandling — 실패 후 복귀", () => {
    it("실패 후 같은 검색어 재시도가 성공하면 에러가 해제되고 결과가 반환된다", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "debug").mockImplementation(() => {});

      // 1차: 실패 → 에러 반영
      mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("temporary", 500));
      const firstResult = await searchWithErrorHandling("zelda");
      expect(firstResult).toEqual([]);
      expect(useStateStore.getState().apiError).not.toBeNull();

      // 2차: 성공 → 에러 해제 + 결과 반환 (캐시 미스 상태였으므로 fetchGames 재호출)
      const fakeResult = [{ id: "1", name: "Zelda", thumbnailUrl: "" }];
      mockedFetchGames.mockResolvedValueOnce(fakeResult);
      const secondResult = await searchWithErrorHandling("zelda");

      expect(secondResult).toEqual(fakeResult);
      expect(useStateStore.getState().apiError).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 동시 요청 레이스 가드 (PR #88 리뷰 반영)
  // ───────────────────────────────────────────────────────────────────────────
  describe("searchWithErrorHandling — 동시 요청 레이스 가드", () => {
    it("늦게 끝난 과거 요청의 실패가 나중 요청의 성공 상태를 덮어쓰지 않는다", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "debug").mockImplementation(() => {});

      // 요청 A: 수동으로 나중에 reject할 pending 프로미스 (느린 실패)
      let rejectA: (e: unknown) => void = () => {};
      mockedFetchGames.mockImplementationOnce(
        () => new Promise<never>((_, reject) => { rejectA = reject; }),
      );
      // 요청 B: 즉시 성공
      const okResult = [{ id: "1", name: "Zelda", thumbnailUrl: "" }];
      mockedFetchGames.mockResolvedValueOnce(okResult);

      // A 먼저 시작(requestId=N) — 아직 pending
      const pA = searchWithErrorHandling("a");
      // B 나중 시작(requestId=N+1, 최신) → 먼저 성공 완료 → clearApiError
      const resultB = await searchWithErrorHandling("b");
      expect(resultB).toEqual(okResult);
      expect(useStateStore.getState().apiError).toBeNull();

      // 이제 A가 뒤늦게 실패 — 하지만 A는 더 이상 최신이 아니므로 setApiError가 가드됨
      rejectA(new ExternalApiError("늦은 실패", 500));
      const resultA = await pA;
      expect(resultA).toEqual([]);

      // 최신 성공 상태(에러 없음)가 보존되어야 함 — 과거 실패에 덮이지 않음
      expect(useStateStore.getState().apiError).toBeNull();
    });
  });
});
