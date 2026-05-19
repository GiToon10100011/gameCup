import { useStateStore } from "@/store/stateStore";
import type { Game } from "@/types/game";

export type AddCandidateResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" };

export function addToPool(game: Game): AddCandidateResult {
  const added = useStateStore.getState().addCandidate(game);
  return added ? { ok: true } : { ok: false, reason: "duplicate" };
}

export function removeFromPool(gameId: string): void {
  useStateStore.getState().removeCandidate(gameId);
}

export function canStartTournament(): boolean {
  return useStateStore.getState().getCandidates().length >= 2;
}
