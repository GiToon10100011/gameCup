// candidateSlice — 검색 캐시·후보 목록·API 에러 상태 (NF-04 분리, Story #48)
//
// 담당 도메인: 검색/후보 등록 기능
//   - searchCache: RAWG 검색어 → 결과 배열 메모이제이션 (NF-05 재호출 방지)
//   - candidates: 토너먼트 후보로 등록된 게임 목록 (F-03~F-05)
//   - apiError: 직전 API 호출 에러 (F-11 인라인 에러 표시)
//
// 확장 가이드: 향후 "즐겨찾기", "태그 필터" 등 검색/후보 관련 기능은 이 슬라이스에 추가한다.

import type { IApiError, IGame } from "@/types/game";

// 슬라이스 상태 타입
export interface ICandidateState {
  searchCache: Map<string, IGame[]>;
  candidates: IGame[];
  apiError: IApiError | null;
}

// 슬라이스 액션 타입
export interface ICandidateActions {
  getCache: (query: string) => IGame[] | undefined;
  setCache: (query: string, results: IGame[]) => void;
  getCandidates: () => IGame[];
  addCandidate: (game: IGame) => boolean;
  removeCandidate: (gameId: string) => void;
  setApiError: (error: IApiError | null) => void;
  clearApiError: () => void;
}

export type ICandidateSlice = ICandidateState & ICandidateActions;

// 슬라이스 초기 상태 — resetAll()에서 spread해 사용
export const candidateInitialState: ICandidateState = {
  searchCache: new Map(),
  candidates: [],
  apiError: null,
};

// 슬라이스 팩토리 — stateStore.ts의 create()에서 호출
// WHY: set/get을 any로 타입 지정하는 이유 — Zustand 슬라이스 패턴에서 각 슬라이스가
//      전체 스토어 타입을 알면 순환 의존이 생긴다. any를 사용해 분리하고,
//      타입 안전성은 stateStore.ts의 create<IFullStore>()가 보장한다.
export const createCandidateSlice = (set: any, get: any): ICandidateSlice => ({
  ...candidateInitialState,

  // 검색 캐시 조회 (NF-05): 동일 검색어가 들어오면 API 호출 없이 캐시 반환
  getCache: (query) => get().searchCache.get(query),

  // 검색 캐시 저장 — Map 참조 타입이므로 새 Map 인스턴스로 교체해야 React가 변경 인식
  setCache: (query, results) =>
    set((state: ICandidateState) => {
      const next = new Map(state.searchCache);
      next.set(query, results);
      return { searchCache: next };
    }),

  // 후보 목록 조회
  getCandidates: () => get().candidates,

  // 후보 등록 — 동일 id 중복 시 false 반환 (F-04 중복 방지)
  addCandidate: (game) => {
    const exists = (get().candidates as IGame[]).some((c: IGame) => c.id === game.id);
    if (exists) return false;
    set((state: ICandidateState) => ({ candidates: [...state.candidates, game] }));
    return true;
  },

  // 후보 삭제 (F-05)
  removeCandidate: (gameId) =>
    set((state: ICandidateState) => ({
      candidates: state.candidates.filter((c: IGame) => c.id !== gameId),
    })),

  // API 에러 반영 — null을 넘기면 해제 동작
  setApiError: (error) => set(() => ({ apiError: error })),

  // API 에러 해제 — 검색 재성공 시 호출
  clearApiError: () => set(() => ({ apiError: null })),
});
