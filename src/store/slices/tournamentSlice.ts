// tournamentSlice — 토너먼트 플레이 진행 상태 (NF-04 분리, Story #48)
//
// 담당 도메인: 토너먼트 라운드 진행
//   - currentRound: 현재 라운드 번호
//   - currentMatches: 현재 라운드의 1:1 대결 목록
//   - nextRoundQueue: 다음 라운드 진출 확정 게임 큐 (선택 + 부전승)
//   - winner: 최종 우승자 (null이면 진행 중)
//
// 확장 가이드: 향후 "중간 저장/복원", "토너먼트 통계" 등 플레이 관련 기능은 이 슬라이스에 추가한다.

import type { IGame, ITournamentPair } from "@/types/game";

// 슬라이스 상태 타입
export interface ITournamentState {
  currentRound: number;
  currentMatches: ITournamentPair[];
  nextRoundQueue: IGame[];
  winner: IGame | null;
}

// 슬라이스 액션 타입
export interface ITournamentActions {
  getCurrentMatches: () => ITournamentPair[];
  setRoundState: (round: number, matches: ITournamentPair[]) => void;
  pushToNextRound: (game: IGame) => void;
  setWinner: (game: IGame) => void;
  getWinner: () => IGame | null;
}

export type ITournamentSlice = ITournamentState & ITournamentActions;

// 슬라이스 초기 상태 — resetAll()에서 spread해 사용
export const tournamentInitialState: ITournamentState = {
  currentRound: 0,
  currentMatches: [],
  nextRoundQueue: [],
  winner: null,
};

// WHY: Zustand 슬라이스 패턴 — 전체 스토어 타입 순환 의존 방지, any 사용
export const createTournamentSlice = (set: any, get: any): ITournamentSlice => ({
  ...tournamentInitialState,

  // 현재 라운드 대결 목록 조회
  getCurrentMatches: () => get().currentMatches,

  // 새 라운드 시작 — 현재 라운드/매치를 교체하고 다음 라운드 큐는 비움
  setRoundState: (round, matches) =>
    set(() => ({ currentRound: round, currentMatches: matches, nextRoundQueue: [] })),

  // 한 페어의 승자를 다음 라운드 큐에 추가
  pushToNextRound: (game) =>
    set((state: ITournamentState) => ({ nextRoundQueue: [...state.nextRoundQueue, game] })),

  // 최종 우승자 확정 (F-10 결과 화면 트리거)
  setWinner: (game) => set(() => ({ winner: game })),

  // 최종 우승자 조회
  getWinner: () => get().winner,
});
