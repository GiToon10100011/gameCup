// ResultPage 공유 버튼·링크 복사 UI 통합 테스트 — Task #128 (F-20, UC-10)
//
// 검증 범위:
//   1) saveResult 완료 후 "공유 링크 생성" 버튼이 표시된다
//   2) "공유 링크 생성" 클릭 시 createPublicShare(savedResult.id)가 호출된다
//   3) createPublicShare 성공 → 공유 URL이 화면에 표시된다
//   4) "복사" 버튼 클릭 시 navigator.clipboard.writeText가 shareUrl로 호출된다
//   5) createPublicShare 실패 → role=alert 에러 메시지가 표시된다
//   6) saveResult 실패(에러) → "공유 링크 생성" 버튼이 표시되지 않는다 (savedResult=null)

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament, ITournamentResult } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — tournamentStorageModule
// ─────────────────────────────────────────────────────────────────────────────
const { mockSaveResult, mockListResults, mockCreatePublicShare } = vi.hoisted(() => ({
  mockSaveResult: vi.fn(),
  mockListResults: vi.fn(),
  mockCreatePublicShare: vi.fn(),
}));

vi.mock("@/modules/tournamentStorageModule", () => ({
  tournamentStorageModule: {
    saveResult: mockSaveResult,
    listResults: mockListResults,
    createPublicShare: mockCreatePublicShare,
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — resultModule
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
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// navigator.clipboard Mock
// ─────────────────────────────────────────────────────────────────────────────
const mockWriteText = vi.fn();
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

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
// 공유 대기 헬퍼 — saveResult + savedResult 세팅까지 대기
// ─────────────────────────────────────────────────────────────────────────────
async function waitForSaveComplete() {
  await waitFor(() => expect(mockSaveResult).toHaveBeenCalled());
  // 공유 버튼이 나타날 때까지 대기 (savedResult 세팅 완료 신호)
  await waitFor(() => expect(screen.getByRole("button", { name: "공유 링크 생성" })).toBeInTheDocument());
}

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────────────────────────────
describe("ResultPage 공유 버튼·링크 복사 UI (Task #128, F-20)", () => {
  const winner = mkGame("champ", "우승 게임");
  const savedResult = mkResult("res-001", winner);

  beforeEach(() => {
    // store 초기화
    useStateStore.getState().resetAll();
    useStateStore.setState({ myTournaments: [], activeTournament: null });

    // 기본 mock 설정 — saveResult 성공, listResults 빈 배열
    mockSaveResult.mockResolvedValue(savedResult);
    mockListResults.mockResolvedValue([]);
    mockCreatePublicShare.mockReset();
    mockWriteText.mockReset();
    mockStartNewTournament.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) saveResult 완료 후 공유 버튼 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("saveResult 완료 후 '공유 링크 생성' 버튼이 나타난다", async () => {
    // winner·activeTournament 설정 — 자동 저장 트리거
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });

    await renderResultPage();
    await waitForSaveComplete();

    expect(screen.getByRole("button", { name: "공유 링크 생성" })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 공유 버튼 클릭 → createPublicShare(savedResult.id) 호출
  // ───────────────────────────────────────────────────────────────────────────
  it("'공유 링크 생성' 클릭 시 createPublicShare(savedResult.id)가 호출된다", async () => {
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });
    mockCreatePublicShare.mockResolvedValue({
      shareId: "deadbeef0000000000000000deadbeef",
      tournamentId: "tour-001",
      resultId: "res-001",
      createdAt: "2026-06-27T02:00:00.000Z",
    });

    await renderResultPage();
    await waitForSaveComplete();

    fireEvent.click(screen.getByRole("button", { name: "공유 링크 생성" }));

    await waitFor(() =>
      expect(mockCreatePublicShare).toHaveBeenCalledWith("res-001"),
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) createPublicShare 성공 → 공유 URL 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("createPublicShare 성공 시 공유 URL과 복사 버튼이 표시된다", async () => {
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });
    mockCreatePublicShare.mockResolvedValue({
      shareId: "deadbeef0000000000000000deadbeef",
      tournamentId: "tour-001",
      resultId: "res-001",
      createdAt: "2026-06-27T02:00:00.000Z",
    });

    await renderResultPage();
    await waitForSaveComplete();

    fireEvent.click(screen.getByRole("button", { name: "공유 링크 생성" }));

    // 공유 URL 표시 대기 (/share/{shareId} 포함)
    await waitFor(() =>
      expect(screen.getByText(/\/share\/deadbeef0000000000000000deadbeef/)).toBeInTheDocument(),
    );
    // 복사 버튼도 표시
    expect(screen.getByRole("button", { name: "복사" })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) "복사" 클릭 → clipboard.writeText(shareUrl)
  // ───────────────────────────────────────────────────────────────────────────
  it("'복사' 클릭 시 navigator.clipboard.writeText가 공유 URL로 호출된다", async () => {
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });
    mockCreatePublicShare.mockResolvedValue({
      shareId: "abc123",
      tournamentId: "tour-001",
      resultId: "res-001",
      createdAt: "2026-06-27T02:00:00.000Z",
    });
    mockWriteText.mockResolvedValue(undefined);

    await renderResultPage();
    await waitForSaveComplete();

    fireEvent.click(screen.getByRole("button", { name: "공유 링크 생성" }));
    await waitFor(() => screen.getByRole("button", { name: "복사" }));

    fireEvent.click(screen.getByRole("button", { name: "복사" }));

    await waitFor(() =>
      expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining("/share/abc123")),
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) createPublicShare 실패 → role=alert 에러
  // ───────────────────────────────────────────────────────────────────────────
  it("createPublicShare 실패 시 role=alert 에러 메시지가 표시된다", async () => {
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });
    mockCreatePublicShare.mockRejectedValue(new Error("공유 생성 실패"));

    await renderResultPage();
    await waitForSaveComplete();

    fireEvent.click(screen.getByRole("button", { name: "공유 링크 생성" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("공유 생성 실패");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) saveResult 실패 → 공유 버튼 표시 안 됨 (savedResult=null)
  // ───────────────────────────────────────────────────────────────────────────
  it("saveResult 실패 시 '공유 링크 생성' 버튼이 표시되지 않는다", async () => {
    useStateStore.getState().setWinner(winner);
    useStateStore.setState({ activeTournament: mkTournament("tour-001") });
    mockSaveResult.mockRejectedValue(new Error("저장 실패"));

    await renderResultPage();

    // 에러 배너 대기
    await screen.findByRole("alert");

    // savedResult가 null이므로 공유 버튼은 없어야 한다
    expect(screen.queryByRole("button", { name: "공유 링크 생성" })).not.toBeInTheDocument();
  });
});
