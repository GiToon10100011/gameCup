import { useQuery } from "@tanstack/react-query";
import { search } from "@/modules/searchModule";
import type { Game } from "@/types/game";

export function useSearchQuery(debouncedQuery: string) {
  return useQuery<Game[]>({
    queryKey: ["games", debouncedQuery],
    queryFn: () => search(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
