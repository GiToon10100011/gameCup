// 검색 도메인 비즈니스 로직. 3계층 아키텍처에서 Business layer 담당.
// View는 직접 외부 API를 호출하지 않고 항상 본 모듈을 경유한다.

import { fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

// 검색어 유효성 — 공백/빈 값은 false. F-12에 따라 외부 API 호출을 막는 1차 게이트.
export function validateQuery(query: string): boolean {
  return query.trim().length > 0;
}

/**
 * 검색 메인 진입점.
 * - validateQuery로 빈 검색어를 차단 (F-12)
 * - 세션 캐시 적중 시 즉시 반환 (NF-05)
 * - 캐시 미스 시 외부 API 호출 후 결과를 캐시에 저장
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

  // 3) 캐시 미스 — 외부 API 호출 후 결과를 캐시에 저장
  const results = await fetchGames(query);
  store.setCache(query, results);
  return results;
}
