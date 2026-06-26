// HubPage 통합 테스트 — Task #120 (F-17 목록·관리 허브 페이지)
//
// 검증 범위:
//   1) 로딩 상태 — 마운트 시 "목록을 불러오는 중…" 표시
//   2) 빈 상태 — 토너먼트 없을 때 빈 상태 안내 + 새 토너먼트 링크
//   3) 목록 표시 — 토너먼트 카드 렌더 (이름·후보 개수)
//   4) 시작하기 클릭 → getTournament 호출 + router.push('/tournament')
//   5) 삭제 클릭 → deleteTournament 호출
//   6) 시작하기 API 에러 → role=alert 표시
//   7) 목록 조회 API 에러 → role=alert 표시

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — tournamentStorageModule
// vi.hoisted: TDZ 방지 — vi.mock 팩토리가 최상단으로 호이스팅되므로 const 변수를 직접
//   참조하면 초기화 전 접근 오류가 발생한다. vi.hoisted()로 팩토리 실행 전에 변수를 준비한다.
// ─────────────────────────────────────────────────────────────────────────────
const { mockListMyTournaments, mockGetTournament, mockDeleteTournament } = vi.hoisted(() => ({
  mockListMyTournaments: vi.fn(),
  mockGetTournament: vi.fn(),
  mockDeleteTournament: vi.fn(),
}));

vi.mock("@/modules/tournamentStorageModule", () => ({
  tournamentStorageModule: {
    listMyTournaments: mockListMyTournaments,
    getTournament: mockGetTournament,
    deleteTournament: mockDeleteTournament,
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — next/navigation
// ─────────────────────────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 데이터 팩토리
// ─────────────────────────────────────────────────────────────────────────────
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });
const mkTournament = (id: string, name = `Tournament ${id}`): ITournament => ({
  id,
  name,
  ownerId: "user-001",
  candidates: [mkGame("g1"), mkGame("g2")],
  createdAt: "2026-06-27T00:00:00.000Z",
});

// ─────────────────────────────────────────────────────────────────────────────
// 렌더 헬퍼 — 동적 import로 mock 등록 후 컴포넌트를 불러온다
// ─────────────────────────────────────────────────────────────────────────────
async function renderHub() {
  const { HubPage } = await import("@/components/hub/HubPage");
  return render(<HubPage />);
}

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────────────────────────────
describe("HubPage 통합 (Task #120)", () => {
  beforeEach(() => {
    // 스토어 초기화 + 라이브러리 슬롯도 명시적으로 비운다
    useStateStore.getState().resetAll();
    useStateStore.setState({ myTournaments: [], activeTournament: null });
    mockListMyTournaments.mockResolvedValue([]);
    mockGetTournament.mockResolvedValue(mkTournament("t1"));
    mockDeleteTournament.mockResolvedValue(undefined);
    mockPush.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 로딩 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("마운트 직후 로딩 텍스트가 표시된다", async () => {
    // listMyTournaments를 지연시켜 로딩 상태를 포착한다
    mockListMyTournaments.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    await renderHub();

    expect(screen.getByText("목록을 불러오는 중…")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 빈 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("토너먼트가 없으면 빈 상태 안내와 새 토너먼트 링크가 표시된다", async () => {
    // 스토어에 빈 목록 — listMyTournaments mock은 아무것도 채우지 않음
    await renderHub();

    // 로딩 해제 후 빈 상태 확인
    await waitFor(() =>
      expect(screen.queryByText("목록을 불러오는 중…")).not.toBeInTheDocument(),
    );

    // 빈 상태 문구 + 생성 링크
    expect(screen.getByText("아직 토너먼트가 없어요.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "새 토너먼트 만들기" }),
    ).toHaveAttribute("href", "/create");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 목록 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("토너먼트가 있으면 카드가 이름·후보 개수와 함께 렌더된다", async () => {
    // 스토어에 미리 목록을 주입한다 (listMyTournaments는 setList를 호출하지 않으므로 직접 주입)
    useStateStore.setState({
      myTournaments: [mkTournament("t1", "내 첫 토너먼트"), mkTournament("t2", "두 번째 토너먼트")],
    });
    await renderHub();

    await waitFor(() =>
      expect(screen.queryByText("목록을 불러오는 중…")).not.toBeInTheDocument(),
    );

    // 카드 이름 표시
    expect(screen.getByText("내 첫 토너먼트")).toBeInTheDocument();
    expect(screen.getByText("두 번째 토너먼트")).toBeInTheDocument();
    // 후보 개수 표시 (각 토너먼트 2개)
    expect(screen.getAllByText(/후보 2개/)).toHaveLength(2);
    // 시작하기 버튼 2개
    expect(screen.getAllByRole("button", { name: "시작하기" })).toHaveLength(2);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 시작하기 → getTournament + router.push
  // ───────────────────────────────────────────────────────────────────────────
  it("시작하기를 클릭하면 getTournament를 호출하고 /tournament로 이동한다", async () => {
    const tournament = mkTournament("t1", "내 첫 토너먼트");
    useStateStore.setState({ myTournaments: [tournament] });
    mockGetTournament.mockResolvedValue(tournament);

    await renderHub();
    await waitFor(() =>
      expect(screen.queryByText("목록을 불러오는 중…")).not.toBeInTheDocument(),
    );

    // 시작하기 클릭
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    await waitFor(() => expect(mockGetTournament).toHaveBeenCalledWith("t1"));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/tournament"));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 삭제 클릭 → deleteTournament 호출
  // ───────────────────────────────────────────────────────────────────────────
  it("삭제 버튼을 클릭하면 deleteTournament를 호출한다", async () => {
    const tournament = mkTournament("t1", "내 첫 토너먼트");
    useStateStore.setState({ myTournaments: [tournament] });

    await renderHub();
    await waitFor(() =>
      expect(screen.queryByText("목록을 불러오는 중…")).not.toBeInTheDocument(),
    );

    // aria-label="내 첫 토너먼트 삭제" 버튼 클릭
    fireEvent.click(screen.getByRole("button", { name: "내 첫 토너먼트 삭제" }));

    await waitFor(() => expect(mockDeleteTournament).toHaveBeenCalledWith("t1"));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) 시작하기 API 에러 → role=alert
  // ───────────────────────────────────────────────────────────────────────────
  it("getTournament 실패 시 에러 메시지가 role=alert로 표시된다", async () => {
    useStateStore.setState({ myTournaments: [mkTournament("t1", "내 첫 토너먼트")] });
    mockGetTournament.mockRejectedValue(new Error("네트워크 오류"));

    await renderHub();
    await waitFor(() =>
      expect(screen.queryByText("목록을 불러오는 중…")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("네트워크 오류");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) 목록 조회 API 에러 → role=alert
  // ───────────────────────────────────────────────────────────────────────────
  it("listMyTournaments 실패 시 에러 메시지가 role=alert로 표시된다", async () => {
    mockListMyTournaments.mockRejectedValue(new Error("목록 조회 실패"));

    await renderHub();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("목록 조회 실패");
  });
});
