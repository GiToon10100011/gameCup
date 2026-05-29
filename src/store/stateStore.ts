// Zustand 기반 단일 메모리 스토어.
// UML v1.1 §StateStore 클래스와 1:1 매핑되며, 검색 캐시 + 후보 + 토너먼트 진행 + 결과 상태를 모두 보관한다.

import { create } from "zustand";
// IUser는 AuthSlice의 currentUser 필드 타입으로 사용 (UML v2.0 §AuthSlice)
import type { IApiError, IGame, ITournamentPair, IUser } from "@/types/game";

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
  // 직전 외부 API 호출 에러 (F-11 / Story #6). null이면 정상 상태.
  // 검색 흐름이 실패를 정규화해 여기에 반영하고, ErrorMessage 컴포넌트(#15)가 구독해 인라인 안내를 띄운다.
  apiError: IApiError | null;
  // ── AuthSlice (UML v2.0) ────────────────────────────────────────────────
  // 로그인한 Supabase 사용자 세션. null이면 비인증(비로그인) 상태.
  // resetAll(새 토너먼트 시작)로 초기화되지 않는다 — 플레이 데이터만 리셋하고
  // 로그인 세션은 유지해야 하기 때문 (F-13 재시작은 플레이 데이터만 리셋).
  currentUser: IUser | null;
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
  // API 에러 상태 반영/해제 (Story #6). 인자에 null을 주면 해제도 가능하지만,
  // 의도를 명확히 하기 위해 해제 전용 clearApiError를 따로 둔다.
  setApiError: (error: IApiError | null) => void;
  clearApiError: () => void;
  resetAll: () => void;
  // ── AuthSlice 액션 (UML v2.0) ────────────────────────────────────────────
  // 로그인 성공 시 AuthModule이 호출해 세션 사용자를 저장한다.
  setUser: (user: IUser) => void;
  // 로그아웃 또는 세션 만료 시 AuthModule이 호출해 세션을 비운다.
  clearUser: () => void;
  // 현재 로그인 사용자 조회. 비인증 상태이면 null을 반환한다.
  getUser: () => IUser | null;
}

// 초기 상태 — `resetAll`에서도 동일 객체를 spread해서 깔끔하게 초기화한다.
// 단, `searchCache`만은 새 Map 인스턴스를 만들어줘야 이전 캐시가 새지 않는다.
// ※ `currentUser`는 여기에 포함하지 않는다 — resetAll(새 토너먼트)로 로그인 세션이
//   날아가면 안 되기 때문. AuthSlice의 currentUser는 별도로 관리한다.
const initialState: IStateStoreState = {
  searchCache: new Map(),
  candidates: [],
  currentRound: 0,
  currentMatches: [],
  nextRoundQueue: [],
  winner: null,
  apiError: null,
  // 스토어 최초 생성 시점(앱 로드)에 인증 정보는 아직 없으므로 null
  currentUser: null,
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

  // 12) API 에러 반영 (Story #6) — searchModule이 정규화한 IApiError를 그대로 저장.
  //     null을 넘기면 해제와 동일하게 동작한다.
  setApiError: (error) => set({ apiError: error }),

  // 13) API 에러 해제 — 검색이 다시 성공하면 호출해 배너를 사라지게 한다.
  clearApiError: () => set({ apiError: null }),

  // 14) 전체 초기화 (F-13 새 토너먼트 시작) — 캐시까지 비워야 다음 세션이 깨끗하게 시작.
  //     apiError도 initialState에 포함돼 함께 null로 리셋된다.
  //     ※ currentUser는 의도적으로 초기화하지 않는다: spread 이후 현재 값을 다시 덮어써
  //     로그인 세션을 유지한다 (F-13 재시작은 플레이 데이터만 리셋하는 것이 원칙).
  resetAll: () =>
    set((state) => ({
      ...initialState,
      searchCache: new Map(),
      // 로그인 세션 보존 — 토너먼트를 다시 시작해도 사용자는 로그인 상태를 유지해야 함
      currentUser: state.currentUser,
    })),

  // ── AuthSlice 액션 구현 (UML v2.0 §AuthSlice) ────────────────────────────

  // 15) 로그인 성공 시 AuthModule이 호출 — 세션 사용자 저장
  setUser: (user) => set({ currentUser: user }),

  // 16) 로그아웃·세션 만료 시 AuthModule이 호출 — 세션 비우기
  clearUser: () => set({ currentUser: null }),

  // 17) 현재 로그인 사용자 조회 — 비인증이면 null 반환
  getUser: () => get().currentUser,
}));
