// 검색 비즈니스 로직(`modules/searchModule.ts`)의 단위 테스트.
// Issue #11 — 외부 API 호출 함수(fetchGames) + 비즈니스 진입점(search) 동작 검증.
//
// 검증 범위:
//   1) validateQuery: 공백·빈 문자열은 false, 의미 있는 검색어는 true
//   2) search: 빈/공백 검색어는 외부 호출 없이 [] 반환 (F-12)
//   3) search: 캐시 적중 시 외부 호출 없이 캐시 결과 반환 (NF-05)
//   4) search: 캐시 미스 시 fetchGames 호출 + 결과를 캐시에 저장
//
// 외부 API 호출은 `vi.mock`으로 `@/lib/externalApiClient`의 fetchGames를 가짜 함수로 대체.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// fetchGames를 모듈 단위로 mock. 각 테스트에서 mockImplementation으로 시나리오를 바꾼다.
vi.mock("@/lib/externalApiClient", () => ({
  fetchGames: vi.fn(),
}));

// 위 mock 이후에 import해야 mock된 함수가 주입된다.
import {
  search,
  validateQuery,
  getLastSearchDurationMs,
  resetSearchDurationMeasurement,
  SEARCH_RESPONSE_TIME_BUDGET_MS,
} from "@/modules/searchModule";
import { fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";

// fetchGames의 mock 핸들 — 타입을 vi.MockedFunction으로 강제해 mockResolvedValue를 안전하게 호출.
const mockedFetchGames = fetchGames as unknown as ReturnType<typeof vi.fn>;

describe("searchModule (Issue #11)", () => {
  // 각 테스트는 깨끗한 store + mock 카운터에서 시작
  beforeEach(() => {
    // Zustand store 초기화 — 이전 테스트의 캐시가 새지 않도록 resetAll로 비움
    useStateStore.getState().resetAll();
    // mock 함수의 호출 기록·구현 초기화
    mockedFetchGames.mockReset();
    // 응답 시간 측정값도 격리 — 이전 테스트의 측정이 새지 않도록
    resetSearchDurationMeasurement();
  });

  afterEach(() => {
    // 다음 테스트의 mock에 영향이 가지 않도록 정리
    vi.clearAllMocks();
    // performance.now mock도 함께 해제
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) validateQuery
  // ───────────────────────────────────────────────────────────────────────────
  describe("validateQuery", () => {
    it("빈 문자열은 false를 반환한다", () => {
      expect(validateQuery("")).toBe(false);
    });

    it("공백만 있는 문자열은 false를 반환한다", () => {
      expect(validateQuery("   ")).toBe(false);
    });

    it("의미 있는 검색어는 true를 반환한다", () => {
      expect(validateQuery("zelda")).toBe(true);
      // 앞뒤 공백이 있어도 내부에 글자가 있으면 true (trim 기준 비교)
      expect(validateQuery("  zelda  ")).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 빈 검색어 차단
  // ───────────────────────────────────────────────────────────────────────────
  describe("search — 빈 검색어 차단 (F-12)", () => {
    it("빈 문자열이면 외부 API를 호출하지 않고 []를 반환한다", async () => {
      const result = await search("");
      // mock fetchGames가 한 번도 호출되지 않아야 함
      expect(mockedFetchGames).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("공백만 있는 검색어도 빈 결과로 즉시 반환한다", async () => {
      const result = await search("   ");
      expect(mockedFetchGames).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 캐시 적중 시 외부 호출 없음 (NF-05)
  // ───────────────────────────────────────────────────────────────────────────
  describe("search — 캐시 적중 (NF-05)", () => {
    it("동일 검색어가 캐시에 있으면 외부 호출 없이 캐시 결과를 반환한다", async () => {
      // 캐시 사전 주입 — 첫 호출 전에 미리 저장해둠
      const cachedGames = [
        { id: "1", name: "Cached Game", thumbnailUrl: "https://media.rawg.io/c.jpg" },
      ];
      useStateStore.getState().setCache("zelda", cachedGames);

      const result = await search("zelda");

      // 캐시 결과가 그대로 반환되어야 함
      expect(result).toEqual(cachedGames);
      // 외부 fetchGames는 호출되지 않아야 함 (NF-05 핵심)
      expect(mockedFetchGames).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 캐시 미스 → 외부 호출 + 캐시 저장
  // ───────────────────────────────────────────────────────────────────────────
  describe("search — 캐시 미스", () => {
    it("캐시에 없으면 fetchGames를 호출하고 결과를 캐시에 저장한다", async () => {
      const fakeResult = [
        { id: "10", name: "Zelda BOTW", thumbnailUrl: "https://media.rawg.io/z.jpg" },
      ];
      // 1회 호출에서 fakeResult를 돌려주도록 설정
      mockedFetchGames.mockResolvedValueOnce(fakeResult);

      const result = await search("zelda");

      // 결과 검증 — 반환 값이 mock과 동일
      expect(result).toEqual(fakeResult);
      // fetchGames가 정확한 검색어로 한 번 호출됨
      expect(mockedFetchGames).toHaveBeenCalledTimes(1);
      expect(mockedFetchGames).toHaveBeenCalledWith("zelda");
      // 결과가 캐시에 저장되어야 함 — 다음 호출 시 외부 호출 없이 재사용
      expect(useStateStore.getState().getCache("zelda")).toEqual(fakeResult);
    });

    it("같은 검색어로 두 번째 호출 시 외부 API를 다시 부르지 않는다", async () => {
      const fakeResult = [
        { id: "10", name: "Zelda BOTW", thumbnailUrl: "https://media.rawg.io/z.jpg" },
      ];
      mockedFetchGames.mockResolvedValueOnce(fakeResult);

      // 첫 호출 — 캐시 미스, fetch 1회
      await search("zelda");
      // 두 번째 호출 — 캐시 적중, fetch 추가 호출 없음
      const secondResult = await search("zelda");

      expect(secondResult).toEqual(fakeResult);
      expect(mockedFetchGames).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 응답 시간 측정 (Issue #13, NF-01)
  // ───────────────────────────────────────────────────────────────────────────
  describe("search — 응답 시간 측정 (Issue #13, NF-01)", () => {
    it("NF-01 임계치는 1000ms로 정의되어 있다", () => {
      // 매직 넘버 회귀 방지 — 임계치 상수가 의도된 값과 일치하는지 보증
      expect(SEARCH_RESPONSE_TIME_BUDGET_MS).toBe(1000);
    });

    it("초기 상태에서 getLastSearchDurationMs는 null이다", () => {
      // 한 번도 search 호출 안 했거나 reset 직후 — 측정값이 없어야 함
      expect(getLastSearchDurationMs()).toBeNull();
    });

    it("캐시 미스 시 응답 시간이 기록된다 (NF-01 내 시나리오)", async () => {
      // performance.now를 가짜로 — 시작 100, 종료 350 → 측정값 250ms (1초 미만, NF-01 충족)
      let nowCallCount = 0;
      vi.spyOn(performance, "now").mockImplementation(() => {
        nowCallCount += 1;
        return nowCallCount === 1 ? 100 : 350;
      });

      mockedFetchGames.mockResolvedValueOnce([
        { id: "1", name: "G", thumbnailUrl: "" },
      ]);

      await search("zelda");

      // 측정값이 임계치 이내이고 정확히 250ms로 기록
      const duration = getLastSearchDurationMs();
      expect(duration).not.toBeNull();
      expect(duration).toBe(250);
      expect(duration!).toBeLessThan(SEARCH_RESPONSE_TIME_BUDGET_MS);
    });

    it("응답 시간이 1초를 초과하면 NF-01 위반 경고를 출력한다", async () => {
      // performance.now — 시작 0, 종료 1500 → 측정값 1500ms (NF-01 임계 초과)
      let nowCallCount = 0;
      vi.spyOn(performance, "now").mockImplementation(() => {
        nowCallCount += 1;
        return nowCallCount === 1 ? 0 : 1500;
      });

      // console.warn을 spy로 잡아 호출 여부·메시지 검증
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockedFetchGames.mockResolvedValueOnce([]);
      await search("zelda");

      // 임계치 초과 — 측정값 보존 + 경고 호출 + 메시지에 측정값 포함
      expect(getLastSearchDurationMs()).toBe(1500);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain("NF-01 위반");
      expect(warnSpy.mock.calls[0][0]).toContain("1500");
    });

    it("캐시 적중 시는 측정이 일어나지 않는다 (외부 호출 없음)", async () => {
      // 사전 캐시 주입
      useStateStore.getState().setCache("zelda", [
        { id: "1", name: "Cached", thumbnailUrl: "" },
      ]);
      // measureAsync가 호출됐는지 확인하기 위해 performance.now spy 등록
      const nowSpy = vi.spyOn(performance, "now");

      await search("zelda");

      // 캐시 적중 분기는 measureAsync를 거치지 않으므로 performance.now가 호출되지 않아야 함
      expect(nowSpy).not.toHaveBeenCalled();
      // 측정값도 여전히 초기 null 상태
      expect(getLastSearchDurationMs()).toBeNull();
    });

    it("fetchGames가 실패해도 응답 시간은 기록된다 (타임아웃 진단)", async () => {
      let nowCallCount = 0;
      vi.spyOn(performance, "now").mockImplementation(() => {
        nowCallCount += 1;
        return nowCallCount === 1 ? 200 : 800;
      });
      // console.warn은 비-임계 케이스이므로 호출되지 않지만 spy는 등록해 둠
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const boom = new Error("RAWG down");
      mockedFetchGames.mockRejectedValueOnce(boom);

      // 검색이 실패해도 측정값은 보존되어야 함 — 호출자가 진단할 수 있도록
      await expect(search("zelda")).rejects.toBe(boom);

      // 600ms로 정확히 기록 + 임계치 미만
      expect(getLastSearchDurationMs()).toBe(600);
    });
  });
});
