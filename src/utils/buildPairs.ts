import type { Game, TournamentPair } from "@/types/game";

export function buildPairs(games: readonly Game[]): TournamentPair[] {
  const pairs: TournamentPair[] = [];
  for (let i = 0; i < games.length; i += 2) {
    const gameA = games[i];
    const gameB = games[i + 1] ?? null;
    const isBye = gameB === null;
    pairs.push({
      gameA,
      gameB,
      winner: isBye ? gameA : null,
      isBye,
    });
  }
  return pairs;
}
