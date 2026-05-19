import { useStateStore } from "@/store/stateStore";
import type { Game, TournamentPair } from "@/types/game";
import { buildPairs } from "@/utils/buildPairs";
import { shuffle } from "@/utils/shuffle";
import { canStartTournament } from "@/modules/candidateModule";

export function startTournament(): void {
  if (!canStartTournament()) return;
  const store = useStateStore.getState();
  const shuffled = shuffle(store.getCandidates());
  const matches = buildPairs(shuffled);
  store.setRoundState(1, matches);
  matches.filter((m) => m.isBye && m.winner).forEach((m) => store.pushToNextRound(m.winner as Game));
}

export function selectWinner(pair: TournamentPair, choice: Game): void {
  const isMember = choice.id === pair.gameA.id || choice.id === pair.gameB?.id;
  if (!isMember) return;
  const store = useStateStore.getState();
  store.pushToNextRound(choice);
  const updated = store
    .getCurrentMatches()
    .map((m) => (m === pair ? { ...m, winner: choice } : m));
  store.setRoundState(store.getCandidates().length > 0 ? getCurrentRound() : 1, updated);
}

export function advanceRound(): void {
  const store = useStateStore.getState();
  const queue = readNextRoundQueue();
  if (queue.length === 0) return;
  if (queue.length === 1) {
    store.setWinner(queue[0]);
    return;
  }
  const shuffled = shuffle(queue);
  const matches = buildPairs(shuffled);
  store.setRoundState(getCurrentRound() + 1, matches);
  matches.filter((m) => m.isBye && m.winner).forEach((m) => store.pushToNextRound(m.winner as Game));
}

export function isComplete(): boolean {
  return useStateStore.getState().getWinner() !== null;
}

function getCurrentRound(): number {
  return useStateStore.getState().currentRound;
}

function readNextRoundQueue(): Game[] {
  return useStateStore.getState().nextRoundQueue;
}
