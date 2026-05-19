import type { ApiError, Game } from "@/types/game";

const RAWG_BASE_URL = "https://api.rawg.io/api";

interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
}

interface RawgResponse {
  results: RawgGame[];
}

export class ExternalApiError extends Error implements ApiError {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function fetchGames(query: string): Promise<Game[]> {
  const apiKey = process.env.NEXT_PUBLIC_RAWG_KEY;
  if (!apiKey) {
    throw new ExternalApiError("Missing NEXT_PUBLIC_RAWG_KEY", 0);
  }
  const url = `${RAWG_BASE_URL}/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(query)}&page_size=10`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new ExternalApiError(`RAWG request failed: ${res.statusText}`, res.status);
  }
  const data = (await res.json()) as RawgResponse;
  return normalizeResponse(data);
}

function normalizeResponse(raw: RawgResponse): Game[] {
  return raw.results.map((g) => ({
    id: String(g.id),
    name: g.name,
    thumbnailUrl: g.background_image ?? "",
  }));
}
