// authSlice — 인증 세션 상태 (NF-04 분리, Story #48)
//
// 담당 도메인: Supabase 로그인 세션
//   - currentUser: 현재 로그인 사용자 (null = 비로그인)
//   - isAuthInitialized: AuthProvider의 getSession() 완료 여부
//
// 중요: 이 슬라이스는 resetAll()에서 초기화되지 않는다.
//   플레이 데이터(후보·라운드·우승자) 리셋 시에도 로그인 세션은 유지해야 하기 때문이다.
//   (F-13 재시작 = 플레이 데이터만 리셋, 로그인 세션 보존)

import type { IUser } from "@/types/game";

// 슬라이스 상태 타입
export interface IAuthState {
  currentUser: IUser | null;
  isAuthInitialized: boolean;
}

// 슬라이스 액션 타입
export interface IAuthActions {
  setUser: (user: IUser) => void;
  clearUser: () => void;
  getUser: () => IUser | null;
  setAuthInitialized: () => void;
}

export type IAuthSlice = IAuthState & IAuthActions;

// 슬라이스 초기 상태 — 앱 최초 로드 시 로그인 정보 없음
export const authInitialState: IAuthState = {
  currentUser: null,
  // getSession() 완료 전이므로 false — AuthProvider 마운트 후 true로 전환
  isAuthInitialized: false,
};

// WHY: Zustand 슬라이스 패턴 — 전체 스토어 타입 순환 의존 방지, any 사용
export const createAuthSlice = (set: any, get: any): IAuthSlice => ({
  ...authInitialState,

  // 로그인 성공 시 AuthModule이 호출 — 세션 사용자 저장
  setUser: (user) => set(() => ({ currentUser: user })),

  // 로그아웃·세션 만료 시 AuthModule이 호출 — 세션 비우기
  clearUser: () => set(() => ({ currentUser: null })),

  // 현재 로그인 사용자 조회 — 비인증이면 null 반환
  getUser: () => get().currentUser,

  // AuthProvider가 getSession() 완료 후 호출 — 초기화 완료 표시
  // WHY: 한 번 true가 되면 false로 되돌릴 필요 없음. resetAll에서도 보존.
  setAuthInitialized: () => set(() => ({ isAuthInitialized: true })),
});
