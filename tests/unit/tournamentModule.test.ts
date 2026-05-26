// 토너먼트 비즈니스 로직(시작·선택·라운드·부전승) 단위 테스트.
// Issue #75 — it.todo 5건을 실제 단언으로 구현.
//
// 검증 범위:
//   UT-06) selectWinner: nextRoundQueue 추가 + 페어 winner 갱신 + 잘못된 선택 무시
//   UT-07) advanceRound (2명 이상): 다음 라운드 bracket 구성 + currentRound 증가
//   UT-08) advanceRound (1명): 우승자 확정 + isComplete === true
//   F-06)  startTournament 가드: 후보 < 2개면 동작 안 함
//   F-09)  부전승: 홀수 후보 시 마지막 페어가 isBye + 자동 nextRoundQueue 진출
//
// 주의: Zustand는 불변 업데이트를 수행하므로, 상태를 읽을 때마다
//       useStateStore.getState()를 새로 호출해야 최신 snapshot을 얻는다.
//       beforeEach에서 캡처한 store 참조는 메서드(setRoundState 등) 호출에만 사용한다.

import { beforeEach, describe, expect, it } from "vitest";
import { useStateStore } from "@/store/stateStore";
import {
  advanceRound,
  isComplete,
  selectWinner,
  startTournament,
} from "@/modules/tournamentModule";
import type { IGame } from "@/types/game";

// 최소 IGame 팩토리 — id와 name만 채워 페어 멤버 검증에 사용
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

// 편의 헬퍼: 항상 최신 store snapshot에서 nextRoundQueue를 꺼낸다.
// 단순 변수 참조는 Zustand가 새 배열 인스턴스를 생성해도 old ref를 가리키기 때문에 stale해진다.
const getQueue = () => useStateStore.getState().nextRoundQueue;
const getMatches = () => useStateStore.getState().getCurrentMatches();

