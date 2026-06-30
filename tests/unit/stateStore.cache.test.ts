// `stateStore.searchCache` (Map 기반)의 단위 테스트.
// Issue #12 — 세션 내 검색 결과 캐싱 로직 구현 (Map 기반).
//
// 검증 범위:
//   1) 초기 상태에서 getCache는 undefined를 반환
//   2) setCache로 저장한 결과를 getCache로 정확히 조회
//   3) 서로 다른 검색어는 독립적으로 캐싱 (격리)
//   4) setCache는 새 Map 인스턴스를 만들어 갱신 (React 리렌더 트리거)
//   5) 동일 검색어 재설정 시 이전 값을 덮어씀
//   6) resetAll 호출 시 캐시 전체 초기화 + 이후 setCache가 정상 동작
//
// stateStore는 외부 의존성 없는 메모리 store이므로 mock 없이 직접 호출한다.

import { beforeEach, describe, expect, it } from "vitest";
import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

// 테스트 헬퍼 — 최소 필드만 채운 IGame 배열 생성.
// 동일 패턴이 여러 테스트에 반복되어 mkGames로 모아둔다.
const mkGames = (prefix: string, n: number): IGame[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    name: `${prefix} Game ${i + 1}`,
    thumbnailUrl: "",
  }));

describe("stateStore.searchCache (Issue #12, Map 기반 세션 캐시)", () => {
  // 각 테스트는 깨끗한 store 상태에서 시작 — 이전 테스트의 캐시·후보가 새지 않도록 reset
  beforeEach(() => {
    useStateStore.getState().resetAll();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 초기 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("초기 상태에서 getCache는 undefined를 반환한다", () => {
    // 한 번도 setCache한 적 없는 검색어는 Map.get처럼 undefined
    expect(useStateStore.getState().getCache("zelda")).toBeUndefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 저장 → 조회 라운드트립
  // ───────────────────────────────────────────────────────────────────────────
  it("setCache로 저장한 결과를 getCache로 정확히 조회한다", () => {
    const games = mkGames("zelda", 3);
    useStateStore.getState().setCache("zelda", games);

    // 같은 검색어로 조회 시 저장한 배열을 그대로 반환
    expect(useStateStore.getState().getCache("zelda")).toEqual(games);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 검색어별 독립 캐시
  // ───────────────────────────────────────────────────────────────────────────
  it("서로 다른 검색어는 독립적으로 캐싱된다", () => {
    const zeldaGames = mkGames("zelda", 2);
    const marioGames = mkGames("mario", 3);
    const store = useStateStore.getState();

    // 두 검색어를 모두 캐시에 넣음
    store.setCache("zelda", zeldaGames);
    store.setCache("mario", marioGames);

    // 각 검색어가 자기 결과만 반환 — 서로의 캐시를 덮어쓰지 않음
    expect(store.getCache("zelda")).toEqual(zeldaGames);
    expect(store.getCache("mario")).toEqual(marioGames);
    // 등록한 적 없는 검색어는 여전히 undefined
    expect(store.getCache("sonic")).toBeUndefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 새 Map 인스턴스 갱신 (불변 업데이트)
  // ───────────────────────────────────────────────────────────────────────────
  it("setCache 호출 시 새 Map 인스턴스가 생성되어 참조가 바뀐다", () => {
    // 초기 Map 인스턴스를 캡처
    const initialMap = useStateStore.getState().searchCache;
    useStateStore.getState().setCache("zelda", mkGames("zelda", 1));

    // 갱신 후 Map 참조가 달라야 React/Zustand가 변경을 감지할 수 있다
    // (만약 같은 Map을 mutate하면 selector subscriber가 리렌더되지 않음)
    const updatedMap = useStateStore.getState().searchCache;
    expect(updatedMap).not.toBe(initialMap);
    // 그러나 데이터는 보존되어야 함
    expect(updatedMap.get("zelda")).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 동일 검색어 덮어쓰기
  // ───────────────────────────────────────────────────────────────────────────
  it("동일 검색어 재설정 시 이전 값을 덮어쓴다", () => {
    const first = mkGames("zelda", 2);
    const second = mkGames("zelda-updated", 5);
    const store = useStateStore.getState();

    store.setCache("zelda", first);
    store.setCache("zelda", second);

    // 가장 마지막 setCache의 결과만 남아야 함
    expect(store.getCache("zelda")).toEqual(second);
    expect(store.getCache("zelda")?.length).toBe(5);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) resetAll 후 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("resetAll 호출 후 캐시가 비워지고 새 Map으로 시작한다", () => {
    const store = useStateStore.getState();
    store.setCache("zelda", mkGames("zelda", 2));
    store.setCache("mario", mkGames("mario", 1));

    // 초기화 — F-13(새 토너먼트 시작) 흐름에서 호출됨
    store.resetAll();

    // 모든 캐시가 사라져야 함
    expect(useStateStore.getState().getCache("zelda")).toBeUndefined();
    expect(useStateStore.getState().getCache("mario")).toBeUndefined();

    // reset 직후에도 새 캐시를 정상적으로 저장할 수 있어야 함
    const freshGames = mkGames("sonic", 1);
    useStateStore.getState().setCache("sonic", freshGames);
    expect(useStateStore.getState().getCache("sonic")).toEqual(freshGames);
  });
});
