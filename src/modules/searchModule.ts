/**
 * 검색 도메인 비즈니스 로직. 3계층 아키텍처에서 Business layer 담당.
 * View는 직접 외부 API를 호출하지 않고 항상 본 모듈을 경유한다.
 */

import { ExternalApiError, fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";
import type { IApiError, IGame } from "@/types/game";
import { measureAsync } from "@/utils/measureAsync";

/**
 * NF-01 임계치 — 검색 응답이 이 값을 넘으면 개발 환경에서 console.warn으로 경고.
 * 명시적으로 export해 테스트와 다른 모듈에서 동일 값을 참조하도록 한다 (매직 넘버 방지).
 */
export const SEARCH_RESPONSE_TIME_BUDGET_MS = 1000;

/**
 * 마지막 search() 호출의 응답 시간(ms). 모듈 스코프에 보관해 로컬 디버깅·테스트에서 조회.
 * store에 두지 않은 이유: 응답 시간은 UI 렌더와 무관한 진단 정보라서 리렌더 트리거 불필요.
 *
 * 계약 (PR #74 리뷰 반영):
 *   - 외부 호출 발생 시: 실제 측정값(ms) 기록
 *   - 캐시 적중·빈 검색어 등 외부 호출 없는 경로: **null로 리셋** — 이전 측정값이 남으면
 *     "마지막 호출"의 의미가 깨지므로 모든 진입점에서 의도된 상태를 보장
 */
let lastSearchDurationMs: number | null = null;

/**
 * 최신 검색 요청 식별자 (PR #88 리뷰 반영 — 동시 요청 레이스 가드).
 * 빠른 연속 검색에서 늦게 끝난 과거 요청이 최신 요청의 상태(apiError)를 덮어쓰지 않도록,
 * searchWithErrorHandling은 자기 요청이 여전히 "최신"일 때만 store에 결과를 반영한다.
 */
let latestSearchRequestId = 0;

/** 검색어 유효성 — 공백/빈 값은 false. F-12에 따라 외부 API 호출을 막는 1차 게이트. */
export function validateQuery(query: string): boolean {
  return query.trim().length > 0;
}

/**
 * 마지막 search() 호출의 응답 시간(ms)을 반환한다.
 * - 한 번도 호출 안 됐거나 빈 검색어/캐시 적중으로 외부 호출이 없었던 경우는 null
 * - 캐시 미스 → 외부 호출 흐름에서만 의미 있는 값이 기록됨 (NF-01 검증 대상)
 */
export function getLastSearchDurationMs(): number | null {
  return lastSearchDurationMs;
}

/**
 * 마지막 측정값을 초기화한다. 주로 테스트 격리 + 명시적 리셋이 필요할 때 사용.
 */
export function resetSearchDurationMeasurement(): void {
  lastSearchDurationMs = null;
}

/**
 * 검색 메인 진입점.
 * - validateQuery로 빈 검색어를 차단 (F-12)
 * - 세션 캐시 적중 시 즉시 반환 (NF-05) — 응답 시간 측정 대상 아님(외부 호출이 없음)
 * - 캐시 미스 시 외부 API 호출 + 응답 시간 측정 (NF-01)
 */
export async function search(query: string): Promise<IGame[]> {
  /* 1) 빈 검색어 차단 — 호출자(useSearchQuery)가 이미 enabled 가드를 가지지만 방어층으로 한 번 더.
   *    외부 호출이 없으므로 측정값도 null로 리셋해 "마지막 호출" 의미를 유지. */
  if (!validateQuery(query)) {
    lastSearchDurationMs = null;
    return [];
  }

  /* 2) 캐시 조회 — 동일 검색어가 이미 들어왔다면 외부 호출 없이 즉시 반환.
   *    캐시 적중도 외부 호출이 없으므로 측정값을 null로 리셋. */
  const store = useStateStore.getState();
  const cached = store.getCache(query);
  if (cached) {
    lastSearchDurationMs = null;
    return cached;
  }

  /* 3) 캐시 미스 — 외부 API 호출 시간을 측정하면서 결과를 받아옴.
   *    measureAsync는 fetchGames가 throw해도 측정값을 한 번 통보하고 에러를 재throw하므로
   *    실패 케이스의 응답 시간도 lastSearchDurationMs에 보존된다 (타임아웃 진단용). */
  const results = await measureAsync(
    () => fetchGames(query),
    (durationMs, success) => {
      // 측정값 보관 — 다른 모듈/테스트에서 getLastSearchDurationMs()로 조회 가능
      lastSearchDurationMs = durationMs;

      // 개발 환경에서만 콘솔 로그 — 운영 환경에 비싼 IO가 새지 않도록 분기
      if (process.env.NODE_ENV !== "production") {
        // 임계치(NF-01: 1초) 초과 시 경고, 그 이하는 debug 레벨로 기록
        if (durationMs > SEARCH_RESPONSE_TIME_BUDGET_MS) {
          // eslint-disable-next-line no-console
          console.warn(
            `[searchModule] NF-01 위반: 검색 응답 시간 ${durationMs.toFixed(1)}ms > ${SEARCH_RESPONSE_TIME_BUDGET_MS}ms (success=${success}, query=${JSON.stringify(query)})`,
          );
        } else {
          // eslint-disable-next-line no-console
          console.debug(
            `[searchModule] 검색 응답 시간 ${durationMs.toFixed(1)}ms (success=${success}, query=${JSON.stringify(query)})`,
          );
        }
      }
    },
  );

  // 4) 성공 결과만 캐시에 저장 — 실패는 measureAsync에서 throw로 빠져나가 여기에 도달하지 않음
  store.setCache(query, results);
  return results;
}

/**
 * 임의의 throw 값을 표준 IApiError 형태로 정규화한다 (Issue #14).
 *
 * 사용자에게 보여줄 인라인 메시지(#15 ErrorMessage)와 상태 저장은 항상 `{ message, statusCode }`
 * 형태를 전제로 하므로, 어떤 예외가 올라오든 이 함수가 단일 진입점에서 형태를 통일한다.
 */
export function toApiError(error: unknown): IApiError {
  // 1) 우리가 던진 표준 에러 — statusCode(HTTP 상태/0)를 그대로 보존해 호출자가 분기 가능
  if (error instanceof ExternalApiError) {
    return { message: error.message, statusCode: error.statusCode };
  }

  // 2) 그 외 일반 Error(네트워크 끊김 등) — 메시지는 살리되 HTTP 의미가 없으므로 statusCode 0
  if (error instanceof Error) {
    return { message: error.message, statusCode: 0 };
  }

  // 3) 문자열·객체 등 Error가 아닌 throw — 신뢰할 메시지가 없어 사용자용 기본 문구로 대체
  return { message: "알 수 없는 오류가 발생했습니다.", statusCode: 0 };
}

/**
 * 에러 처리를 입힌 검색 진입점 (Issue #14, Story #6 / F-11).
 *
 * `search()`는 실패 시 예외를 그대로 던지지만, View 경로(useSearchQuery)는 예외 대신
 * "안전한 빈 결과 + 상태에 반영된 에러"를 원한다. 본 함수가 그 경계를 담당한다:
 *   - 성공: 이전 에러 상태를 해제(clearApiError)하고 결과를 그대로 반환
 *   - 실패: toApiError로 정규화해 store.apiError에 반영하고 **빈 배열**을 반환
 *           (UI는 크래시 없이 정상 동작을 유지 — Story #6 / #16 "오류 상태 안정성")
 */
export async function searchWithErrorHandling(query: string): Promise<IGame[]> {
  const store = useStateStore.getState();
  // 이 호출의 요청 번호를 채번 — 더 나중에 시작된 검색이 있으면 본 요청은 "구식"이 된다.
  const requestId = ++latestSearchRequestId;
  try {
    // 1) 정상 흐름 — 결과는 항상 호출자에게 반환한다.
    const results = await search(query);
    // 상태 반영은 본 요청이 여전히 최신일 때만 — 늦게 끝난 과거 요청이 최신 상태를 덮지 않도록.
    if (requestId === latestSearchRequestId) {
      store.clearApiError();
    }
    return results;
  } catch (error) {
    // 2) 실패 흐름 — 본 요청이 최신일 때만 에러를 상태에 반영(레이스 가드). ErrorMessage(#15)가 구독.
    if (requestId === latestSearchRequestId) {
      store.setApiError(toApiError(error));
    }
    // 3) graceful degradation — 빈 결과로 호출자가 그대로 렌더할 수 있게 한다.
    return [];
  }
}
