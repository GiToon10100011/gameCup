// 결과 화면 비즈니스 로직 — 우승자 조회 + 새 토너먼트 시작 (F-10, F-13).
// 동작 자체는 stateStore 위임이라 매우 가볍다. View는 본 모듈만 호출.

import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

// 최종 우승자 조회 (F-10) — null이면 토너먼트가 아직 끝나지 않은 상태
export function getWinner(): IGame | null {
  return useStateStore.getState().getWinner();
}

// 새 토너먼트 시작 (F-13) — 후보·진행 상태·우승자를 모두 초기화한 뒤
// 사용자를 검색 화면으로 돌려보낸다. 검색 캐시도 같이 비워서 깨끗한 세션을 보장.
export function startNewTournament(): void {
  useStateStore.getState().resetAll();
}
