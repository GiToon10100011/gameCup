// 후보 등록/삭제/시작 조건 검증을 담당하는 비즈니스 로직.
// View는 본 모듈만 호출하고 stateStore에 직접 접근하지 않는다.

import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

// 후보 등록 결과 — discriminated union 형태로 성공/실패를 명확히 구분.
// `type` alias이므로 `I` 접두사 규칙에서 제외.
export type AddCandidateResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" };

/**
 * 후보 풀에 게임 추가 (F-03).
 * - 중복(F-04)이면 `{ ok: false, reason: "duplicate" }`를 반환해 UI가 토스트를 띄울 수 있게 함
 * - stateStore의 addCandidate는 boolean을 반환하므로 한 단계 위 결과 객체로 감싼다
 */
export function addToPool(game: IGame): AddCandidateResult {
  const added = useStateStore.getState().addCandidate(game);
  return added ? { ok: true } : { ok: false, reason: "duplicate" };
}

// 후보 삭제 (F-05). 단순 위임 메서드라 별도 검증은 stateStore에서 처리.
export function removeFromPool(gameId: string): void {
  useStateStore.getState().removeCandidate(gameId);
}

// 토너먼트 시작 가능 조건 (F-06): 후보가 2개 이상이어야 함.
// UI는 이 값으로 시작 버튼 활성화 여부를 결정한다.
export function canStartTournament(): boolean {
  return useStateStore.getState().getCandidates().length >= 2;
}
