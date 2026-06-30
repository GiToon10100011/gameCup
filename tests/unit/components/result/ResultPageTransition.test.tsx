// ResultPage 초기 화면 전환 통합 테스트 — Task #46 (F-13, Story #42 AC)
//
// 목적: "새 토너먼트 시작" 클릭 후 실제 startNewTournament() 동작과
//       /로의 화면 전환을 함께 검증한다.
//
// ResultPage.test.tsx와의 차이:
//   - resultModule을 모킹하지 않아 진짜 startNewTournament() → resetAll()이 실행됨
//   - 버튼 클릭 후 스토어 상태 초기화 + router.push('/') 두 가지를 동시에 검증
//
// 검증 범위:
//   1) 새 토너먼트 시작 클릭 → router.push('/') 호출 (화면 전환)
//   2) 새 토너먼트 시작 클릭 후 candidates 초기화 (스토어 리셋 연동)
//   3) 새 토너먼트 시작 클릭 후 winner 초기화 (스토어 리셋 연동)
//   4) 새 토너먼트 시작 클릭 후 currentRound 초기화 (스토어 리셋 연동)
//   5) currentUser(로그인 세션)는 전환 후에도 보존

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament, IUser } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — tournamentStorageModule (saveResult·listResults 사이드이펙트 차단)
// WHY: ResultPage 마운트 시 saveResult가 자동 호출됨. 본 테스트는 그 결과가 아닌
//      버튼 클릭 후 상태 변화에만 집중하므로 부수효과를 최소화한다.
// ─────────────────────────────────────────────────────────────────────────────
const { mockSaveResult } = vi.hoisted(() => ({
  mockSaveResult: vi.fn().mockResolvedValue({
    id: "res-transition",
    tournamentId: "tour-001",
    winner: { id: "champ", name: "챔피언", thumbnailUrl: "" },
    playedAt: "2026-06-30T00:00:00Z",
    bracketSummary: null,
  }),
}));

