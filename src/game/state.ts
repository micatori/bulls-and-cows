import type {
  Attempt,
  ConfiguringState,
  GameConfig,
  GameState,
  RunningState,
  Score,
  ScoreRecord,
  WonState,
  RandomSource,
} from './types';

const notImplemented = (name: string): never => {
  throw new Error(`${name} is not implemented yet`);
};

export type SubmitRejection = 'not-running' | 'invalid-guess' | 'already-tried';

export type SubmitResult =
  | { readonly status: 'accepted'; readonly state: GameState }
  | {
      readonly status: 'rejected';
      readonly reason: SubmitRejection;
      readonly state: GameState;
    };

export const DEFAULT_CONFIG: GameConfig = { length: 4, base: 'dec' };

export const createInitialState = (
  _draft: GameConfig = DEFAULT_CONFIG,
): ConfiguringState => notImplemented('createInitialState');

export const setDraftConfig = (
  _state: GameState,
  _config: GameConfig,
): GameState => notImplemented('setDraftConfig');

export const availableSecrets = (_config: GameConfig): number =>
  notImplemented('availableSecrets');

export const canStart = (_config: GameConfig): boolean =>
  notImplemented('canStart');

export const startRound = (
  _config: GameConfig,
  _now: number,
  _random: RandomSource = Math.random,
): RunningState => notImplemented('startRound');

export const isWin = (_score: Score, _length: number): boolean =>
  notImplemented('isWin');

export const submitAttempt = (
  _state: GameState,
  _guess: string,
  _now: number,
): SubmitResult => notImplemented('submitAttempt');

export const finishRound = (_state: RunningState, _now: number): WonState =>
  notImplemented('finishRound');

export const elapsedMs = (_from: number, _to: number): number =>
  notImplemented('elapsedMs');

export const roundDuration = (_state: WonState): number =>
  notImplemented('roundDuration');

export const toRecord = (_state: WonState): ScoreRecord =>
  notImplemented('toRecord');

export const backToSettings = (_state: GameState): ConfiguringState =>
  notImplemented('backToSettings');

export const configOf = (_state: GameState): GameConfig =>
  notImplemented('configOf');

export const attemptsOf = (_state: GameState): readonly Attempt[] =>
  notImplemented('attemptsOf');
