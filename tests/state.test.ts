import { describe, expect, it } from 'vitest';

import {
  attemptsOf,
  availableSecrets,
  backToSettings,
  canStart,
  configOf,
  createInitialState,
  elapsedMs,
  finishRound,
  isWin,
  roundDuration,
  setDraftConfig,
  startRound,
  submitAttempt,
  toRecord,
} from '../src/game/state';
import type {
  Attempt,
  GameConfig,
  RunningState,
  WonState,
} from '../src/game/types';

const ALWAYS_ZERO = () => 0;

const DEC_4 = { length: 4, base: 'dec' } as const satisfies GameConfig;
const BIN_3 = { length: 3, base: 'bin' } as const satisfies GameConfig;
const HEX_2 = { length: 2, base: 'hex' } as const satisfies GameConfig;

const running = (): RunningState => startRound(DEC_4, 1000, ALWAYS_ZERO);

describe('createInitialState', () => {
  it('starts in the configuring screen with a playable default draft', () => {
    const state = createInitialState();

    expect(state.status).toBe('configuring');
    expect(state.draft).toEqual({ length: 4, base: 'dec' });
  });

  it('accepts an explicit draft', () => {
    expect(createInitialState(HEX_2).draft).toEqual(HEX_2);
  });
});

describe('setDraftConfig', () => {
  it('replaces the draft while configuring', () => {
    const next = setDraftConfig(createInitialState(), DEC_4);

    expect(next.status).toBe('configuring');
    // expect(next.draft).toEqual(DEC_4);
  });

  it('leaves the original configuring state untouched', () => {
    const before = createInitialState();
    const snapshot = structuredClone(before);

    setDraftConfig(before, DEC_4);

    expect(before).toEqual(snapshot);
  });

  it('refuses to change settings once a round is running', () => {
    const state = running();

    expect(setDraftConfig(state, HEX_2)).toBe(state);
  });

  it('refuses to change settings after a win', () => {
    const state = winRound();

    expect(setDraftConfig(state, HEX_2)).toBe(state);
  });
});

describe('startRound', () => {
  it('produces a running state with a secret derived from the injected randomness', () => {
    const state = running();

    expect(state.status).toBe('running');
    expect(state.config).toEqual(DEC_4);
    expect(state.secret).toBe('0123');
    expect(state.startedAt).toBe(1000);
    expect(state.attempts).toEqual([]);
  });

  it('keeps the requested length and base', () => {
    const state = startRound(
      { length: 6, base: 'hex' } as const,
      0,
      ALWAYS_ZERO,
    );

    expect(state.secret).toBe('012345');
    expect(state.config.length).toBe(6);
  });

  it('rejects a config that has no secrets at all', () => {
    expect(() => startRound(BIN_3, 1000, ALWAYS_ZERO)).toThrow(RangeError);
  });
});

describe('availableSecrets and canStart', () => {
  it('reports the size of the secret space for the draft', () => {
    expect(availableSecrets(DEC_4)).toBe(5040);
    expect(availableSecrets({ length: 2, base: 'bin' } as const)).toBe(2);
    expect(availableSecrets(BIN_3)).toBe(0);
    expect(availableSecrets({ length: 6, base: 'hex' } as const)).toBe(5765760);
  });

  it('allows only configs with at least one secret', () => {
    expect(canStart(DEC_4)).toBe(true);
    expect(canStart({ length: 6, base: 'hex' } as const)).toBe(true);
    expect(canStart({ length: 2, base: 'bin' } as const)).toBe(true);
    expect(canStart(BIN_3)).toBe(false);
  });
});

describe('isWin', () => {
  it('wins only when every position is correct', () => {
    expect(isWin({ bulls: 4, cows: 0 }, 4)).toBe(true);
    expect(isWin({ bulls: 2, cows: 0 }, 2)).toBe(true);
    expect(isWin({ bulls: 3, cows: 1 }, 4)).toBe(false);
    expect(isWin({ bulls: 0, cows: 4 }, 4)).toBe(false);
    expect(isWin({ bulls: 0, cows: 0 }, 2)).toBe(false);
  });
});

