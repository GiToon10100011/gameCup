// AuthProvider (src/components/auth/AuthProvider.tsx) 단위 테스트.
// Task #112 — 세션 초기화·변경 구독 검증
//
// 검증 범위:
//   1) 마운트 시 authModule.getSession()이 호출된다
//   2) 세션이 있으면 setUser가 호출되고 isAuthInitialized가 true가 된다
//   3) 세션이 없으면 setUser는 호출되지 않고 isAuthInitialized는 true가 된다
//   4) getSession() 에러 시에도 isAuthInitialized가 true가 된다 (무한 로딩 방지)
//   5) onAuthStateChange 구독이 등록되고 user 변경이 store에 반영된다
//   6) 언마운트 시 구독이 해제된다
//   7) isAuthInitialized false 상태에서 onAuthStateChange 이벤트는 무시된다 (race condition 방지)

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStateStore } from "@/store/stateStore";

// ─────────────────────────────────────────────────────────────────────────────
// authModule 모킹
// ─────────────────────────────────────────────────────────────────────────────
const mockGetSession = vi.fn();
const mockUnsubscribe = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("@/modules/authModule", () => ({
  authModule: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트용 사용자 팩토리
// ─────────────────────────────────────────────────────────────────────────────
const mkUser = (id: string) => ({ id, email: `${id}@test.com` });

describe("AuthProvider (Task #112, 세션 초기화)", () => {
  beforeEach(() => {
    // 각 테스트 전 store와 mock 초기화
    useStateStore.getState().resetAll();
    useStateStore.getState().clearUser();
    // isAuthInitialized는 초기값 false로 리셋해야 한다
    // Zustand는 불변 참조이므로 setState로 직접 리셋
    useStateStore.setState({ isAuthInitialized: false });

    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    // onAuthStateChange는 기본적으로 unsubscribe 함수를 반환한다
    mockOnAuthStateChange.mockReturnValue(mockUnsubscribe);
    mockUnsubscribe.mockReset();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 마운트 시 getSession 호출
  // ───────────────────────────────────────────────────────────────────────────
  it("마운트 시 authModule.getSession()이 호출된다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    render(<AuthProvider><div /></AuthProvider>);

    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 세션 있음 → setUser 호출 + isAuthInitialized true
  // ───────────────────────────────────────────────────────────────────────────
  it("getSession이 IUser를 반환하면 store에 setUser가 호출되고 isAuthInitialized가 true가 된다", async () => {
    const user = mkUser("user-001");
    mockGetSession.mockResolvedValue(user);

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    render(<AuthProvider><div /></AuthProvider>);

    // Promise 해결을 기다린다
    await vi.waitFor(() => {
      expect(useStateStore.getState().currentUser).toEqual(user);
      expect(useStateStore.getState().isAuthInitialized).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 세션 없음 → setUser 호출 안 됨 + isAuthInitialized true
  // ───────────────────────────────────────────────────────────────────────────
  it("getSession이 null을 반환하면 setUser는 호출되지 않고 isAuthInitialized는 true가 된다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    render(<AuthProvider><div /></AuthProvider>);

    await vi.waitFor(() => {
      expect(useStateStore.getState().isAuthInitialized).toBe(true);
    });
    // 비로그인 — currentUser는 null이어야 한다
    expect(useStateStore.getState().currentUser).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) getSession 에러 → isAuthInitialized true (무한 로딩 방지)
  // ───────────────────────────────────────────────────────────────────────────
  it("getSession()이 에러를 throw해도 isAuthInitialized가 true가 된다", async () => {
    mockGetSession.mockRejectedValue(new Error("네트워크 오류"));

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    render(<AuthProvider><div /></AuthProvider>);

    await vi.waitFor(() => {
      expect(useStateStore.getState().isAuthInitialized).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) onAuthStateChange 구독 등록 + user 변경 반영 (초기화 완료 후)
  // ───────────────────────────────────────────────────────────────────────────
  it("onAuthStateChange 구독이 등록되고 user 변경이 store에 반영된다", async () => {
    mockGetSession.mockResolvedValue(null);

    // onAuthStateChange에 전달된 콜백을 캡처한다
    let capturedCallback: ((user: ReturnType<typeof mkUser> | null) => void) | undefined;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return mockUnsubscribe;
    });

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    render(<AuthProvider><div /></AuthProvider>);

    // 구독이 등록됐는지 확인
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);

    // WHY 대기: onAuthStateChange 콜백은 isAuthInitialized가 true인 후에만 처리된다.
    // getSession() 완료 후 isAuthInitialized가 true로 전환될 때까지 기다린다.
    await vi.waitFor(() => {
      expect(useStateStore.getState().isAuthInitialized).toBe(true);
    });

    // 초기화 완료 후 외부 이벤트(탭 전환 등)로 세션 변경 시뮬레이션
    const newUser = mkUser("user-002");
    capturedCallback?.(newUser);

    expect(useStateStore.getState().currentUser).toEqual(newUser);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) 언마운트 시 구독 해제
  // ───────────────────────────────────────────────────────────────────────────
  it("언마운트 시 onAuthStateChange 구독이 해제된다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    const { unmount } = render(<AuthProvider><div /></AuthProvider>);

    // 언마운트 → cleanup 호출 → unsubscribe 호출
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) isAuthInitialized false 중 onAuthStateChange 이벤트 무시 (race condition 방지)
  // ───────────────────────────────────────────────────────────────────────────
  it("isAuthInitialized false 상태에서 onAuthStateChange 이벤트는 store를 변경하지 않는다", async () => {
    // getSession이 지연되어 아직 완료되지 않은 상황을 시뮬레이션
    let resolveSession!: (v: null) => void;
    mockGetSession.mockReturnValue(new Promise((res) => { resolveSession = res; }));

    let capturedCallback: ((user: ReturnType<typeof mkUser> | null) => void) | undefined;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return mockUnsubscribe;
    });

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    render(<AuthProvider><div /></AuthProvider>);

    // 초기화 전(isAuthInitialized=false) — onAuthStateChange 이벤트 발생
    const earlyUser = mkUser("early-user");
    capturedCallback?.(earlyUser);

    // 초기화 전이므로 currentUser는 변경되지 않아야 한다
    expect(useStateStore.getState().currentUser).toBeNull();

    // 이후 getSession 완료
    resolveSession(null);
    await vi.waitFor(() => {
      expect(useStateStore.getState().isAuthInitialized).toBe(true);
    });
  });
});
