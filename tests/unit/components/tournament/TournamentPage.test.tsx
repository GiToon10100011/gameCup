// TournamentPage 컴포넌트 테스트 — Task #27 (F-06 시작 조건·시작 버튼)
//
// 검증 범위:
//   1) activeTournament 없을 때 허브(/)로 리다이렉트
//   2) activeTournament 유효 시 시작하기 버튼 활성화(enabled)
//   3) currentMatches > 0 (이미 시작됨) 시 버튼 미노출 + 진행 중 섹션 표시
//   4) 시작하기 클릭 → startTournament() 호출
//   5) winner !== null 시 /result로 리다이렉트
//   6) 후보 0개인 activeTournament → 버튼 disabled + 경고 문구 표시

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import type { ITournament, IGame } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — next/navigation (useRouter)
// ─────────────────────────────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock — tournamentModule (startTournament)
// ─────────────────────────────────────────────────────────────────────────────
const { mockStartTournament } = vi.hoisted(() => ({
  mockStartTournament: vi.fn(),
}));

vi.mock("@/modules/tournamentModule", () => ({
  startTournament: mockStartTournament,
  selectWinner: vi.fn(),
  advanceRound: vi.fn(),
  isComplete: vi.fn(() => false),
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
    mockReplace.mockClear();
    mockStartTournament.mockClear();
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
});
