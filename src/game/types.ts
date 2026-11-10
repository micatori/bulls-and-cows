// src/game/types.ts
import type { Base } from './alphabet';

export type RandomSource = () => number;

export type GameStatus = 'idle' | 'running' | 'won';

export interface GameConfig {
  readonly length: number;
  readonly base: Base;
}

export interface Attempt {
  readonly guess: string;
  readonly bulls: number;
  readonly cows: number;
  readonly at: number; // метка времени попытки
}

export interface GameState {
  readonly status: GameStatus;
  readonly config: GameConfig | null;
  readonly secret: string | null;
  readonly attempts: readonly Attempt[];
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
}

export interface ScoreRecord {
  readonly length: number;
  readonly base: Base;
  readonly attempts: number;
  readonly elapsedMs: number;
  readonly finishedAt: number;
}
