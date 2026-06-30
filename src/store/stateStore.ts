// Zustand 기반 단일 메모리 스토어 (NF-04 기능 단위 분리, Story #48).
//
// 도메인별 슬라이스 4개를 조합해 하나의 스토어로 제공한다:
//   candidateSlice  — 검색 캐시·후보 목록·API 에러
//   tournamentSlice — 라운드 진행 상태(currentRound·currentMatches·nextRoundQueue·winner)
//   authSlice       — 인증 세션(currentUser·isAuthInitialized)
//   librarySlice    — 토너먼트 목록·활성 토너먼트(myTournaments·activeTournament)
//
// 외부 API는 변경 없음 — 컴포넌트와 모듈은 여전히 `useStateStore` 하나로 접근한다.
// UML v1.1 §StateStore 클래스와 1:1 매핑 유지.

import { create } from "zustand";
import {
  createCandidateSlice,
  candidateInitialState,
  type ICandidateSlice,
} from "./slices/candidateSlice";
import {
  createTournamentSlice,
  tournamentInitialState,
  type ITournamentSlice,
} from "./slices/tournamentSlice";
import { createAuthSlice, type IAuthSlice } from "./slices/authSlice";
import { createLibrarySlice, type ILibrarySlice } from "./slices/librarySlice";

// 전체 스토어 타입 — 4개 슬라이스 + 크로스 슬라이스 액션
export type IFullStore = ICandidateSlice &
  ITournamentSlice &
  IAuthSlice &
  ILibrarySlice & {
    // resetAll: 플레이 데이터(후보·라운드·우승자·에러·캐시)를 초기화하되
    //   인증 세션(auth)·라이브러리(library) 상태는 보존한다 (F-13).
    resetAll: () => void;
  };

// 실제 스토어 인스턴스 — 컴포넌트에서 `useStateStore()` 훅으로,
// 모듈/유틸에서는 `useStateStore.getState()`로 접근한다.
export const useStateStore = create<IFullStore>((set, get) => ({
  // 각 도메인 슬라이스 펼치기
  ...createCandidateSlice(set, get),
  ...createTournamentSlice(set, get),
  ...createAuthSlice(set, get),
  ...createLibrarySlice(set, get),

  // resetAll — 크로스 슬라이스 리셋 (F-13 새 토너먼트 시작)
  // 플레이 데이터(candidate + tournament)만 초기화하고
  // 인증(auth)·라이브러리(library) 상태는 get()으로 읽어 복원한다.
  resetAll: () =>
    set((state) => ({
      // 후보·캐시·에러 초기화 (candidateSlice)
      ...candidateInitialState,
      searchCache: new Map(), // Map 참조 타입이므로 새 인스턴스 생성
      // 라운드 진행 상태 초기화 (tournamentSlice)
      ...tournamentInitialState,
      // 로그인 세션 보존 — 토너먼트를 다시 시작해도 사용자는 로그인 상태를 유지해야 함
      currentUser: state.currentUser,
      // 초기화 완료 여부 보존 — getSession()은 앱 생애 주기 동안 한 번만 호출됨
      isAuthInitialized: state.isAuthInitialized,
      // 라이브러리 상태 보존 — 플레이 데이터 초기화와 독립적 (F-17 목록은 세션 전반 유지)
      myTournaments: state.myTournaments,
      activeTournament: state.activeTournament,
    })),
}));
