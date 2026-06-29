// TournamentPage 우승자 감지 통합 테스트 — Task #37 (F-10 최종 우승자 감지·결과 화면 전환)
//
// 목적: tournamentModule을 목킹하지 않고 실제 advanceRound를 실행해
//       "마지막 라운드 완료 → advanceRound → setWinner → /result 리다이렉트" 전체 흐름을 검증.
//
// TournamentPage.test.tsx의 기존 Test #5는 setWinner를 직접 호출해 리다이렉트만 검증한다.
// 이 파일은 advanceRound를 통한 경로(F-08 → F-10)를 함께 커버한다.
//
// 검증 범위:
//   1) 결승(2명) 라운드가 완료되면 advanceRound → winner 확정 → /result로 리다이렉트
//   2) 여러 라운드 후 최종 1명이 남으면 우승자로 확정된다
//   3) winner 확정 후 store에 우승 게임이 올바르게 저장된다

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — next/navigation (useRouter)
// WHY: 라우터 side-effect를 가로채 /result 호출 여부만 검증
// ─────────────────────────────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — MatchCard / RoundProgressIndicator (UI 격리)
// WHY: 우승자 감지 로직 테스트에 UI 렌더 복잡도 불필요
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("@/components/tournament/MatchCard", () => ({
  MatchCard: () => <div data-testid="match-card" />,
}));
vi.mock("@/components/tournament/RoundProgressIndicator", () => ({
  RoundProgressIndicator: () => <div data-testid="round-progress" />,
}));

// NOTE: tournamentModule은 목킹하지 않는다 — 실제 advanceRound 로직 사용

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
describe("TournamentPage — 우승자 감지 통합 흐름 (Task #37, F-10)", () => {
  beforeEach(() => {
    useStateStore.getState().resetAll();
    useStateStore.getState().clearActive();
    mockReplace.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 결승 라운드 완료 → advanceRound → winner 확정 → /result 리다이렉트
  // WHY: roundComplete useEffect → 실제 advanceRound(queue=[champ]) → setWinner → /result
  // ───────────────────────────────────────────────────────────────────────────
  it("결승 라운드가 완료되면 실제 advanceRound를 통해 /result로 리다이렉트된다 (Task #37, F-10)", async () => {
    const champ = mkGame("champ");
    const runnerUp = mkGame("runner");

    useStateStore.getState().setActive(mkTournament());
    // setRoundState가 nextRoundQueue를 초기화하므로 먼저 rounds 설정 후 큐 적재
    // currentMatches: 결승 대결, winner 확정 → roundComplete 조건 충족
    useStateStore.getState().setRoundState(1, [
      { gameA: champ, gameB: runnerUp, winner: champ, isBye: false },
    ]);
    // nextRoundQueue에 우승자 1명 적재 (advanceRound가 읽을 큐)
    useStateStore.getState().pushToNextRound(champ);

    await renderTournamentPage();

    // roundComplete useEffect → advanceRound(queue=[champ]) → setWinner(champ)
    // winner !== null useEffect → router.replace("/result")
    expect(mockReplace).toHaveBeenCalledWith("/result");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) advanceRound 실행 후 store.winner에 우승 게임이 저장된다
  // ───────────────────────────────────────────────────────────────────────────
  it("우승자가 확정되면 store.winner에 올바른 게임이 저장된다 (Task #37, F-10)", async () => {
    const champ = mkGame("champion");

    useStateStore.getState().setActive(mkTournament());
    useStateStore.getState().setRoundState(1, [
      { gameA: champ, gameB: mkGame("loser"), winner: champ, isBye: false },
    ]);
    useStateStore.getState().pushToNextRound(champ);

    await renderTournamentPage();

    expect(useStateStore.getState().winner).toEqual(champ);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 미결 대결이 남아 있으면 winner 미확정 상태를 유지한다
  // ───────────────────────────────────────────────────────────────────────────
  it("미결 대결이 남아 있으면 winner가 설정되지 않는다 (Task #37 경계값)", async () => {
    const champ = mkGame("champ");

    useStateStore.getState().setActive(mkTournament());
    // 두 번째 페어 미결 → roundComplete 조건 미충족
    useStateStore.getState().setRoundState(1, [
      { gameA: champ, gameB: mkGame("g2"), winner: champ, isBye: false },
      { gameA: mkGame("g3"), gameB: mkGame("g4"), winner: null, isBye: false },
    ]);
    useStateStore.getState().pushToNextRound(champ);

    await renderTournamentPage();

    expect(useStateStore.getState().winner).toBeNull();
    expect(mockReplace).not.toHaveBeenCalledWith("/result");
  });
});
