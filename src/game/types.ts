import type { Base } from './alphabet';

export type RandomSource = () => number;
export type GameStatus = 'configuring' | 'running' | 'won';

export interface GameConfig {
  readonly length: number;
  readonly base: Base;
}

export interface Score {
  readonly bulls: number;
  readonly cows: number;
}

export interface Attempt {
  readonly guess: string;
  readonly bulls: number;
  readonly cows: number;
  readonly at: number;
}

export interface ConfiguringState {
  readonly status: 'configuring';
  readonly draft: GameConfig;
}

export interface RunningState {
  readonly status: 'running';
  readonly config: GameConfig;
  readonly secret: string;
  readonly startedAt: number;
  readonly attempts: readonly Attempt[];
}

export interface WonState {
  readonly status: 'won';
  readonly config: GameConfig;
  readonly secret: string;
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly attempts: readonly Attempt[];
}

export type GameState = ConfiguringState | RunningState | WonState;

export interface ScoreRecord {
  readonly length: number;
  readonly base: Base;
  readonly attempts: number;
  readonly elapsedMs: number;
  readonly finishedAt: number;
}
