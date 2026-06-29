// TournamentPage 컴포넌트 테스트 — Task #27 (시작 버튼) + Task #32 (선택 핸들러) + Task #34 (자동 전환)
//
// 검증 범위:
//   1) activeTournament 없을 때 허브(/)로 리다이렉트
//   2) activeTournament 유효 시 시작하기 버튼 활성화(enabled)
//   3) currentMatches > 0 (이미 시작됨) 시 버튼 미노출 + 진행 중 섹션 표시
//   4) 시작하기 클릭 → startTournament() 호출
//   5) winner !== null 시 /result로 리다이렉트
//   6) 후보 0개인 activeTournament → 버튼 disabled + 경고 문구 표시
//   7) 후보 정확히 1개 → 버튼 disabled + 경고 문구 (경계값)
//   8) MatchCard가 현재 미결 대결로 렌더된다 (Task #32)
//   9) MatchCard 선택 → selectWinner 호출 (Task #32)
//  10) 이중 선택 방지 — winner 확정 후 재호출 차단 (NF-02, Task #32)
//  11) 모든 대결 완료(currentMatch=null) → "라운드 완료" 텍스트 표시 (Task #32)
//  12) 첫 번째 대결 완료 → 두 번째 대결로 MatchCard 자동 전환 (Task #34)
//  13) 부전승(isBye) 대결은 건너뛰고 다음 일반 대결로 자동 전환 (Task #34)

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import type { ITournament, IGame, ITournamentPair } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — next/navigation (useRouter)
// ─────────────────────────────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — tournamentModule (startTournament + selectWinner)
// ─────────────────────────────────────────────────────────────────────────────
const { mockStartTournament, mockSelectWinner } = vi.hoisted(() => ({
  mockStartTournament: vi.fn(),
  mockSelectWinner: vi.fn(),
}));

