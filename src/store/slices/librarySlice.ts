// librarySlice — 토너먼트 라이브러리 상태 (NF-04 분리, Story #48)
//
// 담당 도메인: 저장된 토너먼트 목록 & 현재 선택(활성) 토너먼트
//   - myTournaments: listMyTournaments() 결과 캐시
//   - activeTournament: 현재 플레이 예정/진행 중인 토너먼트
//
// 중요: 이 슬라이스도 resetAll()에서 초기화되지 않는다.
//   라이브러리 상태는 플레이 데이터와 독립적이며, 새 토너먼트 시작 시 목록은 유지해야 한다.
//   (F-17 내 토너먼트 목록은 세션 전반에 걸쳐 유지)

import type { ITournament } from "@/types/game";

// 슬라이스 상태 타입
export interface ILibraryState {
  myTournaments: ITournament[];
  activeTournament: ITournament | null;
}

// 슬라이스 액션 타입
export interface ILibraryActions {
  setList: (tournaments: ITournament[]) => void;
  setActive: (tournament: ITournament) => void;
  clearActive: () => void;
  getList: () => ITournament[];
  getActive: () => ITournament | null;
}

export type ILibrarySlice = ILibraryState & ILibraryActions;

// 슬라이스 초기 상태 — 앱 로드 시 목록 없음, 활성 토너먼트 없음
export const libraryInitialState: ILibraryState = {
  myTournaments: [],
  activeTournament: null,
};

// WHY: Zustand 슬라이스 패턴 — 전체 스토어 타입 순환 의존 방지, any 사용
export const createLibrarySlice = (set: any, get: any): ILibrarySlice => ({
  ...libraryInitialState,

  // listMyTournaments() 결과를 캐시로 저장 — HubPage 렌더에 활용
  setList: (tournaments) => set(() => ({ myTournaments: tournaments })),

  // 활성 토너먼트 설정 — createTournament·getTournament 성공 직후 호출
  setActive: (tournament) => set(() => ({ activeTournament: tournament })),

  // 활성 토너먼트 해제 — 허브로 돌아오거나 활성 토너먼트 삭제 시 호출
  clearActive: () => set(() => ({ activeTournament: null })),

  // 현재 토너먼트 목록 캐시 조회
  getList: () => get().myTournaments,

  // 활성 토너먼트 조회 — 선택 전이거나 해제됐으면 null 반환
  getActive: () => get().activeTournament,
});
