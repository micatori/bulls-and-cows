import { countPossibleSecrets } from './countPossibleSecrets';
import { evaluateGuess } from './evaluateGuess';
import { generateSecret } from './generateSecret';
import { isValidGuess } from './isValidGuess';
import type {
  Attempt,
  ConfiguringState,
  GameConfig,
  GameState,
  RandomSource,
  RunningState,
  Score,
  ScoreRecord,
  WonState,
} from './types';

export type SubmitRejection = 'not-running' | 'invalid-guess' | 'already-tried';

export type SubmitResult =
  | { readonly status: 'accepted'; readonly state: GameState }
  | {
      readonly status: 'rejected';
      readonly reason: SubmitRejection;
      readonly state: GameState;
    };

export const DEFAULT_CONFIG: GameConfig = { length: 4, base: 'dec' };

const EMPTY_ATTEMPTS: readonly Attempt[] = [];

const normalizeGuess = (guess: string): string => guess.toLowerCase();

export const createInitialState = (
  draft: GameConfig = DEFAULT_CONFIG,
): ConfiguringState => ({ status: 'configuring', draft });

export const setDraftConfig = (
  state: GameState,
  config: GameConfig,
): GameState =>
  state.status === 'configuring' ? { ...state, draft: config } : state;

export const availableSecrets = (config: GameConfig): number =>
  countPossibleSecrets(config.length, config.base);

export const canStart = (config: GameConfig): boolean =>
  availableSecrets(config) > 0;

export const startRound = (
  config: GameConfig,
  now: number,
  random: RandomSource = Math.random,
): RunningState => {
  if (!canStart(config)) {
    throw new RangeError(
      `no secrets exist for length ${config.length} in base ${config.base}`,
    );
  }

  return {
    status: 'running',
    config,
    secret: generateSecret(config.length, config.base, random),
    startedAt: now,
    attempts: [],
  };
};

export const isWin = (score: Score, length: number): boolean =>
  score.bulls === length;

const createAttempt = (guess: string, score: Score, at: number): Attempt => ({
  guess: normalizeGuess(guess),
  bulls: score.bulls,
  cows: score.cows,
  at,
});

export const hasTried = (
  attempts: readonly Attempt[],
  guess: string,
): boolean => attempts.some(attempt => attempt.guess === normalizeGuess(guess));

const rejected = (state: GameState, reason: SubmitRejection): SubmitResult => ({
  status: 'rejected',
  reason,
  state,
});

export const submitAttempt = (
  state: GameState,
  guess: string,
  now: number,
): SubmitResult => {
  if (state.status !== 'running') {
    return rejected(state, 'not-running');
  }

  if (!isValidGuess(guess, state.config.length, state.config.base)) {
    return rejected(state, 'invalid-guess');
  }

  if (hasTried(state.attempts, guess)) {
    return rejected(state, 'already-tried');
  }

  const score = evaluateGuess(state.secret, guess);
  const attempts: readonly Attempt[] = [
    ...state.attempts,
    createAttempt(guess, score, now),
  ];

  if (!isWin(score, state.config.length)) {
    return { status: 'accepted', state: { ...state, attempts } };
  }

  return {
    status: 'accepted',
    state: finishRound({ ...state, attempts }, now),
  };
};

export const finishRound = (state: RunningState, now: number): WonState => ({
  ...state,
  status: 'won',
  finishedAt: now,
});

export const elapsedMs = (from: number, to: number): number => {
  if (to < from) {
    throw new RangeError(
      `elapsed time cannot be negative, got ${from} -> ${to}`,
    );
  }

  return to - from;
};

export const roundDuration = (state: WonState): number =>
  elapsedMs(state.startedAt, state.finishedAt);

export const toRecord = (state: WonState): ScoreRecord => ({
  length: state.config.length,
  base: state.config.base,
  attempts: state.attempts.length,
  elapsedMs: roundDuration(state),
  finishedAt: state.finishedAt,
});

export const backToSettings = (state: GameState): ConfiguringState =>
  state.status === 'configuring' ? state : createInitialState(state.config);

export const configOf = (state: GameState): GameConfig =>
  state.status === 'configuring' ? state.draft : state.config;

export const attemptsOf = (state: GameState): readonly Attempt[] =>
  state.status === 'configuring' ? EMPTY_ATTEMPTS : state.attempts;
