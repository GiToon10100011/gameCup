// RAWG API 게이트웨이(`lib/externalApiClient.ts`)의 단위 테스트.
// Issue #11 — `searchGames()` (UML 명칭: ExternalApiClient.fetchGames) 동작을 검증한다.
//
// 검증 범위:
//   1) 정상 응답 → 정규화된 IGame[] 반환 + URL에 API 키·검색어·page_size 인코딩 포함
//   2) background_image=null이면 thumbnailUrl을 빈 문자열로 fallback
//   3) HTTP 비-200 응답 → ExternalApiError(statusCode) throw
//   4) 환경변수 NEXT_PUBLIC_RAWG_KEY 미설정 → ExternalApiError(statusCode=0) throw
//   5) 환경변수 NEXT_PUBLIC_RAWG_BASE_URL 설정 시 해당 베이스 URL로 호출
//
// 외부 fetch는 vi.spyOn(globalThis, "fetch")로 가짜 응답을 주입한다.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 테스트 대상은 모듈 캐시를 매번 새로 evaluate해야 한다.
// 이유: BASE_URL은 모듈 로드 시점에 env를 한 번 읽어 상수에 고정되므로,
// 환경변수 시나리오마다 vi.resetModules()로 모듈을 다시 불러와야 한다.

describe("externalApiClient.fetchGames (Issue #11)", () => {
  // 각 테스트는 fetch와 env를 깨끗한 상태에서 시작해야 함.
  beforeEach(() => {
    // 모듈 캐시 초기화 — BASE_URL 상수가 매번 새 env를 읽도록.
    vi.resetModules();
    // 기본 API 키 — 개별 테스트에서 덮어쓰거나 삭제 가능.
    process.env.NEXT_PUBLIC_RAWG_KEY = "test-key";
    delete process.env.NEXT_PUBLIC_RAWG_BASE_URL;
  });

  afterEach(() => {
    // 다음 테스트로 mock·env가 새지 않도록 정리.
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_RAWG_KEY;
    delete process.env.NEXT_PUBLIC_RAWG_BASE_URL;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 정상 응답 정규화
  // ───────────────────────────────────────────────────────────────────────────
  it("정상 응답을 IGame[]으로 정규화한다", async () => {
    // RAWG가 돌려줄 가짜 응답 — id는 number, name + background_image 포함
    const fakePayload = {
      results: [
        { id: 1, name: "Game A", background_image: "https://media.rawg.io/a.jpg" },
        { id: 2, name: "Game B", background_image: "https://media.rawg.io/b.jpg" },
      ],
    };

    // fetch를 spy로 대체 — ok=true + json() 호출 시 위 payload 반환
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(fakePayload), { status: 200 }),
    );

    const { fetchGames } = await import("@/lib/externalApiClient");
    const result = await fetchGames("zelda");

    // id는 string으로 변환, name/thumbnailUrl 그대로 매핑
    expect(result).toEqual([
      { id: "1", name: "Game A", thumbnailUrl: "https://media.rawg.io/a.jpg" },
      { id: "2", name: "Game B", thumbnailUrl: "https://media.rawg.io/b.jpg" },
    ]);

    // 호출된 URL을 검증 — key/search/page_size가 모두 인코딩되어 포함
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://api.rawg.io/api/games");
    expect(calledUrl).toContain("key=test-key");
    expect(calledUrl).toContain("search=zelda");
    expect(calledUrl).toContain("page_size=10");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) background_image=null fallback
  // ───────────────────────────────────────────────────────────────────────────
  it("background_image=null이면 thumbnailUrl을 빈 문자열로 fallback한다", async () => {
    const fakePayload = {
      results: [{ id: 99, name: "No Thumb", background_image: null }],
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(fakePayload), { status: 200 }),
    );

    const { fetchGames } = await import("@/lib/externalApiClient");
    const result = await fetchGames("noimg");

    expect(result).toEqual([{ id: "99", name: "No Thumb", thumbnailUrl: "" }]);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) HTTP 비-200 응답 → ExternalApiError
  // ───────────────────────────────────────────────────────────────────────────
  it("HTTP 500 응답이면 ExternalApiError를 throw하고 statusCode를 보존한다", async () => {
    // ok=false인 Response — Response 생성자가 4xx/5xx를 그대로 보존
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Error", { status: 500, statusText: "Internal Error" }),
    );

    const { fetchGames, ExternalApiError } = await import("@/lib/externalApiClient");

    // rejects matcher로 비동기 throw 검증
    await expect(fetchGames("zelda")).rejects.toBeInstanceOf(ExternalApiError);
    await expect(fetchGames("zelda")).rejects.toMatchObject({ statusCode: 500 });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) API 키 미설정
  // ───────────────────────────────────────────────────────────────────────────
  it("NEXT_PUBLIC_RAWG_KEY 미설정 시 statusCode=0으로 즉시 throw한다", async () => {
    // 키 제거 — fetch가 호출되기 전 단계에서 실패해야 함
    delete process.env.NEXT_PUBLIC_RAWG_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { fetchGames, ExternalApiError } = await import("@/lib/externalApiClient");
    await expect(fetchGames("zelda")).rejects.toBeInstanceOf(ExternalApiError);
    await expect(fetchGames("zelda")).rejects.toMatchObject({ statusCode: 0 });

    // fetch 자체가 호출되지 않아야 함 — 외부 호출 비용을 막는 1차 가드
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) BASE_URL override
  // ───────────────────────────────────────────────────────────────────────────
  it("NEXT_PUBLIC_RAWG_BASE_URL 설정 시 해당 베이스 URL로 호출한다", async () => {
    process.env.NEXT_PUBLIC_RAWG_BASE_URL = "https://proxy.example.com/rawg";
    const fakePayload = { results: [] };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(fakePayload), { status: 200 }),
    );

    const { fetchGames } = await import("@/lib/externalApiClient");
    await fetchGames("zelda");

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl.startsWith("https://proxy.example.com/rawg/games")).toBe(true);
  });
});
