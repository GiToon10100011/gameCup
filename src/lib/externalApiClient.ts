// RAWG API 게이트웨이. 외부 게임 데이터베이스 접근은 본 파일이 유일한 출입구다.
// 3계층 아키텍처에서 Data layer에 속하며, Business layer(modules)만 호출하도록 약속되어 있다.

import type { IApiError, IGame } from "@/types/game";

// RAWG API의 베이스 URL.
// PR #64 리뷰 피드백("BASE_URL은 환경변수로 정의하여 전역적으로 재사용") 반영하여 env 우선·기본값 fallback 패턴.
// - 환경별(개발/스테이징/프로덕션) 또는 프록시 도입 시 코드 변경 없이 URL 교체 가능
// - 환경 변수 미설정 시 공식 RAWG 호스트로 안전 폴백
const RAWG_BASE_URL =
  process.env.NEXT_PUBLIC_RAWG_BASE_URL ?? "https://api.rawg.io/api";

// RAWG가 반환하는 원본 게임 객체의 부분 타입.
// 우리는 id/name/배경 이미지만 필요하므로 그 외 필드는 정의하지 않는다.
interface IRawgGame {
  id: number;
  name: string;
  background_image: string | null;
}

// RAWG 검색 엔드포인트의 응답 형태. results 배열만 사용.
interface IRawgResponse {
  results: IRawgGame[];
}

/**
 * 표준 에러 클래스 — Promise 거부 시 던져진다.
 * `Error`를 상속하면서도 `IApiError` 인터페이스를 implements하여
 * 상위(searchModule)에서는 인터페이스로만 캐치할 수 있도록 설계.
 */
export class ExternalApiError extends Error implements IApiError {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * RAWG 검색 API를 호출하고 정규화된 IGame 배열을 반환한다.
 * - 키가 없으면 statusCode 0으로 즉시 실패 (개발 단계에서 환경 변수 누락을 빠르게 감지)
 * - 네트워크/HTTP 오류는 ExternalApiError로 통일해 상위가 단일 catch로 처리 가능
 */
export async function fetchGames(query: string): Promise<IGame[]> {
  // 1) 환경 변수에서 API 키 로드 — Next.js public env로 브라우저에서도 접근 가능
  const apiKey = process.env.NEXT_PUBLIC_RAWG_KEY;
  if (!apiKey) {
    throw new ExternalApiError("Missing NEXT_PUBLIC_RAWG_KEY", 0);
  }

  // 2) 요청 URL 구성. 검색어와 키는 URL 인코딩해 안전하게 결합.
  const url = `${RAWG_BASE_URL}/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(query)}&page_size=10`;

  // 3) fetch 호출 — Next.js 14는 fetch가 기본 캐시되므로 추가 설정 없이도 동일 검색어 캐싱이 가능
  const res = await fetch(url);
  if (!res.ok) {
    throw new ExternalApiError(`RAWG request failed: ${res.statusText}`, res.status);
  }

  /**
   * 4) JSON 파싱 + 스키마 검증 — 실패 시도 ExternalApiError로 래핑해 상위가 단일 catch로 처리.
   * PR #74 리뷰: 파싱 실패·`results` 형태 이상이 일반 예외로 전파되면 §40 계약이 깨진다.
   */
  let data: IRawgResponse;
  try {
    data = (await res.json()) as IRawgResponse;
  } catch (parseError) {
    throw new ExternalApiError(
      `RAWG response JSON parse failed: ${(parseError as Error).message}`,
      res.status,
    );
  }
  if (!data || !Array.isArray(data.results)) {
    throw new ExternalApiError(
      "RAWG response missing 'results' array",
      res.status,
    );
  }
  return normalizeResponse(data);
}

/**
 * RAWG 원본 응답을 GameCup 내부에서 사용하는 IGame 형태로 정규화한다.
 * - id를 string으로 통일 (다른 외부 API로 교체할 때도 같은 형태 유지)
 * - background_image가 null이면 빈 문자열로 fallback해 컴포넌트가 placeholder 표시
 */
function normalizeResponse(raw: IRawgResponse): IGame[] {
  return raw.results.map((rawGame) => ({
    id: String(rawGame.id),
    name: rawGame.name,
    thumbnailUrl: rawGame.background_image ?? "",
  }));
}
