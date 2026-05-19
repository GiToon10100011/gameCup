// Zustand 기반 단일 메모리 스토어.
// UML v1.1 §StateStore 클래스와 1:1 매핑되며, 검색 캐시 + 후보 + 토너먼트 진행 + 결과 상태를 모두 보관한다.

import { create } from "zustand";
import type { IGame, ITournamentPair } from "@/types/game";

// 스토어가 보관하는 순수 상태 필드 (data).
// 액션과 분리해 정의해야 `initialState` 객체로 reset 시 액션이 섞이지 않는다.
interface IStateStoreState {
  // 검색어 → 정규화된 게임 배열. 동일 검색어 재호출을 막아 NF-05 충족.
  searchCache: Map<string, IGame[]>;
  // 사용자가 등록한 후보 게임 목록
  candidates: IGame[];
  // 현재 진행 중인 라운드 번호 (1부터 시작)
  currentRound: number;
  // 현재 라운드의 1:1 대결 목록
  currentMatches: ITournamentPair[];
  // 다음 라운드로 진출 확정된 게임 큐 (선택 + 부전승 둘 다 포함)
  nextRoundQueue: IGame[];
  // 최종 우승자. null이면 아직 토너먼트가 끝나지 않았다는 의미.
  winner: IGame | null;
}

// 스토어의 동작(actions) 시그니처.
// UML v1.1 메서드와 동일한 이름을 유지해 설계서-코드 정합성을 보장한다.
interface IStateStoreActions {
  getCache: (query: string) => IGame[] | undefined;
  setCache: (query: string, results: IGame[]) => void;
  getCandidates: () => IGame[];
  addCandidate: (game: IGame) => boolean;
  removeCandidate: (gameId: string) => void;
  getCurrentMatches: () => ITournamentPair[];
  setRoundState: (round: number, matches: ITournamentPair[]) => void;
  pushToNextRound: (game: IGame) => void;
  setWinner: (game: IGame) => void;
  getWinner: () => IGame | null;
  resetAll: () => void;
}

// 초기 상태 — `resetAll`에서도 동일 객체를 spread해서 깔끔하게 초기화한다.
// 단, `searchCache`만은 새 Map 인스턴스를 만들어줘야 이전 캐시가 새지 않는다.
const initialState: IStateStoreState = {
  searchCache: new Map(),
  candidates: [],
  currentRound: 0,
  currentMatches: [],
  nextRoundQueue: [],
  winner: null,
};

// 실제 스토어 인스턴스 — 컴포넌트에서 `useStateStore()` 훅으로,
// 모듈/유틸에서는 `useStateStore.getState()`로 접근한다.
export const useStateStore = create<IStateStoreState & IStateStoreActions>((set, get) => ({
  // 1) 초기 상태 펼치기
  ...initialState,

  // 2) 검색 캐시 조회 (NF-05): 동일 검색어가 들어오면 API 호출 없이 캐시 결과를 반환
  getCache: (query) => get().searchCache.get(query),

  // 3) 검색 캐시 저장. Map은 참조 타입이라 새 Map을 만들어 setState로 갱신해야 React가 변경 인식
  setCache: (query, results) =>
    set((state) => {
      const next = new Map(state.searchCache);
      next.set(query, results);
      return { searchCache: next };
    }),

  // 4) 후보 목록 조회
  getCandidates: () => get().candidates,

  // 5) 후보 등록 — 동일 id가 이미 있으면 false를 반환해 부모(candidateModule)가 중복 알림을 띄움 (F-04)
  addCandidate: (game) => {
    const exists = get().candidates.some((c) => c.id === game.id);
    if (exists) return false;
    set((state) => ({ candidates: [...state.candidates, game] }));
    return true;
  },

  // 6) 후보 삭제 — 해당 id를 가진 게임만 제외한 새 배열로 교체 (F-05)
  removeCandidate: (gameId) =>
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== gameId),
    })),

  // 7) 현재 라운드 대결 목록 조회
  getCurrentMatches: () => get().currentMatches,

  // 8) 새 라운드 시작 — 현재 라운드/매치를 교체하고 다음 라운드 큐는 비움
  setRoundState: (round, matches) =>
    set({ currentRound: round, currentMatches: matches, nextRoundQueue: [] }),

  // 9) 한 페어의 승자를 다음 라운드 큐에 추가
  pushToNextRound: (game) =>
    set((state) => ({ nextRoundQueue: [...state.nextRoundQueue, game] })),

  // 10) 최종 우승자 확정 (F-10 결과 화면 트리거)
  setWinner: (game) => set({ winner: game }),

  // 11) 최종 우승자 조회
  getWinner: () => get().winner,

  // 12) 전체 초기화 (F-13 새 토너먼트 시작) — 캐시까지 비워야 다음 세션이 깨끗하게 시작
  resetAll: () => set({ ...initialState, searchCache: new Map() }),
}));
