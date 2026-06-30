// ResultPage 통합 테스트 — Task #125 (F-19, UC-09) + Task #43 (F-10, 썸네일·축하 문구)
//
// 검증 범위:
//   1) winner·activeTournament 없음 → 빈 상태 "표시할 결과가 없어요." 표시
//   2) winner·activeTournament 있음 → 우승자 이름 표시
//   3) 마운트 시 saveResult 자동 호출 (자동 저장 배선)
//   4) saveResult + listResults 성공 → 이력 목록 표시
//   5) saveResult 실패 → role=alert 에러 메시지 표시
//   6) "새 토너먼트 시작" 클릭 → startNewTournament 호출 + router.push('/')
//   7) winner 없을 때 "허브로 돌아가기" 클릭 → router.push('/')
//   8) thumbnailUrl 있으면 img 렌더 (Task #43, F-10)
//   9) thumbnailUrl 없으면 img 미렌더 (Task #43, F-10)
//  10) 축하 문구 "GameCup 챔피언!" 표시 (Task #43, F-10)

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament, ITournamentResult } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — tournamentStorageModule
// ─────────────────────────────────────────────────────────────────────────────
const { mockSaveResult, mockListResults } = vi.hoisted(() => ({
  mockSaveResult: vi.fn(),
  mockListResults: vi.fn(),
}));

