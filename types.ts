export enum MBTI {
  INTJ = 'INTJ', INTP = 'INTP', ENTJ = 'ENTJ', ENTP = 'ENTP',
  INFJ = 'INFJ', INFP = 'INFP', ENFJ = 'ENFJ', ENFP = 'ENFP',
  ISTJ = 'ISTJ', ISFJ = 'ISFJ', ESTJ = 'ESTJ', ESFJ = 'ESFJ',
  ISTP = 'ISTP', ISFP = 'ISFP', ESTP = 'ESTP', ESFP = 'ESFP'
}

export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'anxious';

export interface PlayerProfile {
  id: string;
  name: string;
  mbti: MBTI;
  relationship: string; // Description of relationship to the other player
  avatarUrl: string;
  elo: number; // Simulated ELO for Stockfish difficulty scaling
}

export interface GameState {
  fen: string;
  history: string[];
  isGameOver: boolean;
  winner: 'white' | 'black' | 'draw' | null;
  turn: 'white' | 'black';
  logs: GameLogEntry[];
}

export interface GameLogEntry {
  id: string;
  playerId: string;
  message: string;
  timestamp: number;
  type: 'move' | 'chat' | 'system';
  emotion?: Emotion;
}

export type ChessMove = {
  from: string;
  to: string;
  promotion?: string;
};