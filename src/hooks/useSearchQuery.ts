/**
 * TanStack Query 래핑 훅 — 검색 결과의 캐싱·로딩·에러 상태를 React 컴포넌트에서 쉽게 쓰도록 한다.
 * staleTime을 길게 잡아 NF-05(동일 검색어 외부 호출 최소화)에 한 번 더 안전장치를 둔다.
 */

import { useQuery } from "@tanstack/react-query";
import { searchWithErrorHandling } from "@/modules/searchModule";
import type { IGame } from "@/types/game";

/**
 * debouncedQuery 변경 시마다 자동으로 검색을 실행.
 *
 * 정규화 일관성 (PR #74 리뷰 반영):
 *   - 앞뒤 공백이 다른 검색어가 별도 캐시 키로 저장되거나 enabled만 trim 기준으로 작동하면
 *     쿼리 키와 실제 호출 입력이 어긋나 캐시 미적중 + 불필요한 API 호출 발생 가능.
 *   - 따라서 `normalizedQuery = debouncedQuery.trim()`을 한 번 계산하고 queryKey/queryFn/enabled
 *     **세 곳에 동일하게** 적용.
 */
export function useSearchQuery(debouncedQuery: string) {
  /* 입력 정규화 — 앞뒤 공백 제거. enabled·queryKey·queryFn 모두 같은 값을 사용. */
  const normalizedQuery = debouncedQuery.trim();

  return useQuery<IGame[]>({
    /* queryKey는 캐시 키 — 정규화된 쿼리로 격리해 "  zelda" / "zelda" / "zelda  "가 동일 키로 합쳐짐 */
    queryKey: ["games", normalizedQuery],

    /* 실제 검색 — Business layer(searchModule)에 위임. 정규화된 값을 전달해 캐시 키와 일치.
     * 에러 처리(Issue #14): search() 대신 searchWithErrorHandling()을 호출해
     * API 실패를 store.apiError로 반영하고 빈 배열을 받는다 → useQuery는 성공으로 처리되고
     * 오류 안내는 ErrorMessage(#15)가 store를 구독해 표시한다 (UI 크래시 없이 안정 동작). */
    queryFn: () => searchWithErrorHandling(normalizedQuery),

    /* 빈 검색어이면 비활성화 — normalizedQuery 길이 0이면 useQuery가 호출 자체를 건너뜀 */
    enabled: normalizedQuery.length > 0,

    /* 5분간 fresh 유지 — 그동안 캐시만 반환, 네트워크 호출 없음 */
    staleTime: 5 * 60 * 1000,
  });
}
