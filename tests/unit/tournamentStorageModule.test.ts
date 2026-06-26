// tournamentStorageModule (src/modules/tournamentStorageModule.ts) 단위 테스트.
// Task #115 — createTournament (F-16) 검증
// Task #118 — listMyTournaments·getTournament·deleteTournament (F-17) 검증
//
// 검증 범위 (#115):
//   1) 로그인 상태에서 name·candidates → Supabase insert → ITournament 반환
//   2) 비로그인 상태 → 인증 에러 throw
//   3) Supabase insert 실패 → DB 에러 throw
//   4) toITournament: DB row(snake_case) → ITournament(camelCase) 정규화 검증
//   5) Supabase insert에 올바른 컬럼(name·owner_id·candidates)이 전달된다
//
// 검증 범위 (#118):
//   6) listMyTournaments: 로그인 → ITournament[] 반환 (created_at DESC 정렬)
//   7) listMyTournaments: 비로그인 → 인증 에러 throw
//   8) listMyTournaments: Supabase 에러 → throw
//   9) getTournament: id로 단건 조회 → ITournament 반환
//  10) getTournament: Supabase 에러(행 없음·RLS 차단) → throw
//  11) deleteTournament: 비로그인 → 인증 에러 throw
//  12) deleteTournament: 로그인 → Supabase delete 호출
//  13) deleteTournament: Supabase 에러 → throw

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// supabaseClient 모킹 — vi.hoisted로 TDZ 방지
// ─────────────────────────────────────────────────────────────────────────────
// WHY: vi.mock() factory는 모듈 최상위에서 호이스팅되므로, 그 안에서 참조할 mock
// 변수도 vi.hoisted()로 미리 초기화해야 "Cannot access before initialization" 에러를 막는다.
//
// 체인 구조:
//   createTournament:  from().insert({}).select().single()
//   listMyTournaments: from().select("*").order("created_at", {...})
//   getTournament:     from().select("*").eq("id", id).single()
//   deleteTournament:  from().delete().eq("id", id)
const {
  mockSingle, mockOrder, mockSelectEq, mockDeleteEq,
  mockSelect, mockInsert, mockDelete, mockFrom,
} = vi.hoisted(() => {
  // 종단 mock — 각 체인의 최종 반환값을 개별 제어
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();
  const mockSelectEq = vi.fn(() => ({ single: mockSingle }));
  const mockDeleteEq = vi.fn();

  // select()가 반환하는 체인 — insert 체인과 직접 체인 모두 동일하게 사용
  const mockSelect = vi.fn(() => ({
    single: mockSingle,    // createTournament: insert().select().single()
    order: mockOrder,      // listMyTournaments: select().order()
    eq: mockSelectEq,      // getTournament: select().eq().single()
  }));

  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));

  const mockFrom = vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    delete: mockDelete,
  }));

  return {
    mockSingle, mockOrder, mockSelectEq, mockDeleteEq,
    mockSelect, mockInsert, mockDelete, mockFrom,
  };
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
    mockOrder.mockClear();
    mockSelectEq.mockClear();
    mockDeleteEq.mockClear();
    mockDelete.mockClear();
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

