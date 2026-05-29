// authModule (src/modules/authModule.ts) 단위 테스트.
// Task #108 — OTP 이메일 인증 흐름 전체를 검증한다.
//
// 검증 범위:
//   1) signInWithOtp: 이메일을 전달하면 supabase.auth.signInWithOtp가 호출된다
//   2) signInWithOtp: Supabase 에러 응답 시 Error를 throw한다
//   3) verifyOtp: 유효한 코드로 검증하면 IUser를 반환하고 setUser가 호출된다
//   4) verifyOtp: 잘못된 코드로 검증하면 Error를 throw한다
//   5) getSession: 세션이 있으면 IUser를 반환한다
//   6) getSession: 세션이 없으면 null을 반환한다
//   7) signOut: supabase.auth.signOut이 호출되고 clearUser가 호출된다

import { beforeEach, describe, expect, it, vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// vi.hoisted — mock 팩토리 내부에서 참조할 변수를 호이스팅한다
// ─────────────────────────────────────────────────────────────────────────────
// WHY: vi.mock() 팩토리는 파일 최상단으로 호이스팅되어 실행된다.
// 일반 `const` 선언은 호이스팅되지 않아 팩토리 내에서 참조하면 TDZ 에러가 발생한다.
// vi.hoisted()는 팩토리보다 먼저 실행되도록 보장하므로 안전하게 mock 함수를 공유할 수 있다.
const {
  mockSignInWithOtp,
  mockVerifyOtp,
  mockGetSession,
  mockSignOut,
  mockOnAuthStateChange,
} = vi.hoisted(() => {
  return {
    mockSignInWithOtp: vi.fn(),
    mockVerifyOtp: vi.fn(),
    mockGetSession: vi.fn(),
    mockSignOut: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// @supabase/ssr 모킹
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 실제 Supabase 서버에 연결하지 않고 authModule이 올바른 메서드를 호출하는지만 검증한다.
// createBrowserClient가 가짜 auth 네임스페이스를 가진 클라이언트 객체를 반환하도록 대체한다.
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn().mockReturnValue({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      getSession: mockGetSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
  // createServerClient도 미사용이지만 import 에러 방지를 위해 포함
  createServerClient: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// next/headers 모킹
// ─────────────────────────────────────────────────────────────────────────────
// WHY: supabaseClient.ts 내에서 next/headers를 import하므로 Node 환경에서도
// 런타임 에러가 발생하지 않도록 가짜 cookies()를 제공한다.
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 환경 변수 설정 — createBrowserSupabaseClient의 getSupabaseEnv() 통과를 위해 필요
// ─────────────────────────────────────────────────────────────────────────────
// WHY: authModule은 내부적으로 createBrowserSupabaseClient()를 호출하는데,
// 이 팩토리가 env 변수를 검사하므로 테스트 환경에서도 더미 값을 넣어줘야 한다.
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

// ─────────────────────────────────────────────────────────────────────────────
// authModule + StateStore import (mock 선언 이후에 import)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: vi.mock 호이스팅 덕분에 mock이 먼저 등록되고 authModule이 import될 때
// 이미 가짜 createBrowserClient가 주입된 상태가 된다.
import { authModule } from "@/modules/authModule";
import { useStateStore } from "@/store/stateStore";

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────────────────────────────
describe("authModule (Task #108 — OTP 이메일 인증)", () => {
  // 각 테스트 전에 StateStore와 mock 함수를 초기화해 테스트 간 상태가 새지 않도록 한다
  beforeEach(() => {
    // resetAll()은 currentUser를 유지하므로(로그인 세션 보존 정책),
    // 인증 테스트에서는 명시적으로 clearUser()도 호출해 이전 테스트의 사용자가 남지 않게 한다.
    useStateStore.getState().resetAll();
    useStateStore.getState().clearUser();
    // 이전 테스트의 mock 호출 기록을 지워 독립적인 검증이 가능하게 한다
    mockSignInWithOtp.mockReset();
    mockVerifyOtp.mockReset();
    mockGetSession.mockReset();
    mockSignOut.mockReset();
    mockOnAuthStateChange.mockReset();
  });

  // ─── signInWithOtp ───────────────────────────────────────────────────────

  describe("signInWithOtp", () => {
    // 정상 경로: OTP 이메일 발송 성공 시 supabase.auth.signInWithOtp가 올바른 인수로 호출된다
    it("이메일을 전달하면 supabase.auth.signInWithOtp가 호출된다", async () => {
      // Supabase가 에러 없이 응답하는 정상 시나리오를 설정한다
      mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

      await authModule.signInWithOtp("test@example.com");

      // signInWithOtp가 1회 호출됐는지 확인
      expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
      // 이메일과 shouldCreateUser 옵션이 올바르게 전달됐는지 확인
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: { shouldCreateUser: true },
      });
    });

    // 에러 경로: Supabase가 에러를 반환하면 authModule이 Error를 throw해야 한다
    it("Supabase 에러 응답 시 Error를 throw한다", async () => {
      // Supabase가 에러 메시지와 함께 응답하는 실패 시나리오를 설정한다
      mockSignInWithOtp.mockResolvedValue({
        data: {},
        error: { message: "Invalid email" },
      });

      // throw 여부를 검증하기 위해 rejects.toThrow 사용
      await expect(authModule.signInWithOtp("invalid@")).rejects.toThrow(
        "Invalid email",
      );
    });
  });

  // ─── verifyOtp ──────────────────────────────────────────────────────────

  describe("verifyOtp", () => {
    // 정상 경로: 올바른 OTP 코드로 검증하면 IUser가 반환되고 StateStore에도 저장된다
    it("유효한 코드로 검증하면 IUser를 반환하고 setUser가 호출된다", async () => {
      // Supabase 가짜 User 객체 — id와 email만 있으면 충분하다
      const fakeUser = { id: "user-uuid-123", email: "test@example.com" };
      mockVerifyOtp.mockResolvedValue({
        data: { user: fakeUser, session: {} },
        error: null,
      });

      const result = await authModule.verifyOtp("test@example.com", "123456");

      // 반환값이 IUser 형태인지 확인
      expect(result).toEqual({ id: "user-uuid-123", email: "test@example.com" });

      // StateStore에도 동일한 사용자가 저장됐는지 확인 (Business → Data Store 방향)
      expect(useStateStore.getState().getUser()).toEqual({
        id: "user-uuid-123",
        email: "test@example.com",
      });

      // verifyOtp가 올바른 인수로 호출됐는지도 검증
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "123456",
        type: "email",
      });
    });

    // 에러 경로: Supabase가 에러를 반환하면 throw해야 한다
    it("잘못된 코드로 검증하면 Error를 throw한다", async () => {
      // 잘못된 OTP 입력 시 Supabase의 전형적인 에러 응답을 흉내낸다
      mockVerifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Token has expired or is invalid" },
      });

      await expect(
        authModule.verifyOtp("test@example.com", "000000"),
      ).rejects.toThrow("Token has expired or is invalid");

      // 에러 발생 시 StateStore가 변경되지 않았는지 확인 (사용자 정보 누출 방지)
      expect(useStateStore.getState().getUser()).toBeNull();
    });
  });

  // ─── getSession ─────────────────────────────────────────────────────────

  describe("getSession", () => {
    // 세션이 있는 경우: 브라우저 쿠키에 유효한 세션이 존재하면 IUser를 반환한다
    it("세션이 있으면 IUser를 반환한다", async () => {
      const fakeUser = { id: "session-user-456", email: "session@example.com" };
      // getSession은 { data: { session: { user } } } 형태를 반환한다
      mockGetSession.mockResolvedValue({
        data: { session: { user: fakeUser } },
        error: null,
      });

      const result = await authModule.getSession();

      expect(result).toEqual({
        id: "session-user-456",
        email: "session@example.com",
      });
    });

    // 세션이 없는 경우: 비인증 상태 또는 세션 만료 시 null을 반환한다
    it("세션이 없으면 null을 반환한다", async () => {
      // session이 null인 경우를 시뮬레이션한다 (비로그인 상태)
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await authModule.getSession();

      expect(result).toBeNull();
    });
  });

  // ─── signOut ────────────────────────────────────────────────────────────

  describe("signOut", () => {
    // 로그아웃: supabase.auth.signOut이 호출되고 StateStore의 currentUser가 비워진다
    it("supabase.auth.signOut이 호출되고 clearUser가 호출된다", async () => {
      // 로그아웃 전에 StateStore에 사용자를 미리 저장해둔다
      useStateStore
        .getState()
        .setUser({ id: "pre-login-user", email: "pre@example.com" });
      // 로그인 상태 사전 확인
      expect(useStateStore.getState().getUser()).not.toBeNull();

      // Supabase signOut은 에러 없이 완료되는 것으로 설정한다
      mockSignOut.mockResolvedValue({ error: null });

      await authModule.signOut();

      // supabase.auth.signOut이 호출됐는지 확인
      expect(mockSignOut).toHaveBeenCalledTimes(1);

      // StateStore의 currentUser가 null로 비워졌는지 확인 (로그아웃 완료)
      expect(useStateStore.getState().getUser()).toBeNull();
    });
  });
});
