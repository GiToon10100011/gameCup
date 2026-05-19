import { describe, it } from "vitest";

describe("tournamentModule (UT-06~08)", () => {
  it.todo("UT-06: selectWinner 호출 시 nextRoundQueue에 추가되고 페어 winner가 갱신된다");
  it.todo("UT-07: nextRoundQueue가 2개 이상이면 advanceRound가 다음 라운드 bracket을 구성한다");
  it.todo("UT-08: nextRoundQueue가 1개면 advanceRound가 winner를 확정한다");
  it.todo("startTournament는 후보가 2개 미만이면 동작하지 않는다 (F-06)");
  it.todo("홀수 후보 시 마지막 게임이 부전승으로 자동 다음 라운드 진출한다 (F-09)");
});