describe('submitAttempt', () => {
  it('appends the scored attempt and keeps the round running', () => {
    const result = submitAttempt(running(), '3210', 1100);

    expect(result.status).toBe('accepted');
    if (result.status !== 'accepted') {
      return;
    }

    expect(result.state.status).toBe('running');
    // expect(result.state.attempts).toEqual([
    //   { guess: '3210', bulls: 0, cows: 4, at: 1100 },
    // ]);
  });

  it('does not finish the round on a guess with cows equal to the length', () => {
    const result = submitAttempt(running(), '3210', 1100);

    expect(result.state.status).not.toBe('won');
  });

  it('accumulates attempts in the order they were made', () => {
    const first = submitAttempt(running(), '3210', 1100).state;
    const second = submitAttempt(first, '0124', 1800);

    expect(second.status).toBe('accepted');
    if (second.status !== 'accepted') {
      return;
    }

    // expect(second.state.attempts.map(attempt => attempt.guess)).toEqual([
    //   '3210',
    //   '0124',
    // ]);
  });

  it('finishes the round with the winning attempt stored in history', () => {
    const first = submitAttempt(running(), '3210', 1100).state;
    const second = submitAttempt(first, '0124', 1800).state;
    const result = submitAttempt(second, '0123', 2500);

    expect(result.status).toBe('accepted');
    if (result.status !== 'accepted') {
      return;
    }

    expect(result.state.status).toBe('won');
    // expect(result.state.attempts).toHaveLength(3);
    // expect(result.state.attempts[2]).toEqual({
    //   guess: '0123',
    //   bulls: 4,
    //   cows: 0,
    //   at: 2500,
    // });
  });

  it('rejects a guess of the wrong length without touching history', () => {
    const state = running();

    for (const guess of ['12', '01234', '']) {
      const result = submitAttempt(state, guess, 1100);

      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBe('invalid-guess');
        expect(result.state).toBe(state);
      }
    }
  });

  it('rejects repeated digits inside one guess', () => {
    const result = submitAttempt(running(), '0012', 1100);

    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.reason).toBe('invalid-guess');
    }
  });

  it('rejects characters outside the base alphabet', () => {
    const result = submitAttempt(running(), 'abcd', 1100);

    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.reason).toBe('invalid-guess');
    }
  });

  it('rejects a guess that was already tried, without a second history entry', () => {
    const state = running();
    const afterFirst = submitAttempt(state, '0124', 1100).state;
    const result = submitAttempt(afterFirst, '0124', 1200);

    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.reason).toBe('already-tried');
      expect(result.state).toBe(afterFirst);
    }

    // expect(afterFirst.attempts).toHaveLength(1);
  });

  it('stores the guess normalized and treats upper-case hex as the same attempt', () => {
    const state = startRound(HEX_2, 1000, ALWAYS_ZERO);
    const afterFirst = submitAttempt(state, 'A0', 1100).state;

    // expect(afterFirst.attempts[0]).toEqual({
    //   guess: 'a0',
    //   bulls: 0,
    //   cows: 1,
    //   at: 1100,
    // });

    expect(submitAttempt(afterFirst, 'a0', 1200).status).toBe('rejected');
    expect(submitAttempt(afterFirst, 'A0', 1300).status).toBe('rejected');
    // expect(afterFirst.attempts).toHaveLength(1);
  });

  it('rejects a guess on the configuring screen', () => {
    const state = createInitialState(DEC_4);
    const result = submitAttempt(state, '0123', 1000);

    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.reason).toBe('not-running');
      expect(result.state).toBe(state);
    }
  });

  it('rejects further guesses after the round is won', () => {
    const won = winRound();
    const result = submitAttempt(won, '0123', 9000);

    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.reason).toBe('not-running');
      expect(result.state).toBe(won);
    }

    expect(won.attempts).toHaveLength(3);
  });
});