vi.mock("@/modules/tournamentModule", () => ({
  startTournament: mockStartTournament,
  selectWinner: mockSelectWinner,
  advanceRound: vi.fn(),
  isComplete: vi.fn(() => false),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — RoundProgressIndicator (Task #33 — 자체 테스트 파일에서 검증)
// WHY: TournamentPage 테스트 범위를 자동 전환 로직에 집중하기 위해 단순화
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("@/components/tournament/RoundProgressIndicator", () => ({
  RoundProgressIndicator: () => <div data-testid="round-progress-indicator" />,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — MatchCard (TournamentPage 통합 테스트용 단순 대체)
// WHY: MatchCard 자체는 MatchCard.test.tsx에서 검증. 여기서는 TournamentPage의
// 배선(어떤 pair로, onSelect가 올바르게 연결됐는지)만 검증한다.
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("@/components/tournament/MatchCard", () => ({
  MatchCard: ({
    pair,
    onSelect,
  }: {
    pair: ITournamentPair;
    onSelect: (game: IGame) => void;
  }) => (
    <div data-testid="match-card">
      <span data-testid="match-gameA">{pair.gameA.name}</span>
      {pair.gameB && <span data-testid="match-gameB">{pair.gameB.name}</span>}
      <button onClick={() => onSelect(pair.gameA)}>
        {pair.gameA.name} 선택
      </button>
    </div>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 데이터 팩토리
// ─────────────────────────────────────────────────────────────────────────────
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

const mkTournament = (overrides?: Partial<ITournament>): ITournament => ({
  id: "t-test",
  name: "테스트 토너먼트",
  ownerId: "u1",
  candidates: [mkGame("g1"), mkGame("g2")],
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// 렌더 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
async function renderTournamentPage() {
  const { TournamentPage } = await import("@/components/tournament/TournamentPage");
  return render(<TournamentPage />);
}

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────────────────────────────
describe("TournamentPage (Task #27, F-06)", () => {
  beforeEach(() => {
    // 각 테스트 전 스토어·모의 함수 초기화
    useStateStore.getState().resetAll();
    useStateStore.getState().clearActive();
    mockReplace.mockClear();
    mockStartTournament.mockClear();
    mockSelectWinner.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) activeTournament 없을 때 허브로 리다이렉트
  // ───────────────────────────────────────────────────────────────────────────
  it("activeTournament가 없으면 router.replace('/')를 호출해 허브로 리다이렉트한다", async () => {
    // activeTournament가 null인 상태(초기 스토어)로 렌더
    expect(useStateStore.getState().activeTournament).toBeNull();

    await renderTournamentPage();

    // useEffect로 replace("/")가 호출돼야 한다
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) activeTournament 유효 시 시작하기 버튼 활성화
  // ───────────────────────────────────────────────────────────────────────────
  it("activeTournament가 있고 아직 시작 전이면 시작하기 버튼이 enabled 상태다", async () => {
    useStateStore.getState().setActive(mkTournament());

    await renderTournamentPage();

    const btn = screen.getByRole("button", { name: "토너먼트 시작하기" });
    expect(btn).not.toBeDisabled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 이미 시작된 상태 — 시작 전 섹션 미표시, 진행 중 섹션 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("currentMatches가 1개 이상이면 시작 전 섹션이 사라지고 진행 중 섹션이 나타난다", async () => {
    useStateStore.getState().setActive(mkTournament());
    // currentMatches를 직접 설정해 이미 시작된 상태를 시뮬레이션
    useStateStore.getState().setRoundState(1, [
      { gameA: mkGame("g1"), gameB: mkGame("g2"), winner: null, isBye: false },
    ]);

    await renderTournamentPage();

    // 시작하기 버튼 미노출
    expect(screen.queryByRole("button", { name: "토너먼트 시작하기" })).toBeNull();
    // 진행 중 섹션 표시
    expect(screen.getByRole("region", { name: "토너먼트 진행 중" })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 시작하기 클릭 → startTournament 호출
  // ───────────────────────────────────────────────────────────────────────────
  it("시작하기 버튼 클릭 시 startTournament()가 호출된다", async () => {
    useStateStore.getState().setActive(mkTournament());

    await renderTournamentPage();

    const btn = screen.getByRole("button", { name: "토너먼트 시작하기" });
    fireEvent.click(btn);

    expect(mockStartTournament).toHaveBeenCalledOnce();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) winner !== null → /result로 리다이렉트
  // ───────────────────────────────────────────────────────────────────────────
  it("winner가 확정되면 router.replace('/result')를 호출한다", async () => {
    useStateStore.getState().setActive(mkTournament());
    // 우승자 설정 — activeTournament는 유지하면서 winner만 변경
    useStateStore.getState().setWinner(mkGame("champ"));

    await renderTournamentPage();

    expect(mockReplace).toHaveBeenCalledWith("/result");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) 후보 0개 activeTournament → 버튼 disabled + 경고 문구
  // ───────────────────────────────────────────────────────────────────────────
  it("후보가 없는 activeTournament는 버튼을 disabled로 표시하고 경고 문구를 노출한다", async () => {
    useStateStore.getState().setActive(mkTournament({ candidates: [] }));

    await renderTournamentPage();

    const btn = screen.getByRole("button", { name: "토너먼트 시작하기" });
    expect(btn).toBeDisabled();
    expect(screen.getByText("후보가 2개 이상 필요합니다.")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) 후보 정확히 1개 → 버튼 disabled + 경고 문구 (경계값 검증)
  // ───────────────────────────────────────────────────────────────────────────
  it("후보가 정확히 1개인 activeTournament는 버튼을 disabled로 표시하고 경고 문구를 노출한다", async () => {
    useStateStore.getState().setActive(mkTournament({ candidates: [mkGame("only")] }));

    await renderTournamentPage();

    const btn = screen.getByRole("button", { name: "토너먼트 시작하기" });
    expect(btn).toBeDisabled();
    expect(screen.getByText("후보가 2개 이상 필요합니다.")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8) MatchCard가 현재 미결 대결로 렌더 (Task #32)
  // ───────────────────────────────────────────────────────────────────────────
  it("진행 중일 때 현재 미결 대결이 MatchCard로 렌더된다 (Task #32)", async () => {
    useStateStore.getState().setActive(mkTournament());
    // currentMatches에 미결 페어 설정
    useStateStore.getState().setRoundState(1, [
      { gameA: mkGame("g1"), gameB: mkGame("g2"), winner: null, isBye: false },
    ]);

    await renderTournamentPage();

    // MatchCard 목(data-testid="match-card")이 렌더됐어야 한다
    expect(screen.getByTestId("match-card")).toBeInTheDocument();
    // 미결 페어의 게임명이 표시됐어야 한다
    expect(screen.getByTestId("match-gameA")).toHaveTextContent("Game g1");
    expect(screen.getByTestId("match-gameB")).toHaveTextContent("Game g2");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9) MatchCard 선택 → selectWinner 호출 (Task #32)
  // ───────────────────────────────────────────────────────────────────────────
  it("MatchCard에서 게임을 선택하면 selectWinner가 호출된다 (Task #32)", async () => {
    useStateStore.getState().setActive(mkTournament());
    const pair: ITournamentPair = {
      gameA: mkGame("g1"),
      gameB: mkGame("g2"),
      winner: null,
      isBye: false,
    };
    useStateStore.getState().setRoundState(1, [pair]);

    await renderTournamentPage();

    // MatchCard 목의 "Game g1 선택" 버튼 클릭
    fireEvent.click(screen.getByRole("button", { name: "Game g1 선택" }));

    expect(mockSelectWinner).toHaveBeenCalledOnce();
    expect(mockSelectWinner).toHaveBeenCalledWith(pair, pair.gameA);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10) NF-02 이중 선택 방지 — store winner 확정 후 재호출 차단 (Task #32)
  // ───────────────────────────────────────────────────────────────────────────
  it("winner가 이미 설정된 페어를 다시 선택하면 selectWinner가 호출되지 않는다 (NF-02)", async () => {
    useStateStore.getState().setActive(mkTournament());
    const gameA = mkGame("g1");
    // winner가 이미 확정된 페어를 store에 주입
    const resolvedPair: ITournamentPair = {
      gameA,
      gameB: mkGame("g2"),
      winner: gameA,
      isBye: false,
    };
    useStateStore.getState().setRoundState(1, [resolvedPair]);

    await renderTournamentPage();

    // winner가 이미 설정된 페어이므로 MatchCard 목은 렌더되지 않아야 한다
    // (currentMatch = currentMatches.find(m => m.winner === null) → null)
    expect(screen.queryByTestId("match-card")).toBeNull();
    // selectWinner가 호출됐다면 버그 — 여기서는 호출 안 됐어야 함
    expect(mockSelectWinner).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11) 모든 대결 완료(currentMatch=null) → "라운드 완료" 텍스트 (Task #32)
  // ───────────────────────────────────────────────────────────────────────────
  it("모든 대결이 완료되면 '라운드 완료' 안내 텍스트가 표시된다 (Task #32)", async () => {
    useStateStore.getState().setActive(mkTournament());
    const gameA = mkGame("g1");
    // 모든 페어에 winner 설정 (라운드 완료 상태)
    useStateStore.getState().setRoundState(1, [
      { gameA, gameB: mkGame("g2"), winner: gameA, isBye: false },
    ]);

    await renderTournamentPage();

    expect(screen.getByText("라운드 완료, 다음 라운드 준비 중…")).toBeInTheDocument();
    expect(screen.queryByTestId("match-card")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 12) 첫 번째 대결 완료 → 두 번째 대결로 MatchCard 자동 전환 (Task #34)
  // WHY: Zustand 구독으로 currentMatches 변경 시 currentMatch가 재계산된다.
  //      이 테스트는 store 직접 업데이트로 selectWinner 효과를 시뮬레이션해
  //      컴포넌트가 올바르게 전환되는지 검증한다.
  // ───────────────────────────────────────────────────────────────────────────
  it("첫 번째 대결 완료 후 두 번째 대결로 MatchCard가 자동 전환된다 (Task #34)", async () => {
    useStateStore.getState().setActive(mkTournament());
    const pair1: ITournamentPair = {
      gameA: mkGame("g1"),
      gameB: mkGame("g2"),
      winner: null,
      isBye: false,
    };
    const pair2: ITournamentPair = {
      gameA: mkGame("g3"),
      gameB: mkGame("g4"),
      winner: null,
      isBye: false,
    };
    useStateStore.getState().setRoundState(1, [pair1, pair2]);

    await renderTournamentPage();

    // 초기: pair1이 MatchCard에 표시됨
    expect(screen.getByTestId("match-gameA")).toHaveTextContent("Game g1");
    expect(screen.getByTestId("match-gameB")).toHaveTextContent("Game g2");

    // pair1 winner 확정 — selectWinner가 실행한 것과 동일한 store 변화를 직접 반영
    act(() => {
      useStateStore.getState().setRoundState(1, [
        { ...pair1, winner: pair1.gameA },
        pair2,
      ]);
    });

    // pair2로 자동 전환 확인
    expect(screen.getByTestId("match-gameA")).toHaveTextContent("Game g3");
    expect(screen.getByTestId("match-gameB")).toHaveTextContent("Game g4");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 13) 부전승(isBye) 대결은 건너뛰고 다음 일반 대결로 자동 전환 (Task #34)
  // WHY: isBye 페어는 winner가 이미 설정돼 있으므로 currentMatch 탐색에서 제외된다.
  //      일반 대결이 먼저 표시되고, 부전승은 경기 카운트에도 포함되지 않는다.
  // ───────────────────────────────────────────────────────────────────────────
  it("부전승 대결은 자동으로 건너뛰고 첫 번째 일반 대결이 MatchCard에 표시된다 (Task #34)", async () => {
    useStateStore.getState().setActive(mkTournament());
    const byeGame = mkGame("z");
    const normalPair: ITournamentPair = {
      gameA: mkGame("g1"),
      gameB: mkGame("g2"),
      winner: null,
      isBye: false,
    };
    // 부전승이 먼저, 일반 대결이 두 번째
    useStateStore.getState().setRoundState(1, [
      { gameA: byeGame, gameB: null, winner: byeGame, isBye: true },
      normalPair,
    ]);

    await renderTournamentPage();

    // 부전승 건너뛰고 일반 대결이 즉시 MatchCard에 표시됨
    expect(screen.getByTestId("match-gameA")).toHaveTextContent("Game g1");
    expect(screen.getByTestId("match-gameB")).toHaveTextContent("Game g2");
  });
});
