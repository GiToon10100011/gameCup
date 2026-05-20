// 검색 도메인 비즈니스 로직. 3계층 아키텍처에서 Business layer 담당.
// View는 직접 외부 API를 호출하지 않고 항상 본 모듈을 경유한다.

import { fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";
import { measureAsync } from "@/utils/measureAsync";

// NF-01 임계치 — 검색 응답이 이 값을 넘으면 개발 환경에서 console.warn으로 경고.
// 명시적으로 export해 테스트와 다른 모듈에서 동일 값을 참조하도록 한다 (매직 넘버 방지).
export const SEARCH_RESPONSE_TIME_BUDGET_MS = 1000;

// 마지막 검색 호출의 응답 시간(ms). 모듈 스코프에 보관하여 로컬 디버깅·테스트에서 조회 가능.
// store에 두지 않은 이유: 응답 시간은 UI 렌더와 무관한 진단 정보라서 리렌더 트리거가 불필요.
let lastSearchDurationMs: number | null = null;

// 검색어 유효성 — 공백/빈 값은 false. F-12에 따라 외부 API 호출을 막는 1차 게이트.
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
  // 1) 빈 검색어 차단 — 호출자(useSearchQuery)가 이미 enabled 가드를 가지지만 방어층으로 한 번 더
  if (!validateQuery(query)) {
    return [];
  }

  // 2) 캐시 조회 — 동일 검색어가 이미 들어왔다면 외부 호출 없이 즉시 반환
  const store = useStateStore.getState();
  const cached = store.getCache(query);
  if (cached) {
    return cached;
  }

  // 3) 캐시 미스 — 외부 API 호출 시간을 측정하면서 결과를 받아옴
  // measureAsync는 fetchGames가 throw해도 측정값을 한 번 통보하고 에러를 재throw하므로
  // 실패 케이스의 응답 시간도 lastSearchDurationMs에 보존된다 (타임아웃 진단용).
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