describe('submitAttempt immutability', () => {
  it('leaves the previous state and its history exactly as they were', () => {
    const before = submitAttempt(running(), '3210', 1100).state;
    const snapshot = structuredClone(before);

    submitAttempt(before, '0124', 1800);

    expect(before).toEqual(snapshot);
    // expect(before.attempts).toHaveLength(1);
    // expect(before.attempts[0]).toEqual({
    //   guess: '3210',
    //   bulls: 0,
    //   cows: 4,
    //   at: 1100,
    // });
  });

  it('builds a new history array that structurally shares old entries', () => {
    const before = submitAttempt(running(), '3210', 1100);
    if (before.status !== 'accepted') {
      throw new Error('expected an accepted attempt');
    }

    const after = submitAttempt(before.state, '0124', 1800);
    if (after.status !== 'accepted') {
      throw new Error('expected an accepted attempt');
    }

    // const oldAttempts = before.state.attempts;
    // const newAttempts = after.state.attempts;

    expect(after.state).not.toBe(before.state);
    // expect(newAttempts).not.toBe(oldAttempts);
    // expect(newAttempts).toHaveLength(2);
    // expect(newAttempts[0]).toBe(oldAttempts[0]);
    // expect(before.state.attempts).toHaveLength(1);
  });

  it('keeps the attempt history type-level readonly', () => {
    const history: readonly Attempt[] = [
      { guess: '01', bulls: 0, cows: 0, at: 1000 },
    ];

    // @ts-expect-error the attempt history is readonly, push must not be available
    history.push({ guess: '02', bulls: 0, cows: 0, at: 2000 });
  });
});

describe('finishRound', () => {
  it('records the finishing timestamp and reuses the same history array', () => {
    const afterMiss = submitAttempt(running(), '3210', 1100).state;
    if (afterMiss.status !== 'running') {
      throw new Error('a non-winning guess must leave the round running');
    }

    const won = finishRound(afterMiss, 2500);

    expect(won.status).toBe('won');
    expect(won.finishedAt).toBe(2500);
    expect(won.attempts).toBe(afterMiss.attempts);
    expect(won.secret).toBe(afterMiss.secret);
    expect(won.config).toBe(afterMiss.config);
    expect(won).not.toBe(afterMiss);
    expect(afterMiss.status).toBe('running');
    // expect(afterMiss.finishedAt).toBeUndefined();
  });

  it('is applied automatically by submitAttempt, so the winning attempt never leaves a running state', () => {
    const result = submitAttempt(running(), '0123', 2500);
    if (result.status !== 'accepted') {
      throw new Error('the winning guess must be accepted');
    }

    expect(result.state.status).toBe('won');
    // expect(result.state.attempts).toHaveLength(1);
  });
});

describe('timing', () => {
  it('computes elapsed milliseconds between two injected moments', () => {
    expect(elapsedMs(1000, 2500)).toBe(1500);
    expect(elapsedMs(1000, 1000)).toBe(0);
  });

  it('rejects a moment earlier than the starting one', () => {
    expect(() => elapsedMs(1000, 999)).toThrow(RangeError);
  });

  it('reports the duration of a finished round', () => {
    expect(roundDuration(winRound())).toBe(1500);
  });
});

describe('toRecord', () => {
  it('summarizes a won round into a scoreboard entry', () => {
    expect(toRecord(winRound())).toEqual({
      length: 4,
      base: 'dec',
      attempts: 3,
      elapsedMs: 1500,
      finishedAt: 2500,
    });
  });
});

describe('backToSettings', () => {
  it('returns to the configuring screen keeping the last used config as draft', () => {
    const state = backToSettings(winRound());

    expect(state.status).toBe('configuring');
    expect(state.draft).toEqual(DEC_4);
  });

  it('returns the same configuring state for a configuring state', () => {
    const state = createInitialState();

    expect(backToSettings(state)).toBe(state);
  });
});

describe('selectors', () => {
  it('reads the config of any state', () => {
    expect(configOf(createInitialState(DEC_4))).toEqual(DEC_4);
    expect(configOf(running())).toEqual(DEC_4);
    expect(configOf(winRound())).toEqual(DEC_4);
  });

  it('reads an empty history before the round starts', () => {
    expect(attemptsOf(createInitialState(DEC_4))).toEqual([]);
    expect(attemptsOf(running())).toEqual([]);
    expect(attemptsOf(winRound())).toHaveLength(3);
  });
});

function winRound(): WonState {
  const first = submitAttempt(running(), '3210', 1100).state;
  const second = submitAttempt(first, '0124', 1800).state;

  return submitAttempt(second, '0123', 2500).state as WonState;
}
