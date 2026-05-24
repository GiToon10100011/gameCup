// 오류 상태 안정성 통합 테스트 (#16, Story #6 / F-11).
// "API 오류가 나도 서비스가 크래시 없이 정상 동작을 유지한다"를 모듈+스토어+컴포넌트 통합으로 검증.
//
// 검증 축:
//   1) API 실패가 예외로 전파되지 않는다 (호출자 크래시 방지 — searchWithErrorHandling는 항상 resolve)
//   2) 오류가 기존 store 상태(검색 캐시·후보)를 훼손하지 않는다
//   3) 오류 발생 → ErrorMessage 자동 표시 → 성공 검색 시 자동 복구(배너 사라짐 + 결과) — 라이브 구독
//   4) 연속 실패에도 계속 응답하며 항상 최신 오류를 반영한다
//   5) 오류 상태에서도 다른 store 동작(후보 등록/삭제)이 정상 작동한다
//
// fetchGames만 mock하고 ExternalApiError는 실제 클래스를 유지(instanceof 분기 검증).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

vi.mock("@/lib/externalApiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/externalApiClient")>(
    "@/lib/externalApiClient",
  );
  return { ...actual, fetchGames: vi.fn() };
});

import { searchWithErrorHandling, resetSearchDurationMeasurement } from "@/modules/searchModule";
import { ExternalApiError, fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { IGame } from "@/types/game";

const mockedFetchGames = fetchGames as unknown as ReturnType<typeof vi.fn>;

// 최소 IGame 팩토리
const mkGame = (id: string, name: string): IGame => ({ id, name, thumbnailUrl: "" });

describe("오류 상태 안정성 (#16, F-11)", () => {
  beforeEach(() => {
    useStateStore.getState().resetAll();
    mockedFetchGames.mockReset();
    resetSearchDurationMeasurement();
    // NF-01 측정 경로가 콘솔에 찍히지 않도록 침묵 처리
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 예외 미전파 — 호출자(View)가 크래시하지 않는다
  // ───────────────────────────────────────────────────────────────────────────
  it("API 실패 시 예외를 던지지 않고 빈 배열로 안전하게 응답한다", async () => {
    mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("RAWG down", 503));

    // reject가 아니라 resolve([])여야 함 — useQuery/View가 정상 흐름으로 처리
    await expect(searchWithErrorHandling("zelda")).resolves.toEqual([]);
    // 오류는 상태에 반영
    expect(useStateStore.getState().apiError).toEqual({ message: "RAWG down", statusCode: 503 });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 기존 상태 무손상 — 오류가 캐시·후보를 지우지 않는다
  // ───────────────────────────────────────────────────────────────────────────
  it("오류가 발생해도 이전 검색 캐시·후보 목록이 보존된다", async () => {
    // 사전 상태: 성공했던 검색 캐시 + 등록된 후보
    const store = useStateStore.getState();
    store.setCache("mario", [mkGame("1", "Mario")]);
    store.addCandidate(mkGame("9", "Picked"));

    mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("boom", 500));
    await searchWithErrorHandling("zelda");

    // 오류는 반영되지만 무관한 기존 상태는 그대로 유지되어야 함
    expect(useStateStore.getState().apiError).not.toBeNull();
    expect(useStateStore.getState().getCache("mario")).toHaveLength(1);
    expect(useStateStore.getState().getCandidates()).toHaveLength(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 오류 표시 → 성공 복구 (ErrorMessage 라이브 구독)
  // ───────────────────────────────────────────────────────────────────────────
  it("오류 발생 시 ErrorMessage가 자동으로 나타나고, 성공하면 사라진다", async () => {
    render(<ErrorMessage />);
    // 정상 출발 — alert 없음
    expect(screen.queryByRole("alert")).toBeNull();

    // 1차 실패 — store 갱신을 act로 감싸 React 재렌더를 flush
    mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("일시 오류", 503));
    await act(async () => {
      await searchWithErrorHandling("zelda");
    });
    // store 구독으로 ErrorMessage가 자동 표시
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("일시 오류")).toBeInTheDocument();

    // 2차 성공 — 같은 검색어 재시도가 성공하면 배너가 사라져야 함
    mockedFetchGames.mockResolvedValueOnce([mkGame("1", "Zelda")]);
    await act(async () => {
      await searchWithErrorHandling("zelda");
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 연속 실패에도 계속 응답 — 항상 최신 오류 반영
  // ───────────────────────────────────────────────────────────────────────────
  it("연속 실패해도 매번 빈 배열로 응답하고 최신 오류를 반영한다", async () => {
    mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("첫 번째 실패", 500));
    await expect(searchWithErrorHandling("a")).resolves.toEqual([]);

    mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("두 번째 실패", 502));
    await expect(searchWithErrorHandling("b")).resolves.toEqual([]);

    // 마지막 오류가 상태에 남아야 함 (이전 오류로 덮이지 않음)
    expect(useStateStore.getState().apiError).toEqual({ message: "두 번째 실패", statusCode: 502 });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 오류 중에도 다른 기능 정상 — 후보 등록/삭제가 막히지 않는다
  // ───────────────────────────────────────────────────────────────────────────
  it("오류 상태에서도 후보 등록·삭제 등 다른 store 동작이 정상 작동한다", async () => {
    // 오류 상태로 진입
    mockedFetchGames.mockRejectedValueOnce(new ExternalApiError("검색 실패", 503));
    await searchWithErrorHandling("zelda");
    expect(useStateStore.getState().apiError).not.toBeNull();

    // 오류가 떠 있는 동안에도 후보 관리(F-04/F-05)는 정상이어야 함
    const store = useStateStore.getState();
    expect(store.addCandidate(mkGame("3", "Sonic"))).toBe(true);
    expect(useStateStore.getState().getCandidates()).toHaveLength(1);

    useStateStore.getState().removeCandidate("3");
    expect(useStateStore.getState().getCandidates()).toHaveLength(0);

    // 후보 동작이 오류 상태를 건드리지 않았는지도 확인 (관심사 분리)
    expect(useStateStore.getState().apiError).not.toBeNull();
  });
});
