// RoundProgressIndicator 컴포넌트 단위 테스트 — Task #33/#36 (F-07 라운드 진행 표시)
//
// 검증 범위:
//   1) currentRound === 0 이면 아무것도 렌더하지 않는다
//   2) 참가자 수 기반 라운드 명칭이 표시된다 ("결승", "4강" 등) (Task #36)
//   3) 경기 카운터가 표시된다 ("N/M 경기")
//   4) 완료된 경기 수에 따라 카운터가 갱신된다
//   5) 부전승(isBye) 경기는 카운터에서 제외된다
//   6) 모든 경기 완료 시 "M/M 경기"로 표시된다

import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useStateStore } from "@/store/stateStore";
import { RoundProgressIndicator } from "@/components/tournament/RoundProgressIndicator";
import type { IGame } from "@/types/game";

// 최소 IGame 팩토리
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

describe("RoundProgressIndicator (Task #33/#36, F-07)", () => {
  beforeEach(() => {
    // 각 테스트 전 스토어 초기화
    useStateStore.getState().resetAll();
    useStateStore.getState().clearActive();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) currentRound === 0 → 미렌더
  // ───────────────────────────────────────────────────────────────────────────
  it("currentRound가 0이면 아무것도 렌더하지 않는다", () => {
    // 초기 스토어(currentRound=0)로 렌더
    const { container } = render(<RoundProgressIndicator />);

    expect(container.firstChild).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 참가자 수 기반 라운드 명칭 표시 (Task #36)
  // ───────────────────────────────────────────────────────────────────────────
  it("2명(1페어) 라운드에서 '결승' 레이블이 표시된다 (Task #36)", () => {
    // 2명 = 1페어 → playerCount=2 → getRoundName(2)="결승"
    useStateStore.getState().setRoundState(1, [
      { gameA: mkGame("A"), gameB: mkGame("B"), winner: null, isBye: false },
    ]);

    render(<RoundProgressIndicator />);

    expect(screen.getByText("결승")).toBeInTheDocument();
  });

  it("4명(2페어) 라운드에서 '4강' 레이블이 표시된다 (Task #36)", () => {
    // 4명 = 2페어 → playerCount=4 → getRoundName(4)="4강"
    useStateStore.getState().setRoundState(1, [
      { gameA: mkGame("A"), gameB: mkGame("B"), winner: null, isBye: false },
      { gameA: mkGame("C"), gameB: mkGame("D"), winner: null, isBye: false },
    ]);

    render(<RoundProgressIndicator />);

    expect(screen.getByText("4강")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 경기 카운터 — 첫 번째 경기 시작 시
  // ───────────────────────────────────────────────────────────────────────────
  it("대결이 2개이고 아직 완료 전이면 '1/2 경기'가 표시된다", () => {
    // 4명(2페어) → "4강" 레이블 + "1/2 경기" 카운터
    useStateStore.getState().setRoundState(1, [
      { gameA: mkGame("A"), gameB: mkGame("B"), winner: null, isBye: false },
      { gameA: mkGame("C"), gameB: mkGame("D"), winner: null, isBye: false },
    ]);

    render(<RoundProgressIndicator />);

    expect(screen.getByText("1/2 경기")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 완료된 경기 수에 따라 카운터 갱신
  // ───────────────────────────────────────────────────────────────────────────
  it("첫 번째 대결이 완료되면 '2/2 경기'로 카운터가 갱신된다", () => {
    const gameA = mkGame("A");
    useStateStore.getState().setRoundState(1, [
      // 첫 번째 페어 — winner 확정
      { gameA, gameB: mkGame("B"), winner: gameA, isBye: false },
      // 두 번째 페어 — 미결
      { gameA: mkGame("C"), gameB: mkGame("D"), winner: null, isBye: false },
    ]);

    render(<RoundProgressIndicator />);

    expect(screen.getByText("2/2 경기")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) isBye 경기는 카운터에서 제외
  // ───────────────────────────────────────────────────────────────────────────
  it("부전승(isBye) 경기는 총 경기 수에서 제외되고 라운드 명칭은 실제 참가자 수 기반이다", () => {
    const byeGame = mkGame("Z");
    useStateStore.getState().setRoundState(1, [
      // 일반 대결 (미결) — 2명
      { gameA: mkGame("A"), gameB: mkGame("B"), winner: null, isBye: false },
      // 부전승 (자동 완료) — 1명
      { gameA: byeGame, gameB: null, winner: byeGame, isBye: true },
    ]);

    render(<RoundProgressIndicator />);

    // playerCount = 2(일반) + 1(부전승) = 3 → "3강"
    expect(screen.getByText("3강")).toBeInTheDocument();
    // 카운터: 부전승 제외, 완료: 0, 전체: 1 → "1/1 경기"
    expect(screen.getByText("1/1 경기")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) 모든 경기 완료 → "M/M 경기"
  // ───────────────────────────────────────────────────────────────────────────
  it("모든 대결이 완료되면 'M/M 경기'가 표시된다", () => {
    const gameA = mkGame("A");
    const gameC = mkGame("C");
    useStateStore.getState().setRoundState(1, [
      { gameA, gameB: mkGame("B"), winner: gameA, isBye: false },
      { gameA: gameC, gameB: mkGame("D"), winner: gameC, isBye: false },
    ]);

    render(<RoundProgressIndicator />);

    expect(screen.getByText("2/2 경기")).toBeInTheDocument();
  });
});
