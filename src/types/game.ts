export interface Game {
  id: string;
  name: string;
  thumbnailUrl: string;
}

export interface TournamentPair {
  gameA: Game;
  gameB: Game | null;
  winner: Game | null;
  isBye: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
