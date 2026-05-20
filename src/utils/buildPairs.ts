// 토너먼트 라운드용 페어(1:1 대결 쌍) 구성 유틸.
// 후보가 홀수일 때 마지막 한 명은 자동 부전승 처리한다 (F-09).

import type { IGame, ITournamentPair } from "@/types/game";

/**
 * 게임 배열을 두 개씩 묶어 ITournamentPair[]를 생성한다.
 * - 홀수일 경우 마지막 페어는 `gameB=null`, `isBye=true`, `winner=gameA`
 * - 입력은 readonly로 받아 호출자 측의 의도치 않은 변형을 방지
 */
export function buildPairs(games: readonly IGame[]): ITournamentPair[] {
  const pairs: ITournamentPair[] = [];

  // 2칸씩 점프하며 두 게임을 한 쌍으로 묶는다
  for (let i = 0; i < games.length; i += 2) {
    const gameA = games[i];
    const gameB = games[i + 1] ?? null;
    const isBye = gameB === null;

    // 부전승이면 gameA가 자동 winner, 아니면 사용자 선택 전이므로 winner=null
    pairs.push({
      gameA,
      gameB,
      winner: isBye ? gameA : null,
      isBye,
    });
  }

  return pairs;
}
