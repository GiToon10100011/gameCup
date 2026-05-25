// 메인 화면(app/page.tsx) 통합 테스트 — Epic #1 통합(Story #5·#6·#7·#8) 배선 검증.
//
// 개별 컴포넌트·모듈의 단위 테스트는 이미 충분하므로, 본 테스트는 "페이지 배선"에만 집중한다:
//   1) 검색어 입력 → 디바운싱 → 드롭다운에 결과 표시 (Story #5)
//   2) 결과 선택 → 후보 목록에 추가 + 드롭다운 닫힘 ("추가 후 드롭다운 닫힘" = Story #7 AC)
//   3) 이미 등록된 게임 재선택 → 중복 토스트 표시 (F-04, Story #7)
//   4) API 실패 → 오류 배너(ErrorMessage) 표시 (F-11, Story #6)
//
// fetchGames만 mock하고 ExternalApiError는 실제 클래스를 유지(instanceof 분기 보존).
// 디바운스(300ms) + 비동기 쿼리는 가짜 타이머 대신 실제 타이머 + findBy/waitFor로 기다린다
// (TanStack Query와 fake timer 혼용 시의 취약성을 피하려는 의도적 선택).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 외부 API 게이트웨이만 mock — 네트워크 없이 결정적으로 검증한다.
vi.mock("@/lib/externalApiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/externalApiClient")>(
    "@/lib/externalApiClient",
  );
  return { ...actual, fetchGames: vi.fn() };
});

import HomePage from "@/app/page";
import { ExternalApiError, fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";
import { resetSearchDurationMeasurement } from "@/modules/searchModule";
import type { IGame } from "@/types/game";

const mockedFetchGames = fetchGames as unknown as ReturnType<typeof vi.fn>;

// 최소 IGame 팩토리 — thumbnailUrl은 빈 문자열로 두어 placeholder 경로를 타게 한다.
const mkGame = (id: string, name: string): IGame => ({ id, name, thumbnailUrl: "" });

// 매 테스트 새 QueryClient — 캐시·재시도 격리. retry off로 상태가 즉시 반영되게 한다.
function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe("메인 화면 통합 (Epic #1)", () => {
  // 각 테스트 시작 전 store·mock·측정값을 초기화하고, NF-01 진단 로그를 침묵 처리한다.
  beforeEach(() => {
    useStateStore.getState().resetAll();
    mockedFetchGames.mockReset();
    resetSearchDurationMeasurement();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  // DOM·mock·spy 누수 차단으로 각 케이스 독립성 보장.
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 검색 → 드롭다운 결과 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("검색어를 입력하면 드롭다운에 결과가 표시된다 (Story #5)", async () => {
    mockedFetchGames.mockResolvedValue([mkGame("1", "Zelda")]);
    renderHome();

    // 검색어 입력 → 디바운스(300ms) 후 검색 실행 → 드롭다운 option 등장까지 대기
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zelda" } });
    const option = await screen.findByRole("option", { name: /Zelda/ });

    expect(option).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 선택 → 후보 추가 + 드롭다운 닫힘 (Story #7 AC)
  // ───────────────────────────────────────────────────────────────────────────
  it("결과를 선택하면 후보에 추가되고 드롭다운이 닫힌다 (Story #7 AC)", async () => {
    mockedFetchGames.mockResolvedValue([mkGame("1", "Zelda")]);
    renderHome();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zelda" } });
    const option = await screen.findByRole("option", { name: /Zelda/ });

    // 선택 → 후보 목록(role=list)에 추가되고, 드롭다운(role=listbox)은 사라져야 한다.
    fireEvent.click(option);

    const list = await screen.findByRole("list");
    expect(within(list).getByText("Zelda")).toBeInTheDocument();
    // "추가 후 드롭다운 닫힘" — listbox가 더 이상 존재하지 않아야 함
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 중복 재선택 → 토스트 (F-04)
  // ───────────────────────────────────────────────────────────────────────────
  it("이미 등록된 게임을 다시 선택하면 중복 토스트가 표시된다 (F-04)", async () => {
    mockedFetchGames.mockResolvedValue([mkGame("1", "Zelda")]);
    renderHome();

    // 1차 등록 — 선택 후 후보 목록에 들어가고 드롭다운은 닫힌다.
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zelda" } });
    fireEvent.click(await screen.findByRole("option", { name: /Zelda/ }));
    await screen.findByRole("list");

    // 드롭다운 재오픈 — 다른 검색어로 같은 게임을 다시 노출시켜 중복 선택을 유도한다.
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zeld" } });
    fireEvent.click(await screen.findByRole("option", { name: /Zelda/ }));

    // 중복 → role=status 토스트가 안내 문구와 함께 표시되어야 한다.
    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("이미 후보에 등록된 게임입니다.");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) API 실패 → 오류 배너 (F-11)
  // ───────────────────────────────────────────────────────────────────────────
  it("검색 API가 실패하면 오류 배너가 표시된다 (F-11)", async () => {
    mockedFetchGames.mockRejectedValue(new ExternalApiError("RAWG down", 503));
    renderHome();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zelda" } });

    // searchWithErrorHandling이 실패를 store.apiError로 반영 → ErrorMessage가 구독해 alert 표시.
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("RAWG down");
  });
});