vi.mock("@/modules/tournamentStorageModule", () => ({
  tournamentStorageModule: {
    saveResult: mockSaveResult,
    listResults: vi.fn().mockResolvedValue([]),
  },
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
const mkTournament = (id = "tour-001"): ITournament => ({
  id,
  name: `Tournament ${id}`,
  ownerId: "user-001",
  candidates: [mkGame("g1"), mkGame("g2")],
  createdAt: "2026-06-30T00:00:00Z",
});
const mkUser = (): IUser => ({ id: "u-1", email: "test@test.com", createdAt: "2026-06-30T00:00:00Z" });

// ─────────────────────────────────────────────────────────────────────────────
// 렌더 헬퍼 — resultModule을 모킹하지 않으므로 실제 startNewTournament가 실행됨
// ─────────────────────────────────────────────────────────────────────────────
async function renderResultPage() {
  const { ResultPage } = await import("@/components/result/ResultPage");
  return render(<ResultPage />);
}

describe("ResultPage 초기 화면 전환 (Task #46, F-13 Story #42 AC)", () => {
  beforeEach(() => {
    // 깨끗한 스토어 상태로 시작
    useStateStore.getState().resetAll();
    useStateStore.getState().clearActive();
    mockPush.mockReset();
    mockSaveResult.mockReset();
    // 기본 응답 재설정 (beforeEach에서 mockReset으로 초기화되므로 재정의 필요)
    mockSaveResult.mockResolvedValue({
      id: "res-transition",
      tournamentId: "tour-001",
      winner: { id: "champ", name: "챔피언", thumbnailUrl: "" },
      playedAt: "2026-06-30T00:00:00Z",
      bracketSummary: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1) "새 토너먼트 시작" 클릭 → router.push('/') (화면 전환 검증)
  // WHY: F-13 AC: "초기화 후 검색/후보 등록 화면으로 돌아간다"
  // ─────────────────────────────────────────────────────────────────────────
  it("'새 토너먼트 시작' 클릭 시 router.push('/')가 호출된다 (Task #46, F-13)", async () => {
    useStateStore.getState().setWinner(mkGame("champ", "챔피언"));
    useStateStore.setState({ activeTournament: mkTournament() });

    await renderResultPage();
    // saveResult 비동기 완료까지 대기
    await waitFor(() => expect(mockSaveResult).toHaveBeenCalled());

    // act 내부에서 마이크로태스크와 매크로태스크를 모두 소진해 Zustand 구독 업데이트를 캡처한다.
    // WHY: resetAll()은 Zustand 상태를 동기적으로 갱신하지만, React 리렌더는 비동기로 스케줄된다.
    //      setTimeout(0)으로 매크로태스크를 한 번 flush해야 act() 경계 안에 들어온다.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "새 토너먼트 시작" }));
      await new Promise((r) => setTimeout(r, 0));
    });

    // 초기 화면("/")으로 전환 검증
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2) 클릭 후 candidates 초기화 (실제 startNewTournament 실행 검증)
  // WHY: 실제 startNewTournament()가 실행됐는지를 스토어 상태 변화로 확인한다.
  //      모킹된 테스트와 달리 resetAll() 호출 여부를 직접 증명.
  // ─────────────────────────────────────────────────────────────────────────
  it("클릭 후 candidates가 초기화된다 (Task #46, F-13 스토어 연동)", async () => {
    // 후보를 3개 등록한 상태에서 토너먼트가 끝난 상황
    useStateStore.getState().addCandidate(mkGame("g1"));
    useStateStore.getState().addCandidate(mkGame("g2"));
    useStateStore.getState().addCandidate(mkGame("g3"));
    useStateStore.getState().setWinner(mkGame("champ", "챔피언"));
    useStateStore.setState({ activeTournament: mkTournament() });

    await renderResultPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "새 토너먼트 시작" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "새 토너먼트 시작" }));

    // 실제 resetAll()이 실행됐음을 후보 초기화로 검증
    expect(useStateStore.getState().candidates).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3) 클릭 후 winner 초기화
  // WHY: 다음 토너먼트 시작 시 이전 우승자가 남아 있으면 결과 화면이 다시 표시될 수 있다.
  // ─────────────────────────────────────────────────────────────────────────
  it("클릭 후 winner가 null로 초기화된다 (Task #46, F-13 이전 데이터 제거)", async () => {
    const champ = mkGame("champ", "챔피언");
    useStateStore.getState().setWinner(champ);
    useStateStore.setState({ activeTournament: mkTournament() });

    await renderResultPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "새 토너먼트 시작" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "새 토너먼트 시작" }));

    expect(useStateStore.getState().winner).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4) 클릭 후 currentRound 초기화
  // WHY: 라운드 번호가 남아 있으면 새 토너먼트에서 잘못된 라운드부터 시작될 수 있다.
  // ─────────────────────────────────────────────────────────────────────────
  it("클릭 후 currentRound가 0으로 초기화된다 (Task #46, F-13 이전 데이터 제거)", async () => {
    const champ = mkGame("champ", "챔피언");
    // 라운드 3에서 토너먼트가 끝난 상황
    useStateStore.getState().setRoundState(3, [
      { gameA: champ, gameB: mkGame("runner"), winner: champ, isBye: false },
    ]);
    useStateStore.getState().setWinner(champ);
    useStateStore.setState({ activeTournament: mkTournament() });

    await renderResultPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "새 토너먼트 시작" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "새 토너먼트 시작" }));

    expect(useStateStore.getState().currentRound).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5) currentUser 보존 — 화면 전환 후에도 로그인 세션 유지
  // WHY: F-13 AC에는 없지만 resetAll() 명세 상 currentUser는 보존돼야 한다.
  //      화면 전환 후 사용자가 다시 로그인해야 하면 UX 파괴이므로 반드시 검증.
  // ─────────────────────────────────────────────────────────────────────────
  it("클릭 후 currentUser(로그인 세션)는 보존된다 (Task #46, F-13 세션 유지)", async () => {
    const user = mkUser();
    useStateStore.getState().setUser(user);
    useStateStore.getState().setWinner(mkGame("champ", "챔피언"));
    useStateStore.setState({ activeTournament: mkTournament() });

    await renderResultPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "새 토너먼트 시작" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "새 토너먼트 시작" }));

    // 화면 전환 후에도 세션 유지
    expect(useStateStore.getState().currentUser).toEqual(user);
  });
});
