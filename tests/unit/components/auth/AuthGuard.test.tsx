// AuthGuard (src/components/auth/AuthGuard.tsx) 단위 테스트.
// Task #112 — 클라이언트 인증 가드 렌더링 검증
//
// 검증 범위:
//   1) isAuthInitialized false → 로딩 스피너를 렌더한다
//   2) isAuthInitialized true + currentUser 있음 → children을 렌더한다
//   3) isAuthInitialized true + currentUser null → 로그인 유도 UI를 렌더한다
//   4) isAuthInitialized true + currentUser null → router.replace('/auth')가 호출된다
//   5) 로그인 유도 UI의 버튼 클릭 → router.replace('/auth')가 호출된다

import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStateStore } from "@/store/stateStore";

// ─────────────────────────────────────────────────────────────────────────────
// next/navigation 모킹 — useRouter는 jsdom에서 동작하지 않는다
// ─────────────────────────────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// tailwind-variants 모킹 — 클래스 값 대신 빈 문자열을 반환해 스냅샷 노이즈를 줄인다
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("@/components/auth/AuthGuard.variants", () => ({
  authGuardVariants: () => ({
    container: () => "",
    spinner: () => "",
    card: () => "",
    iconWrapper: () => "",
    title: () => "",
    description: () => "",
    button: () => "",
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트용 사용자 팩토리
// ─────────────────────────────────────────────────────────────────────────────
const mkUser = (id: string) => ({ id, email: `${id}@test.com` });

describe("AuthGuard (Task #112, 클라이언트 인증 가드)", () => {
  beforeEach(() => {
    // 각 테스트 전 store를 깨끗한 초기 상태로 되돌린다
    useStateStore.getState().resetAll();
    useStateStore.getState().clearUser();
    useStateStore.setState({ isAuthInitialized: false });
    mockReplace.mockReset();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 초기화 전 → 로딩 스피너
  // ───────────────────────────────────────────────────────────────────────────
  it("isAuthInitialized가 false이면 로딩 스피너를 렌더한다", async () => {
    // 초기 상태: 아직 getSession() 미완료
    const { AuthGuard } = await import("@/components/auth/AuthGuard");
    render(
      <AuthGuard>
        <div>보호된 콘텐츠</div>
      </AuthGuard>,
    );

    // 로딩 상태 → 스피너가 있어야 한다
    expect(screen.getByRole("status")).toBeInTheDocument();
    // children은 보이지 않아야 한다
    expect(screen.queryByText("보호된 콘텐츠")).not.toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 초기화 완료 + 로그인 → children 렌더
  // ───────────────────────────────────────────────────────────────────────────
  it("isAuthInitialized true + currentUser 있으면 children을 렌더한다", async () => {
    // 로그인 상태 시뮬레이션
    useStateStore.getState().setUser(mkUser("user-001"));
    useStateStore.getState().setAuthInitialized();

    const { AuthGuard } = await import("@/components/auth/AuthGuard");
    render(
      <AuthGuard>
        <div>보호된 콘텐츠</div>
      </AuthGuard>,
    );

    // 로그인 상태 → children이 렌더되어야 한다
    expect(screen.getByText("보호된 콘텐츠")).toBeInTheDocument();
    // 로딩 스피너는 없어야 한다
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 초기화 완료 + 비로그인 → 로그인 유도 UI
  // ───────────────────────────────────────────────────────────────────────────
  it("isAuthInitialized true + currentUser null이면 로그인 유도 UI를 렌더한다", async () => {
    // 비로그인 상태 + 초기화 완료
    useStateStore.getState().setAuthInitialized();
    // currentUser는 null 유지

    const { AuthGuard } = await import("@/components/auth/AuthGuard");
    render(
      <AuthGuard>
        <div>보호된 콘텐츠</div>
      </AuthGuard>,
    );

    // 로그인 유도 문구가 표시되어야 한다
    expect(screen.getByText("로그인이 필요합니다")).toBeInTheDocument();
    // children은 표시되지 않아야 한다
    expect(screen.queryByText("보호된 콘텐츠")).not.toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 비로그인 + 초기화 완료 → router.replace('/auth') 자동 호출
  // ───────────────────────────────────────────────────────────────────────────
  it("비로그인 상태 확정 시 router.replace('/auth')가 호출된다", async () => {
    useStateStore.getState().setAuthInitialized();

    const { AuthGuard } = await import("@/components/auth/AuthGuard");
    render(
      <AuthGuard>
        <div>보호된 콘텐츠</div>
      </AuthGuard>,
    );

    // useEffect 실행 대기
    await vi.waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 로그인 유도 버튼 클릭 → router.replace('/auth')
  // ───────────────────────────────────────────────────────────────────────────
  it("로그인하기 버튼 클릭 시 router.replace('/auth')가 호출된다", async () => {
    useStateStore.getState().setAuthInitialized();

    const { AuthGuard } = await import("@/components/auth/AuthGuard");
    render(
      <AuthGuard>
        <div>보호된 콘텐츠</div>
      </AuthGuard>,
    );

    const button = screen.getByRole("button", { name: "로그인하기" });
    fireEvent.click(button);

    expect(mockReplace).toHaveBeenCalledWith("/auth");
  });
});
