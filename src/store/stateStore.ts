import { create } from "zustand";
import type { Game, TournamentPair } from "@/types/game";

interface StateStoreState {
  searchCache: Map<string, Game[]>;
  candidates: Game[];
  currentRound: number;
  currentMatches: TournamentPair[];
  nextRoundQueue: Game[];
  winner: Game | null;
}

interface StateStoreActions {
  getCache: (query: string) => Game[] | undefined;
  setCache: (query: string, results: Game[]) => void;
  getCandidates: () => Game[];
  addCandidate: (game: Game) => boolean;
  removeCandidate: (gameId: string) => void;
  getCurrentMatches: () => TournamentPair[];
  setRoundState: (round: number, matches: TournamentPair[]) => void;
  pushToNextRound: (game: Game) => void;
  setWinner: (game: Game) => void;
  getWinner: () => Game | null;
  resetAll: () => void;
}

const initialState: StateStoreState = {
  searchCache: new Map(),
  candidates: [],
  currentRound: 0,
  currentMatches: [],
  nextRoundQueue: [],
  winner: null,
};

export const useStateStore = create<StateStoreState & StateStoreActions>((set, get) => ({
  ...initialState,

  getCache: (query) => get().searchCache.get(query),

  setCache: (query, results) =>
    set((state) => {
      const next = new Map(state.searchCache);
      next.set(query, results);
      return { searchCache: next };
    }),

  getCandidates: () => get().candidates,

  addCandidate: (game) => {
    const exists = get().candidates.some((c) => c.id === game.id);
    if (exists) return false;
    set((state) => ({ candidates: [...state.candidates, game] }));
    return true;
  },

  removeCandidate: (gameId) =>
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== gameId),
    })),

  getCurrentMatches: () => get().currentMatches,

  setRoundState: (round, matches) =>
    set({ currentRound: round, currentMatches: matches, nextRoundQueue: [] }),

  pushToNextRound: (game) =>
    set((state) => ({ nextRoundQueue: [...state.nextRoundQueue, game] })),

  setWinner: (game) => set({ winner: game }),

  getWinner: () => get().winner,

  resetAll: () => set({ ...initialState, searchCache: new Map() }),
}));
