// 토너먼트 비즈니스 로직(시작·선택·라운드·부전승) 단위 테스트.
// 현재는 명세만 todo로 잡아두고, 실제 구현은 Story #23~#26 작업 시 채운다.

import { describe, it } from "vitest";

describe("tournamentModule (UT-06~08)", () => {
  // selectWinner: 다음 라운드 큐 추가 + 페어 winner 갱신
  it.todo("UT-06: selectWinner 호출 시 nextRoundQueue에 추가되고 페어 winner가 갱신된다");

  // advanceRound: 2명 이상 남으면 새 라운드 구성
  it.todo("UT-07: nextRoundQueue가 2개 이상이면 advanceRound가 다음 라운드 bracket을 구성한다");

  // advanceRound: 1명만 남으면 우승 확정
  it.todo("UT-08: nextRoundQueue가 1개면 advanceRound가 winner를 확정한다");

  // startTournament: 후보 < 2 → 시작 차단 (F-06)
  it.todo("startTournament는 후보가 2개 미만이면 동작하지 않는다 (F-06)");

  // 부전승 처리 — 홀수일 때 마지막 게임이 자동 진출 (F-09)
  it.todo("홀수 후보 시 마지막 게임이 부전승으로 자동 다음 라운드 진출한다 (F-09)");
});
