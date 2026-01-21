
export type GameState = 'HOME' | 'DRAWING' | 'RESULT';
export type GameMode = 'NORMAL' | 'TIMED';

export interface Pokemon {
  id: number;
  name: string;
  chineseName: string;
  imageUrl: string;
}

export interface DrawingResult {
  id: string;
  pokemon: Pokemon;
  userDrawing: string; // Base64
  score: number;
  comment: string;
  timestamp: number;
}

export interface AIScoreResponse {
  score: number;
  comment: string;
}
