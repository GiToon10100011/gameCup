// getRoundName — 라운드 참가자 수 기반 라운드 명칭 계산 유틸 (Task #36, F-07).
//
// 한국 토너먼트 관례:
//   - 2명  → "결승"
//   - 4명  → "4강"  (준결승)
//   - n명  → "${n}강"
//   - 0 이하 또는 1명 → "" (비정상 값, 토너먼트 구조상 발생 불가)

/**
 * 현재 라운드에 참가하는 플레이어(게임) 수를 받아 라운드 명칭을 반환한다.
 * @param playerCount 라운드에 참가하는 게임 수 (부전승 포함 전체 참가자 수)
 */
export function getRoundName(playerCount: number): string {
  // 비정상 입력 방어 — 토너먼트 구조상 2 미만은 발생하지 않는다
  if (playerCount <= 1) return "";
  // 결승: 2명이 남은 최종 대결
  if (playerCount === 2) return "결승";
  // 그 외: N강 형식 (예: 4강, 8강, 16강)
  return `${playerCount}강`;
}