// =============================================================================
// Task #118 — listMyTournaments · getTournament · deleteTournament (F-17)
// =============================================================================
describe("tournamentStorageModule — list/get/delete (Task #118, F-17)", () => {
  beforeEach(() => {
    useStateStore.getState().resetAll();
    useStateStore.getState().clearUser();
    useStateStore.setState({ isAuthInitialized: false });

    mockFrom.mockClear();
    mockInsert.mockClear();
    mockSelect.mockClear();
    mockSingle.mockClear();
    mockOrder.mockClear();
    mockSelectEq.mockClear();
    mockDeleteEq.mockClear();
    mockDelete.mockClear();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) listMyTournaments — 성공 경로
  // ───────────────────────────────────────────────────────────────────────────
  it("listMyTournaments: 로그인 상태에서 ITournament[] 반환한다", async () => {
    useStateStore.getState().setUser(mkUser("user-001"));

    const rows = [
      mkDbRow({ id: "tour-002", name: "두 번째", created_at: "2026-06-27T01:00:00.000Z" }),
      mkDbRow({ id: "tour-001", name: "첫 번째", created_at: "2026-06-27T00:00:00.000Z" }),
    ];
    mockOrder.mockResolvedValue({ data: rows, error: null });

    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");
    const result = await tournamentStorageModule.listMyTournaments();

    // 배열이 ITournament[]로 정규화됐는지 검증
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("tour-002");
    expect(result[1].id).toBe("tour-001");
    // ownerId, createdAt camelCase 정규화 확인
    expect(result[0].ownerId).toBe("user-001");

    // select("*").order("created_at", { ascending: false }) 호출 확인
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) listMyTournaments — 비로그인 에러
  // ───────────────────────────────────────────────────────────────────────────
  it("listMyTournaments: 비로그인 상태 → 인증 에러 throw", async () => {
    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");

    await expect(tournamentStorageModule.listMyTournaments()).rejects.toThrow(
      "로그인이 필요합니다",
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8) listMyTournaments — Supabase 에러
  // ───────────────────────────────────────────────────────────────────────────
  it("listMyTournaments: Supabase 에러 → throw", async () => {
    useStateStore.getState().setUser(mkUser("user-001"));
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB 오류" } });

    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");
    await expect(tournamentStorageModule.listMyTournaments()).rejects.toThrow("DB 오류");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9) getTournament — 성공 경로
  // ───────────────────────────────────────────────────────────────────────────
  it("getTournament: id로 단건 조회 시 ITournament 반환한다", async () => {
    const row = mkDbRow({ id: "tour-abc" });
    mockSingle.mockResolvedValue({ data: row, error: null });

    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");
    const result = await tournamentStorageModule.getTournament("tour-abc");

    expect(result.id).toBe("tour-abc");
    // select("*").eq("id", "tour-abc").single() 체인 확인
    expect(mockSelectEq).toHaveBeenCalledWith("id", "tour-abc");
    expect(mockSingle).toHaveBeenCalledTimes(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10) getTournament — 존재하지 않거나 RLS 차단
  // ───────────────────────────────────────────────────────────────────────────
  it("getTournament: Supabase 에러(행 없음·RLS 차단) → throw", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "PGRST116: single row not found" },
    });

    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");
    await expect(tournamentStorageModule.getTournament("not-exist")).rejects.toThrow(
      "PGRST116",
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11) deleteTournament — 비로그인 에러
  // ───────────────────────────────────────────────────────────────────────────
  it("deleteTournament: 비로그인 상태 → 인증 에러 throw", async () => {
    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");

    await expect(tournamentStorageModule.deleteTournament("tour-001")).rejects.toThrow(
      "로그인이 필요합니다",
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 12) deleteTournament — 성공 경로
  // ───────────────────────────────────────────────────────────────────────────
  it("deleteTournament: 로그인 상태에서 Supabase delete가 올바른 id로 호출된다", async () => {
    useStateStore.getState().setUser(mkUser("user-001"));
    mockDeleteEq.mockResolvedValue({ error: null });

    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");
    await tournamentStorageModule.deleteTournament("tour-xyz");

    // delete().eq("id", "tour-xyz") 호출 확인
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "tour-xyz");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 13) deleteTournament — Supabase 에러
  // ───────────────────────────────────────────────────────────────────────────
  it("deleteTournament: Supabase 에러 → throw", async () => {
    useStateStore.getState().setUser(mkUser("user-001"));
    mockDeleteEq.mockResolvedValue({ error: { message: "RLS 차단" } });

    const { tournamentStorageModule } = await import("@/modules/tournamentStorageModule");
    await expect(tournamentStorageModule.deleteTournament("tour-001")).rejects.toThrow(
      "RLS 차단",
    );
  });
});
