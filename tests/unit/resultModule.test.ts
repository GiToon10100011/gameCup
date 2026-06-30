// resultModule 단위 테스트 — Task #45 (F-13 전체 상태 초기화)
//
// 검증 범위:
//   1) startNewTournament — 후보 목록(candidates) 초기화
//   2) startNewTournament — 토너먼트 진행 상태(currentMatches·currentRound·winner) 초기화
//   3) startNewTournament — nextRoundQueue 초기화
//   4) startNewTournament — 로그인 세션(currentUser)은 유지
//   5) startNewTournament — 검색 캐시(searchCache) 초기화
//   6) getWinner — 우승자 반환 (winner 있을 때)
//   7) getWinner — null 반환 (winner 없을 때)

import { beforeEach, describe, expect, it } from "vitest";
import { useStateStore } from "@/store/stateStore";
import { getWinner, startNewTournament } from "@/modules/resultModule";
import type { IGame, IUser } from "@/types/game";

// 최소 팩토리
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });
const mkUser = (id: string): IUser => ({
  id,
  email: `${id}@test.com`,
  createdAt: "2026-06-30T00:00:00Z",
});

describe("resultModule (Task #45, F-13)", () => {
  beforeEach(() => {
    // 각 테스트 전 완전 초기화
    useStateStore.getState().resetAll();
    useStateStore.getState().clearActive();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) candidates 초기화
  // WHY: 재시작 시 이전 토너먼트 후보가 남아 있으면 새 토너먼트 시작 불가
  // ───────────────────────────────────────────────────────────────────────────
  it("startNewTournament 호출 후 candidates가 빈 배열로 초기화된다 (Task #45, F-13)", () => {
    // 후보 세팅
    useStateStore.getState().addCandidate(mkGame("A"));
    useStateStore.getState().addCandidate(mkGame("B"));
    expect(useStateStore.getState().candidates).toHaveLength(2);

    startNewTournament();

    expect(useStateStore.getState().candidates).toHaveLength(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 토너먼트 진행 상태 초기화 (currentMatches·currentRound·winner)
  // ───────────────────────────────────────────────────────────────────────────
  it("startNewTournament 호출 후 토너먼트 진행 상태가 모두 초기화된다 (Task #45, F-13)", () => {
    const game = mkGame("champ");
    // 진행 상태 세팅
    useStateStore.getState().setRoundState(2, [
      { gameA: game, gameB: mkGame("B"), winner: game, isBye: false },
    ]);
    useStateStore.getState().setWinner(game);

    startNewTournament();

    const state = useStateStore.getState();
    expect(state.currentRound).toBe(0);
    expect(state.currentMatches).toHaveLength(0);
    expect(state.winner).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) nextRoundQueue 초기화
  // ───────────────────────────────────────────────────────────────────────────
  it("startNewTournament 호출 후 nextRoundQueue가 초기화된다 (Task #45, F-13)", () => {
    // 큐에 데이터 적재
    useStateStore.getState().pushToNextRound(mkGame("q1"));
    useStateStore.getState().pushToNextRound(mkGame("q2"));
    expect(useStateStore.getState().nextRoundQueue).toHaveLength(2);

    startNewTournament();

    expect(useStateStore.getState().nextRoundQueue).toHaveLength(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) currentUser 보존 — 로그인 세션 유지 (F-13 원칙)
  // WHY: 새 토너먼트 시작은 플레이 데이터만 리셋, 인증 세션은 건드리지 않는다
  // ───────────────────────────────────────────────────────────────────────────
  it("startNewTournament 호출 후 currentUser(로그인 세션)는 유지된다 (Task #45, F-13)", () => {
    const user = mkUser("user-001");
    useStateStore.getState().setUser(user);
    expect(useStateStore.getState().currentUser).toEqual(user);

    startNewTournament();

    // 세션 보존 — 재로그인 불필요
    expect(useStateStore.getState().currentUser).toEqual(user);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 검색 캐시 초기화
  // WHY: 새 토너먼트에서 깨끗한 검색 세션 보장
  // ───────────────────────────────────────────────────────────────────────────
  it("startNewTournament 호출 후 searchCache가 비워진다 (Task #45, F-13)", () => {
    useStateStore.getState().setCache("zelda", [mkGame("1")]);
    expect(useStateStore.getState().getCache("zelda")).toBeDefined();

    startNewTournament();

    expect(useStateStore.getState().getCache("zelda")).toBeUndefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) getWinner — 우승자 반환
  // ───────────────────────────────────────────────────────────────────────────
  it("getWinner는 winner가 설정돼 있으면 해당 게임을 반환한다 (F-10)", () => {
    const champ = mkGame("champion");
    useStateStore.getState().setWinner(champ);

    expect(getWinner()).toEqual(champ);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) getWinner — null 반환 (토너먼트 진행 중)
  // ───────────────────────────────────────────────────────────────────────────
  it("getWinner는 winner가 없으면 null을 반환한다 (F-10)", () => {
    expect(getWinner()).toBeNull();
  });
});
