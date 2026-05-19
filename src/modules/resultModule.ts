import { useStateStore } from "@/store/stateStore";
import type { Game } from "@/types/game";

export function getWinner(): Game | null {
  return useStateStore.getState().getWinner();
}

export function startNewTournament(): void {
  useStateStore.getState().resetAll();
}
