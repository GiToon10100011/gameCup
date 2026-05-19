import { fetchGames } from "@/lib/externalApiClient";
import { useStateStore } from "@/store/stateStore";
import type { Game } from "@/types/game";

export function validateQuery(query: string): boolean {
  return query.trim().length > 0;
}

export async function search(query: string): Promise<Game[]> {
  if (!validateQuery(query)) {
    return [];
  }
  const store = useStateStore.getState();
  const cached = store.getCache(query);
  if (cached) {
    return cached;
  }
  const results = await fetchGames(query);
  store.setCache(query, results);
  return results;
}
