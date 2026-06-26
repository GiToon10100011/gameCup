// tournamentStorageModule (src/modules/tournamentStorageModule.ts) 단위 테스트.
// Task #115 — createTournament (F-16) 검증
//
// 검증 범위:
//   1) 로그인 상태에서 name·candidates → Supabase insert → ITournament 반환
//   2) 비로그인 상태 → 인증 에러 throw
//   3) Supabase insert 실패 → DB 에러 throw
//   4) toITournament: DB row(snake_case) → ITournament(camelCase) 정규화 검증
//   5) Supabase insert에 올바른 컬럼(name·owner_id·candidates)이 전달된다

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// supabaseClient 모킹 — vi.hoisted로 TDZ 방지
// ─────────────────────────────────────────────────────────────────────────────
// WHY: vi.mock() factory는 모듈 최상위에서 호이스팅되므로, 그 안에서 참조할 mock
// 변수도 vi.hoisted()로 미리 초기화해야 "Cannot access before initialization" 에러를 막는다.
const { mockSingle, mockSelect, mockInsert, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  return { mockSingle, mockSelect, mockInsert, mockFrom };
});

vi.mock("@/lib/supabaseClient", () => ({
  createBrowserSupabaseClient: () => ({ from: mockFrom }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 픽스처
// ─────────────────────────────────────────────────────────────────────────────
// 테스트용 사용자·게임 팩토리
const mkUser = (id = "user-001") => ({ id, email: `${id}@test.com` });
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

// Supabase가 반환하는 DB row 형태 (snake_case)
const mkDbRow = (overrides?: Partial<{
  id: string; name: string; owner_id: string;
  candidates: IGame[]; created_at: string;
}>) => ({
  id: "tour-001",
  name: "내 첫 토너먼트",
  owner_id: "user-001",
  candidates: [mkGame("g1"), mkGame("g2")],
  created_at: "2026-06-27T00:00:00.000Z",
  ...overrides,
});

describe("tournamentStorageModule — createTournament (Task #115, F-16)", () => {
  beforeEach(() => {
    // 각 테스트 전 store 초기화 + mock 리셋
    useStateStore.getState().resetAll();
    useStateStore.getState().clearUser();
    useStateStore.setState({ isAuthInitialized: false });

    mockFrom.mockClear();
    mockInsert.mockClear();
    mockSelect.mockClear();
    mockSingle.mockClear();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 성공 경로 — ITournament 반환
  // ───────────────────────────────────────────────────────────────────────────
  it("로그인 상태에서 createTournament 호출 시 ITournament를 반환한다", async () => {
    // 로그인 상태 세팅
    useStateStore.getState().setUser(mkUser("user-001"));

    const candidates = [mkGame("g1"), mkGame("g2")];
    const dbRow = mkDbRow({ name: "내 첫 토너먼트", candidates });
    mockSingle.mockResolvedValue({ data: dbRow, error: null });

    const { tournamentStorageModule } = await import(
      "@/modules/tournamentStorageModule"
    );
    const result = await tournamentStorageModule.createTournament("내 첫 토너먼트", candidates);

    // 반환값이 ITournament 형태로 정규화됐는지 검증
    expect(result).toEqual<ITournament>({
      id: "tour-001",
      name: "내 첫 토너먼트",
      ownerId: "user-001",
      candidates,
      createdAt: "2026-06-27T00:00:00.000Z",
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 비로그인 → 인증 에러
  // ───────────────────────────────────────────────────────────────────────────
  it("비로그인 상태에서 createTournament 호출 시 인증 에러를 throw한다", async () => {
    // currentUser가 null인 상태 유지 (clearUser로 보장)
    expect(useStateStore.getState().currentUser).toBeNull();

    const { tournamentStorageModule } = await import(
      "@/modules/tournamentStorageModule"
    );

    // Supabase insert가 호출되지 않고 앱 계층에서 즉시 throw해야 한다
    await expect(
      tournamentStorageModule.createTournament("불법 토너먼트", [mkGame("g1")]),
    ).rejects.toThrow("로그인이 필요합니다");

    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) Supabase 에러 → DB 에러 throw
  // ───────────────────────────────────────────────────────────────────────────
  it("Supabase insert 실패 시 에러 메시지를 그대로 throw한다", async () => {
    useStateStore.getState().setUser(mkUser("user-001"));

    // Supabase가 에러 응답을 반환하는 상황 (RLS 위반·네트워크 오류 등)
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "new row violates row-level security policy" },
    });

    const { tournamentStorageModule } = await import(
      "@/modules/tournamentStorageModule"
    );

    await expect(
      tournamentStorageModule.createTournament("금지된 저장", [mkGame("g1")]),
    ).rejects.toThrow("new row violates row-level security policy");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) toITournament: snake_case → camelCase 정규화
  // ───────────────────────────────────────────────────────────────────────────
  it("DB row의 owner_id·created_at이 ownerId·createdAt으로 정규화된다", async () => {
    const user = mkUser("uid-xyz");
    useStateStore.getState().setUser(user);

    const dbRow = mkDbRow({
      owner_id: "uid-xyz",
      created_at: "2026-01-01T12:00:00.000Z",
    });
    mockSingle.mockResolvedValue({ data: dbRow, error: null });

    const { tournamentStorageModule } = await import(
      "@/modules/tournamentStorageModule"
    );
    const result = await tournamentStorageModule.createTournament("정규화 테스트", []);

    // snake_case 필드가 camelCase로 변환됐는지 검증
    expect(result.ownerId).toBe("uid-xyz");
    expect(result.createdAt).toBe("2026-01-01T12:00:00.000Z");
    // 원본 snake_case 키는 존재하지 않아야 한다
    expect((result as unknown as Record<string, unknown>).owner_id).toBeUndefined();
    expect((result as unknown as Record<string, unknown>).created_at).toBeUndefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) Supabase insert에 올바른 컬럼이 전달되는지 검증
  // ───────────────────────────────────────────────────────────────────────────
  it("Supabase insert에 name·owner_id·candidates가 올바르게 전달된다", async () => {
    const user = mkUser("user-002");
    useStateStore.getState().setUser(user);

    const candidates = [mkGame("a"), mkGame("b"), mkGame("c")];
    mockSingle.mockResolvedValue({
      data: mkDbRow({ owner_id: "user-002", candidates }),
      error: null,
    });

    const { tournamentStorageModule } = await import(
      "@/modules/tournamentStorageModule"
    );
    await tournamentStorageModule.createTournament("세 후보 토너먼트", candidates);

    // Supabase .from("tournaments") 호출 확인
    expect(mockFrom).toHaveBeenCalledWith("tournaments");
    // insert payload 검증 — owner_id는 현재 로그인 사용자 id여야 한다
    expect(mockInsert).toHaveBeenCalledWith({
      name: "세 후보 토너먼트",
      owner_id: "user-002",
      candidates,
    });
  });
});