vi.mock("@/modules/tournamentStorageModule", () => ({
  tournamentStorageModule: {
    saveResult: mockSaveResult,
    listResults: mockListResults,
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — resultModule (startNewTournament)
// ─────────────────────────────────────────────────────────────────────────────
const { mockStartNewTournament } = vi.hoisted(() => ({
  mockStartNewTournament: vi.fn(),
}));

vi.mock("@/modules/resultModule", () => ({
  startNewTournament: mockStartNewTournament,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — next/navigation
// ─────────────────────────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 데이터 팩토리
// ─────────────────────────────────────────────────────────────────────────────
const mkGame = (id: string, name = `Game ${id}`): IGame => ({ id, name, thumbnailUrl: "" });
const mkTournament = (id: string): ITournament => ({
  id,
  name: `Tournament ${id}`,
  ownerId: "user-001",
  candidates: [mkGame("g1"), mkGame("g2")],
  createdAt: "2026-06-27T00:00:00.000Z",
});
const mkResult = (id: string, winnerGame: IGame): ITournamentResult => ({
  id,
  tournamentId: "tour-001",
  winner: winnerGame,
  playedAt: "2026-06-27T01:00:00.000Z",
  bracketSummary: null,
});

// ─────────────────────────────────────────────────────────────────────────────
// 렌더 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
async function renderResultPage() {
  const { ResultPage } = await import("@/components/result/ResultPage");
  return render(<ResultPage />);
}

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────────────────────────────
describe("ResultPage 통합 (Task #125)", () => {
  beforeEach(() => {
    useStateStore.getState().resetAll();
    useStateStore.setState({ myTournaments: [], activeTournament: null });
    mockSaveResult.mockResolvedValue(mkResult("res-001", mkGame("g1")));
    mockListResults.mockResolvedValue([]);
    mockPush.mockReset();
    mockStartNewTournament.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 빈 상태 — winner 없음
  // ───────────────────────────────────────────────────────────────────────────
  it("winner·activeTournament 없으면 빈 상태 안내가 표시된다", async () => {
    // store에 winner=null, activeTournament=null (기본 상태)
    await renderResultPage();

    expect(screen.getByText("표시할 결과가 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "허브로 돌아가기" })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 우승자 이름 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("winner·activeTournament가 있으면 우승자 이름이 표시된다", async () => {
    useStateStore.getState().setWinner(mkGame("champ", "챔피언 게임"));
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });

    await renderResultPage();

    // saveResult 완료 대기
    await waitFor(() => expect(mockSaveResult).toHaveBeenCalled());

    expect(screen.getByText("챔피언 게임")).toBeInTheDocument();
    expect(screen.getByText("Tournament tour-001")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 자동 저장 배선 — saveResult 호출 확인
  // ───────────────────────────────────────────────────────────────────────────
  it("마운트 시 saveResult가 tournamentId·winner로 자동 호출된다", async () => {
    const winner = mkGame("winner-1", "우승 게임");
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-abc") });

    await renderResultPage();

    await waitFor(() =>
      expect(mockSaveResult).toHaveBeenCalledWith("tour-abc", winner, null),
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 이력 표시 — listResults 결과
  // ───────────────────────────────────────────────────────────────────────────
  it("saveResult 성공 후 listResults 결과가 이력 목록으로 표시된다", async () => {
    // winner와 이력 항목은 다른 이름 — getByText 중복 방지
    const winner = mkGame("w1", "현재 우승자");
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });

    const historyResults = [
      mkResult("res-002", mkGame("w2", "지난 우승자1")),
      mkResult("res-001", mkGame("w3", "지난 우승자2")),
    ];
    mockListResults.mockResolvedValue(historyResults);

    await renderResultPage();

    // 이력 목록이 렌더될 때까지 대기
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "플레이 이력" })).toBeInTheDocument(),
    );
    expect(screen.getByText("지난 우승자1")).toBeInTheDocument();
    expect(screen.getByText("지난 우승자2")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 저장 실패 → role=alert
  // ───────────────────────────────────────────────────────────────────────────
  it("saveResult 실패 시 에러 메시지가 role=alert로 표시된다", async () => {
    useStateStore.getState().setWinner(mkGame("w1", "우승자"));
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });
    mockSaveResult.mockRejectedValue(new Error("저장 실패"));

    await renderResultPage();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("저장 실패");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) 새 토너먼트 시작 → startNewTournament + router.push('/')
  // ───────────────────────────────────────────────────────────────────────────
  it("'새 토너먼트 시작' 클릭 시 startNewTournament를 호출하고 /로 이동한다", async () => {
    useStateStore.getState().setWinner(mkGame("w1", "우승자"));
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });

    await renderResultPage();
    await waitFor(() => expect(mockSaveResult).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "새 토너먼트 시작" }));

    expect(mockStartNewTournament).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) 빈 상태에서 "허브로 돌아가기" → router.push('/')
  // ───────────────────────────────────────────────────────────────────────────
  it("빈 상태에서 '허브로 돌아가기' 클릭 시 /로 이동한다", async () => {
    // winner·activeTournament 없음
    await renderResultPage();

    fireEvent.click(screen.getByRole("button", { name: "허브로 돌아가기" }));

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8) thumbnailUrl 있으면 우승자 이미지 렌더 (Task #43, F-10)
  // WHY: next/image는 테스트 환경에서 일반 <img>로 렌더된다. alt 속성으로 요소를 조회한다.
  // ───────────────────────────────────────────────────────────────────────────
  it("thumbnailUrl이 있으면 우승자 썸네일 이미지가 렌더된다 (Task #43, F-10)", async () => {
    const winner = { id: "champ", name: "챔피언 게임", thumbnailUrl: "https://example.com/champ.jpg" };
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });

    await renderResultPage();
    await waitFor(() => expect(mockSaveResult).toHaveBeenCalled());

    // next/image는 jsdom에서 일반 img로 렌더된다
    const img = screen.getByRole("img", { name: "챔피언 게임" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "챔피언 게임");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9) thumbnailUrl 없으면 img 미렌더 (Task #43, F-10)
  // ───────────────────────────────────────────────────────────────────────────
  it("thumbnailUrl이 없으면 우승자 썸네일 이미지가 렌더되지 않는다 (Task #43, F-10)", async () => {
    // mkGame은 thumbnailUrl=""로 생성 — 이미지 없음
    useStateStore.getState().setWinner(mkGame("champ", "챔피언 게임"));
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });

    await renderResultPage();
    await waitFor(() => expect(mockSaveResult).toHaveBeenCalled());

    // img role 요소가 없어야 한다
    expect(screen.queryByRole("img")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10) 축하 문구 "GameCup 챔피언!" 표시 (Task #43, F-10)
  // ───────────────────────────────────────────────────────────────────────────
  it("우승자가 있으면 축하 문구 'GameCup 챔피언!'이 표시된다 (Task #43, F-10)", async () => {
    useStateStore.getState().setWinner(mkGame("champ", "챔피언 게임"));
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });

    await renderResultPage();
    await waitFor(() => expect(mockSaveResult).toHaveBeenCalled());

    expect(screen.getByText(/GameCup 챔피언/)).toBeInTheDocument();
  });
});
