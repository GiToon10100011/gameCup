// TanStack Query 래핑 훅 — 검색 결과의 캐싱·로딩·에러 상태를 React 컴포넌트에서 쉽게 쓰도록 한다.
// staleTime을 길게 잡아 NF-05 (동일 검색어 외부 호출 최소화)에 한 번 더 안전장치를 둔다.

import { useQuery } from "@tanstack/react-query";
import { search } from "@/modules/searchModule";
import type { IGame } from "@/types/game";

/**
 * debouncedQuery 변경 시마다 자동으로 검색을 실행.
 * - enabled 가드로 빈 검색어는 호출 자체를 막음 (F-12)
 * - staleTime 5분: 동일 검색어 재호출 시 캐시 그대로 사용
 */
export function useSearchQuery(debouncedQuery: string) {
  return useQuery<IGame[]>({
    // queryKey는 캐시 키 — query별로 격리되어 다른 검색어 결과를 덮어쓰지 않음
    queryKey: ["games", debouncedQuery],

    // 실제 검색 — Business layer(searchModule)에 위임
    queryFn: () => search(debouncedQuery),

    // 빈 검색어이면 비활성화하여 useQuery가 호출 자체를 건너뜀
    enabled: debouncedQuery.trim().length > 0,

    // 5분간 fresh 상태 유지 — 그동안은 캐시만 반환하고 네트워크 호출 없음
    staleTime: 5 * 60 * 1000,
  });
}