describe("tournamentModule (UT-06~08)", () => {
  // 각 테스트는 반드시 깨끗한 store에서 시작해야 이전 라운드 상태가 새지 않는다
  beforeEach(() => {
    useStateStore.getState().resetAll();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // UT-06: selectWinner — 승자 선택 동작 검증
  // ───────────────────────────────────────────────────────────────────────────
  describe("UT-06: selectWinner", () => {
    it("선택한 게임이 nextRoundQueue에 추가되고 해당 페어의 winner가 갱신된다", () => {
      // 후보 2개로 첫 라운드를 구성한다.
      // shuffle이 개입하므로 결과 집합·길이로만 검증한다.
      useStateStore.getState().addCandidate(mkGame("A"));
      useStateStore.getState().addCandidate(mkGame("B"));
      startTournament();

      // 후보 2개 → 페어 1개가 생성되어야 한다
      expect(getMatches()).toHaveLength(1);

      // selectWinner 호출 전 페어 참조를 캡처한다.
      // selectWinner 내부에서 setRoundState가 새 배열 인스턴스를 만들기 때문에,
      // 호출 전 캡처한 pair 객체는 여전히 원본 참조이며 === 비교에 사용된다.
      const pair = getMatches()[0];
      const chosen = pair.gameA;
      selectWinner(pair, chosen);

      // 1) nextRoundQueue에 선택한 게임이 추가되어야 한다
      //    getQueue()로 최신 snapshot을 읽어야 갱신된 값이 보인다
      expect(getQueue()).toHaveLength(1);
      expect(getQueue()[0].id).toBe(chosen.id);

      // 2) 현재 매치의 해당 페어의 winner가 선택한 게임으로 갱신되어야 한다
      //    getMatches()로 최신 snapshot을 읽어야 갱신된 값이 보인다
      const updatedPair = getMatches().find((m) => m.gameA.id === pair.gameA.id);
      expect(updatedPair?.winner?.id).toBe(chosen.id);
    });

    it("페어 멤버가 아닌 게임을 선택하면 아무 변화도 없다 (보안·무결성 가드)", () => {
      // 잘못된 choice가 들어왔을 때 store가 오염되지 않아야 한다
      useStateStore.getState().addCandidate(mkGame("A"));
      useStateStore.getState().addCandidate(mkGame("B"));
      startTournament();

      const pair = getMatches()[0];

      // 페어와 무관한 게임을 선택
      const outsider = mkGame("OUTSIDER");
      selectWinner(pair, outsider);

      // nextRoundQueue에 아무것도 추가되지 않아야 한다
      expect(getQueue()).toHaveLength(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // UT-07: advanceRound — nextRoundQueue ≥ 2일 때 다음 라운드 구성
  // ───────────────────────────────────────────────────────────────────────────
  it("UT-07: nextRoundQueue가 2개 이상이면 advanceRound가 다음 라운드 bracket을 구성한다", () => {
    // 후보 4개로 첫 라운드(2페어)를 구성하고 모든 selectWinner를 완료한다.
    // shuffle 때문에 페어링 순서는 예측 불가이므로 각 페어의 gameA를 승자로 고른다.
    ["A", "B", "C", "D"].forEach((id) =>
      useStateStore.getState().addCandidate(mkGame(id))
    );
    startTournament();

    // 라운드 1에서 모든 페어를 선택 완료한다
    const round1Matches = getMatches();
    expect(round1Matches).toHaveLength(2);

    // 각 페어마다 gameA를 승자로 선택 (shuffle이 바꾼 순서와 무관하게 gameA는 항상 유효한 멤버)
    // getMatches()를 호출하지 않고 round1Matches 참조를 반복하는 이유:
    // 페어 객체는 selectWinner 내부에서 === 비교에 사용되므로 startTournament 이후 배열과 같아야 한다
    round1Matches.forEach((pair) => selectWinner(pair, pair.gameA));

    // 이 시점에 nextRoundQueue에 2개가 쌓여 있어야 한다
    expect(getQueue()).toHaveLength(2);

    const prevRound = useStateStore.getState().currentRound;
    advanceRound();

    // 1) currentRound가 1 증가해야 한다
    expect(useStateStore.getState().currentRound).toBe(prevRound + 1);

    // 2) 새 라운드의 매치가 buildPairs 결과와 같아야 한다 (2명 → 1페어)
    expect(getMatches()).toHaveLength(1);

    // 3) nextRoundQueue는 새 라운드 시작 시 비워진다 (setRoundState 동작)
    expect(getQueue()).toHaveLength(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // UT-08: advanceRound — nextRoundQueue === 1이면 우승 확정
  // ───────────────────────────────────────────────────────────────────────────
  it("UT-08: nextRoundQueue가 1개면 advanceRound가 winner를 확정하고 isComplete가 true가 된다", () => {
    // 후보 2개로 1라운드를 치르면 nextRoundQueue에 1개만 남는다
    useStateStore.getState().addCandidate(mkGame("A"));
    useStateStore.getState().addCandidate(mkGame("B"));
    startTournament();

    const pair = getMatches()[0];
    const champion = pair.gameA;
    selectWinner(pair, champion);

    // nextRoundQueue에 1개 확인
    expect(getQueue()).toHaveLength(1);

    // 토너먼트 완료 전에는 isComplete가 false여야 한다
    expect(isComplete()).toBe(false);

    advanceRound();

    // 1) getWinner()가 선택한 게임으로 확정되어야 한다
    expect(useStateStore.getState().getWinner()?.id).toBe(champion.id);

    // 2) isComplete()가 true가 되어야 한다 (UI 화면 전환 트리거)
    expect(isComplete()).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // F-06: startTournament 가드 — 후보 < 2개면 동작 안 함
  // ───────────────────────────────────────────────────────────────────────────
  it("startTournament는 후보가 2개 미만이면 동작하지 않는다 (F-06)", () => {
    // 후보가 없을 때
    startTournament();
    expect(getMatches()).toHaveLength(0);
    // currentRound가 초기값(0)에서 변경되지 않아야 한다
    expect(useStateStore.getState().currentRound).toBe(0);

    // 후보 1개만 있을 때도 동일하게 차단
    useStateStore.getState().addCandidate(mkGame("ONLY"));
    startTournament();
    expect(getMatches()).toHaveLength(0);
    expect(useStateStore.getState().currentRound).toBe(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // F-09: 부전승 — 홀수 후보 시 마지막 페어 자동 진출
  // ───────────────────────────────────────────────────────────────────────────
  it("홀수 후보 시 마지막 게임이 부전승으로 자동 다음 라운드 진출한다 (F-09)", () => {
    // 후보 3개(홀수) → 페어 2개 (1 정상 대결 + 1 부전승)
    // shuffle 때문에 어떤 게임이 부전승이 될지 예측 불가이므로, isBye 페어 존재 여부로 검증한다
    useStateStore.getState().addCandidate(mkGame("X"));
    useStateStore.getState().addCandidate(mkGame("Y"));
    useStateStore.getState().addCandidate(mkGame("Z"));
    startTournament();

    const matches = getMatches();
    // 3명 → buildPairs가 페어 2개를 만든다 (1 정상 + 1 부전승)
    expect(matches).toHaveLength(2);

    // isBye 페어가 정확히 1개 존재해야 한다
    const byePairs = matches.filter((m) => m.isBye);
    expect(byePairs).toHaveLength(1);

    const byePair = byePairs[0];

    // 1) 부전승 페어의 gameB는 null이어야 한다
    expect(byePair.gameB).toBeNull();

    // 2) 부전승 페어의 winner는 gameA로 자동 설정되어야 한다
    expect(byePair.winner?.id).toBe(byePair.gameA.id);

    // 3) startTournament 직후 nextRoundQueue에 부전승 게임이 자동으로 들어가야 한다.
    //    사용자 입력 없이 다음 라운드 큐에 합류한다는 것이 F-09의 핵심이다.
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0].id).toBe(byePair.gameA.id);
  });
});
