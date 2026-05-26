// Supabase 클라이언트 게이트웨이(`lib/supabaseClient.ts`)의 단위 테스트.
// 이슈 #104 — 두 가지 클라이언트 팩토리와 환경 변수 가드를 검증한다.
//
// 검증 범위:
//   1) env 설정 시 createBrowserSupabaseClient가 올바른 url·anonKey로 createBrowserClient 호출
//   2) env 설정 시 createServerSupabaseClient가 올바른 url·anonKey로 createServerClient 호출
//   3) env 누락 시 getSupabaseEnv()/팩토리가 명확한 에러를 throw
//   4) URL만 누락 / Anon Key만 누락 → 각각 throw

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// @supabase/ssr 모킹
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 실제 Supabase 서버에 연결하지 않고 팩토리 함수가 올바른 인수로 호출되는지만 검증한다.
// createBrowserClient/createServerClient가 반환하는 가짜 객체는 'mock-client'로 통일.
const mockBrowserClient = { type: "browser-mock" };
const mockServerClient = { type: "server-mock" };

const createBrowserClientMock = vi.fn().mockReturnValue(mockBrowserClient);
const createServerClientMock = vi.fn().mockReturnValue(mockServerClient);

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
  createServerClient: createServerClientMock,
}));

// ─────────────────────────────────────────────────────────────────────────────
// next/headers 모킹
// ─────────────────────────────────────────────────────────────────────────────
// WHY: next/headers의 cookies()는 Next.js 런타임에만 동작하는 서버 전용 API다.
// Vitest(jsdom/Node 환경)에서는 존재하지 않으므로 getAll/setAll을 가진 가짜 쿠키 저장소로 대체.
const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 각 테스트 전후 env 설정/해제
// ─────────────────────────────────────────────────────────────────────────────
describe("supabaseClient 팩토리 (이슈 #104)", () => {
  // 각 테스트에서 env를 깨끗하게 설정하기 위해 모듈 캐시를 초기화한다.
  // getSupabaseEnv는 호출 시점에 process.env를 읽으므로 모듈 재로드 없이도
  // vi.stubEnv로 테스트별 env 분리가 가능하다.
  beforeEach(() => {
    vi.resetModules();
    // 모든 mock 호출 기록 초기화 — 각 테스트가 독립적으로 검증하도록
    createBrowserClientMock.mockClear();
    createServerClientMock.mockClear();
    mockCookieStore.getAll.mockClear();
    mockCookieStore.set.mockClear();
  });

  afterEach(() => {
    // vi.stubEnv로 설정한 환경 변수를 원복한다
    vi.unstubAllEnvs();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 그룹 1: 브라우저 클라이언트 팩토리
  // ───────────────────────────────────────────────────────────────────────────
  describe("createBrowserSupabaseClient()", () => {
    it("env 설정 시 createBrowserClient를 올바른 url·anonKey로 호출한다", async () => {
      // 환경 변수 주입
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key-browser");

      // 모듈 캐시를 초기화한 뒤 fresh import
      vi.resetModules();
      // 모킹 재등록: vi.resetModules() 후 vi.mock은 다시 선언해야 한다
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );
      const client = createBrowserSupabaseClient();

      // 1) createBrowserClient가 정확히 1회 호출됐는지 검증
      expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
      // 2) 첫 번째 인수로 url, 두 번째로 anonKey가 전달됐는지 검증
      expect(createBrowserClientMock).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key-browser",
      );
      // 3) 팩토리가 createBrowserClient의 반환값을 그대로 전달하는지 확인
      expect(client).toBe(mockBrowserClient);
    });

    it("NEXT_PUBLIC_SUPABASE_URL 누락 시 명확한 에러를 throw한다", async () => {
      // URL을 빈 값으로 설정 (미설정 동작 재현)
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );

      // 에러 메시지에 환경 변수명과 setup 문서 참조가 포함되는지 검증
      expect(() => createBrowserSupabaseClient()).toThrow(
        "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 설정되지 않았습니다.",
      );
    });

    it("NEXT_PUBLIC_SUPABASE_ANON_KEY 누락 시 명확한 에러를 throw한다", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );

      expect(() => createBrowserSupabaseClient()).toThrow(
        "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 설정되지 않았습니다.",
      );
    });

    it("에러 메시지에 setup 문서 경로가 포함된다", async () => {
      // 두 env 모두 누락 → 에러 메시지에 setup 문서 참조가 있는지 확인
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );

      expect(() => createBrowserSupabaseClient()).toThrow(
        "docs/06-setup/supabase-setup.md 참조",
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 그룹 2: 서버 클라이언트 팩토리
  // ───────────────────────────────────────────────────────────────────────────
  describe("createServerSupabaseClient()", () => {
    it("env 설정 시 createServerClient를 올바른 url·anonKey로 호출한다", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key-server");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createServerSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );
      const client = await createServerSupabaseClient();

      // createServerClient가 정확히 1회 호출됐는지
      expect(createServerClientMock).toHaveBeenCalledTimes(1);
      // 첫 번째 인수(url)·두 번째 인수(anonKey) 검증
      expect(createServerClientMock).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key-server",
        // 세 번째 인수는 cookies 어댑터 객체 — 구조 일부만 확인
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      );
      // 팩토리가 createServerClient의 반환값을 그대로 전달하는지
      expect(client).toBe(mockServerClient);
    });

    it("cookies 어댑터의 getAll이 mockCookieStore.getAll을 호출한다", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key-server");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createServerSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );
      await createServerSupabaseClient();

      // createServerClient에 전달된 세 번째 인수의 cookies.getAll을 꺼내 직접 호출
      const thirdArg = createServerClientMock.mock.calls[0][2] as {
        cookies: { getAll: () => unknown; setAll: (c: unknown[]) => void };
      };
      thirdArg.cookies.getAll();

      // mockCookieStore.getAll이 실제로 호출됐는지 확인
      expect(mockCookieStore.getAll).toHaveBeenCalledTimes(1);
    });

    it("cookies 어댑터의 setAll이 cookieStore.set을 각 쿠키마다 호출한다", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key-server");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createServerSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );
      await createServerSupabaseClient();

      const thirdArg = createServerClientMock.mock.calls[0][2] as {
        cookies: {
          getAll: () => unknown;
          setAll: (
            cookies: { name: string; value: string; options: object }[],
          ) => void;
        };
      };

      // 가짜 쿠키 2개를 setAll로 전달
      thirdArg.cookies.setAll([
        { name: "sb-token", value: "abc", options: { httpOnly: true } },
        { name: "sb-refresh", value: "xyz", options: {} },
      ]);

      // cookieStore.set이 각 쿠키마다 한 번씩 총 2회 호출됐는지 검증
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(1, "sb-token", "abc", {
        httpOnly: true,
      });
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(2, "sb-refresh", "xyz", {});
    });

    it("setAll은 cookieStore.set이 예외를 던져도(서버 컴포넌트 read-only) 삼키고 throw하지 않는다", async () => {
      // WHY: 서버 컴포넌트는 read-only 쿠키 컨텍스트라 set() 호출 시 예외가 발생할 수 있다.
      // 이때 setAll은 예외를 의도적으로 무시해야 한다(세션 갱신은 미들웨어/라우트 핸들러가 담당).
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key-server");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createServerSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );
      await createServerSupabaseClient();

      const thirdArg = createServerClientMock.mock.calls[0][2] as {
        cookies: {
          setAll: (
            cookies: { name: string; value: string; options: object }[],
          ) => void;
        };
      };

      // 서버 컴포넌트 read-only 컨텍스트 재현 — set이 예외를 던지도록 1회 스텁
      mockCookieStore.set.mockImplementationOnce(() => {
        throw new Error("Cookies can only be modified in a Server Action or Route Handler");
      });

      // setAll 내부 try/catch가 예외를 삼켜 호출자에게 전파하지 않아야 한다
      expect(() =>
        thirdArg.cookies.setAll([
          { name: "sb-token", value: "abc", options: {} },
        ]),
      ).not.toThrow();
    });

    it("env 누락 시 명확한 에러를 throw한다", async () => {
      // URL과 Key 모두 미설정
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { createServerSupabaseClient } = await import(
        "@/lib/supabaseClient"
      );

      // async 팩토리이므로 rejects로 검증
      await expect(createServerSupabaseClient()).rejects.toThrow(
        "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 설정되지 않았습니다.",
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 그룹 3: getSupabaseEnv 헬퍼 직접 검증
  // ───────────────────────────────────────────────────────────────────────────
  describe("getSupabaseEnv() 헬퍼", () => {
    it("두 env 모두 설정되면 { url, anonKey }를 반환한다", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "my-anon-key");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { getSupabaseEnv } = await import("@/lib/supabaseClient");
      const result = getSupabaseEnv();

      expect(result).toEqual({
        url: "https://example.supabase.co",
        anonKey: "my-anon-key",
      });
    });

    it("URL만 누락 시 에러를 throw한다", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "valid-key");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { getSupabaseEnv } = await import("@/lib/supabaseClient");

      expect(() => getSupabaseEnv()).toThrow(
        "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 설정되지 않았습니다.",
      );
    });

    it("Anon Key만 누락 시 에러를 throw한다", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      vi.resetModules();
      vi.mock("@supabase/ssr", () => ({
        createBrowserClient: createBrowserClientMock,
        createServerClient: createServerClientMock,
      }));
      vi.mock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue(mockCookieStore),
      }));

      const { getSupabaseEnv } = await import("@/lib/supabaseClient");

      expect(() => getSupabaseEnv()).toThrow(
        "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 설정되지 않았습니다.",
      );
    });
  });
});
