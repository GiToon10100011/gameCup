// 토너먼트 진행 비즈니스 로직.
// 시작 조건(F-06) · 1:1 선택(F-07) · 라운드 자동 진행(F-08) · 부전승 처리(F-09)을 담당.

import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournamentPair } from "@/types/game";
import { buildPairs } from "@/utils/buildPairs";
import { shuffle } from "@/utils/shuffle";
import { canStartTournament } from "@/modules/candidateModule";

/**
 * 토너먼트 시작 (F-06).
 * 후보가 2개 이상일 때만 첫 라운드를 구성하고,
 * 짝이 없는 마지막 후보(부전승)는 자동으로 다음 라운드 큐에 추가한다.
 */
export function startTournament(): void {
  // 1) 시작 조건 가드 — 후보 < 2개면 무시
  if (!canStartTournament()) return;

  // 2) 후보를 무작위 셔플 (Fisher-Yates) → 페어 구성
  const store = useStateStore.getState();
  const shuffled = shuffle(store.getCandidates());
  const matches = buildPairs(shuffled);

  // 3) 첫 라운드 상태 설정
  store.setRoundState(1, matches);

  // 4) 부전승 페어는 사용자 입력 없이 자동 진출 (F-09)
  // 변수명은 의미를 드러내도록 match로 명시 (PR #64 리뷰: 모호한 단문자 변수 지양)
  matches
    .filter((match) => match.isBye && match.winner)
    .forEach((match) => store.pushToNextRound(match.winner as IGame));
}

/**
 * 1:1 대결에서 한 게임을 승자로 선택 (F-07).
 * 잘못된 선택(페어 멤버가 아님)은 무시한다.
 */
export function selectWinner(pair: ITournamentPair, choice: IGame): void {
  // 1) 선택한 게임이 해당 페어의 멤버인지 확인 — 보안/무결성 가드
  const isMember = choice.id === pair.gameA.id || choice.id === pair.gameB?.id;
  if (!isMember) return;

  // 2) setRoundState를 호출하기 전에 현재 nextRoundQueue를 보존한다.
  //    setRoundState는 새 라운드 초기화(advanceRound)에서도 쓰이므로 내부에서
  //    nextRoundQueue를 [] 로 초기화한다. selectWinner는 같은 라운드 내에서
  //    winner만 갱신하는 동작이므로 기존 큐를 잃어서는 안 된다.
  //    버그 수정(#75): 이전 코드는 이 보존 없이 pushToNextRound → setRoundState
  //    순서로 호출해 방금 추가한 승자가 즉시 사라지는 버그가 있었다.
  const store = useStateStore.getState();
  const existingQueue = [...store.nextRoundQueue]; // 현재 큐 스냅샷 보존

  // 3) 현재 페어의 winner 필드를 갱신한 새 matches 배열을 만든다.
  //    map 콜백 매개변수도 match로 명시 (단문자 m 지양)
  const updated = store
    .getCurrentMatches()
    .map((match) => (match === pair ? { ...match, winner: choice } : match));

  // 4) setRoundState로 matches를 교체한다. 이 시점에 nextRoundQueue는 [] 가 된다.
  //    버그 수정(#75-라운드번호): 이전 코드는 candidates.length > 0 조건으로
  //    라운드 번호를 결정했으나, 후보 목록 크기와 현재 라운드는 무관하다.
  //    selectWinner는 라운드를 바꾸지 않으므로 항상 getCurrentRound()를 그대로 유지한다.
  store.setRoundState(getCurrentRound(), updated);

  // 5) 이전 큐를 복원한 다음 새 승자를 추가한다.
  //    라운드 내에서 여러 페어를 순서대로 선택할 때도 큐가 올바르게 누적된다.
  existingQueue.forEach((game) => store.pushToNextRound(game));
  store.pushToNextRound(choice);
}

/**
 * 다음 라운드 진행 (F-08).
 * - nextRoundQueue가 1개면 우승 확정 (F-10 트리거)
 * - 2개 이상이면 새 라운드를 구성하고 부전승은 자동 진출
 */
export function advanceRound(): void {
  const store = useStateStore.getState();
  const queue = readNextRoundQueue();

  // 1) 빈 큐는 비정상 — 아무 동작 안 함 (실제 흐름에선 발생 불가)
  if (queue.length === 0) return;

  // 2) 마지막 1명이 남았다면 우승 확정 → 결과 화면 전환 트리거
  if (queue.length === 1) {
    store.setWinner(queue[0]);
    return;
  }

  // 3) 2명 이상 — 셔플 후 다음 라운드 구성
  const shuffled = shuffle(queue);
  const matches = buildPairs(shuffled);
  store.setRoundState(getCurrentRound() + 1, matches);

  // 4) 부전승 자동 진출 — 매개변수는 match로 명시
  matches
    .filter((match) => match.isBye && match.winner)
    .forEach((match) => store.pushToNextRound(match.winner as IGame));
}

// 토너먼트가 끝났는지 (우승자 확정 여부) 조회. UI 화면 전환 가드로 사용.
export function isComplete(): boolean {
  return useStateStore.getState().getWinner() !== null;
}

// 내부 헬퍼: 현재 라운드 번호 조회
function getCurrentRound(): number {
  return useStateStore.getState().currentRound;
}

// 내부 헬퍼: 다음 라운드 큐 조회
function readNextRoundQueue(): IGame[] {
  return useStateStore.getState().nextRoundQueue;
}
