// stateStore의 TournamentLibrarySlice 단위 테스트.
// Task #119 — myTournaments 목록 캐시 + activeTournament 상태 관리
//
// 검증 범위:
//   1) 초기 상태: myTournaments [], activeTournament null
//   2) setList: ITournament[] 저장 후 getList()로 조회
//   3) setList: 빈 배열로 목록 비우기
//   4) setActive: ITournament 설정 후 getActive()로 조회
//   5) clearActive: 활성 토너먼트 해제 → null
//   6) resetAll: myTournaments·activeTournament 모두 보존된다
//   7) setList 후 setActive → 두 슬롯 독립적으로 동작

import { beforeEach, describe, expect, it } from "vitest";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament } from "@/types/game";

// 테스트용 팩토리
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });
const mkTournament = (id: string, name = `Tournament ${id}`): ITournament => ({
  id,
  name,
  ownerId: "user-001",
  candidates: [mkGame("g1"), mkGame("g2")],
  createdAt: "2026-06-27T00:00:00.000Z",
});

describe("stateStore — TournamentLibrarySlice (Task #119)", () => {
  beforeEach(() => {
    // 각 테스트 전 store를 깨끗한 초기 상태로 되돌린다
    useStateStore.getState().resetAll();
    useStateStore.setState({ myTournaments: [], activeTournament: null });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 초기 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("초기 상태: myTournaments는 빈 배열, activeTournament는 null이다", () => {
    expect(useStateStore.getState().myTournaments).toEqual([]);
    expect(useStateStore.getState().activeTournament).toBeNull();
    expect(useStateStore.getState().getList()).toEqual([]);
    expect(useStateStore.getState().getActive()).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) setList → getList 조회
  // ───────────────────────────────────────────────────────────────────────────
  it("setList: ITournament[] 저장 후 getList()로 동일한 목록이 반환된다", () => {
    const list = [mkTournament("t1"), mkTournament("t2"), mkTournament("t3")];

    useStateStore.getState().setList(list);

    expect(useStateStore.getState().getList()).toEqual(list);
    expect(useStateStore.getState().myTournaments).toEqual(list);
    expect(useStateStore.getState().getList()).toHaveLength(3);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) setList 빈 배열 → 목록 비우기
  // ───────────────────────────────────────────────────────────────────────────
  it("setList: 빈 배열로 호출하면 목록이 비워진다", () => {
    // 먼저 목록을 채운다
    useStateStore.getState().setList([mkTournament("t1")]);
    expect(useStateStore.getState().getList()).toHaveLength(1);

    // 빈 배열로 덮어쓰기
    useStateStore.getState().setList([]);

    expect(useStateStore.getState().getList()).toEqual([]);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) setActive → getActive 조회
  // ───────────────────────────────────────────────────────────────────────────
  it("setActive: ITournament 설정 후 getActive()로 동일한 토너먼트가 반환된다", () => {
    const tournament = mkTournament("t1", "내 첫 토너먼트");

    useStateStore.getState().setActive(tournament);

    expect(useStateStore.getState().getActive()).toEqual(tournament);
    expect(useStateStore.getState().activeTournament).toEqual(tournament);
    expect(useStateStore.getState().getActive()?.id).toBe("t1");
    expect(useStateStore.getState().getActive()?.name).toBe("내 첫 토너먼트");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) clearActive → null
  // ───────────────────────────────────────────────────────────────────────────
  it("clearActive: 호출 후 getActive()가 null을 반환한다", () => {
    // 먼저 활성 토너먼트를 설정한다
    useStateStore.getState().setActive(mkTournament("t1"));
    expect(useStateStore.getState().getActive()).not.toBeNull();

    // 허브로 돌아오거나 삭제 후 해제
    useStateStore.getState().clearActive();

    expect(useStateStore.getState().getActive()).toBeNull();
    expect(useStateStore.getState().activeTournament).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) resetAll: myTournaments·activeTournament 보존
  // ───────────────────────────────────────────────────────────────────────────
  it("resetAll: myTournaments·activeTournament는 초기화되지 않고 보존된다", () => {
    const list = [mkTournament("t1"), mkTournament("t2")];
    const active = mkTournament("t1");

    useStateStore.getState().setList(list);
    useStateStore.getState().setActive(active);

    // 새 토너먼트 플레이 시작 (플레이 데이터 리셋)
    useStateStore.getState().resetAll();

    // 라이브러리 상태는 플레이 데이터와 독립적으로 보존돼야 한다
    expect(useStateStore.getState().getList()).toEqual(list);
    expect(useStateStore.getState().getActive()).toEqual(active);

    // 플레이 데이터는 초기화됐는지 확인
    expect(useStateStore.getState().candidates).toHaveLength(0);
    expect(useStateStore.getState().currentRound).toBe(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) setList + setActive 독립 동작
  // ───────────────────────────────────────────────────────────────────────────
  it("setList와 setActive는 서로 독립적으로 동작한다", () => {
    const list = [mkTournament("t1"), mkTournament("t2")];
    const active = mkTournament("t2");

    useStateStore.getState().setList(list);
    useStateStore.getState().setActive(active);

    // 목록과 활성 각각 독립 검증
    expect(useStateStore.getState().getList()).toHaveLength(2);
    expect(useStateStore.getState().getActive()?.id).toBe("t2");

    // 목록만 업데이트해도 active는 바뀌지 않는다
    useStateStore.getState().setList([mkTournament("t3")]);
    expect(useStateStore.getState().getActive()?.id).toBe("t2");
    expect(useStateStore.getState().getList()).toHaveLength(1);
  });
});
