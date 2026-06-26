// requireAuth (src/lib/requireAuth.ts) 단위 테스트.
// Task #112 — 서버 컴포넌트 인증 가드 검증
//
// 검증 범위:
//   1) 유효한 세션이 있으면 IUser를 반환하고 redirect를 호출하지 않는다
//   2) 세션이 없으면 redirect('/auth')를 호출한다
//   3) email이 null인 User도 빈 문자열로 정규화해 IUser를 반환한다

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// next/navigation 모킹 — redirect는 Next.js 런타임에서만 동작한다
// ─────────────────────────────────────────────────────────────────────────────
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// ─────────────────────────────────────────────────────────────────────────────
// createServerSupabaseClient 모킹 — 실제 Supabase 연결 없이 getUser 응답을 제어한다
// ─────────────────────────────────────────────────────────────────────────────
const mockGetUser = vi.fn();
vi.mock("@/lib/supabaseClient", () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

describe("requireAuth (Task #112, 서버 인증 가드)", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockRedirect.mockReset();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 유효한 세션 → IUser 반환
  // ───────────────────────────────────────────────────────────────────────────
  it("세션이 있으면 IUser를 반환하고 redirect를 호출하지 않는다", async () => {
    // Supabase가 유효한 User를 반환하는 상황 시뮬레이션
    mockGetUser.mockResolvedValue({
      data: { user: { id: "uuid-001", email: "test@example.com" } },
    });

    const { requireAuth } = await import("@/lib/requireAuth");
    const user = await requireAuth();

    // IUser로 정규화되어야 한다
    expect(user).toEqual({ id: "uuid-001", email: "test@example.com" });
    // 로그인 상태이므로 redirect는 호출되지 않아야 한다
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 세션 없음 → redirect('/auth')
  // ───────────────────────────────────────────────────────────────────────────
  it("세션이 없으면 redirect('/auth')를 호출한다", async () => {
    // Supabase가 user: null을 반환하는 상황 (비로그인)
    mockGetUser.mockResolvedValue({ data: { user: null } });
    // WHY: 실제 Next.js redirect()는 never 반환 — 에러를 throw해 이후 코드를 막는다.
    // mock이 단순 반환하면 toIUser(null) 호출로 런타임 에러가 발생하므로 throw를 시뮬레이션한다.
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    const { requireAuth } = await import("@/lib/requireAuth");

    // redirect()의 throw가 requireAuth까지 전파된다
    await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT");
    // /auth로 리다이렉트 인수가 전달됐는지 확인
    expect(mockRedirect).toHaveBeenCalledWith("/auth");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) email null → 빈 문자열로 정규화
  // ───────────────────────────────────────────────────────────────────────────
  it("user.email이 null이면 빈 문자열로 정규화한 IUser를 반환한다", async () => {
    // email이 없는 익명 계정 등을 처리하는 방어 코드 검증
    mockGetUser.mockResolvedValue({
      data: { user: { id: "uuid-002", email: null } },
    });

    const { requireAuth } = await import("@/lib/requireAuth");
    const user = await requireAuth();

    expect(user).toEqual({ id: "uuid-002", email: "" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
