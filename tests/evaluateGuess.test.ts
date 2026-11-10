import { describe, expect, it } from 'vitest';

import { evaluateGuess } from '../src/game/evaluateGuess';

type Case = readonly [
  secret: string,
  guess: string,
  bulls: number,
  cows: number,
];

const cases: readonly Case[] = [
  ['1234', '1234', 4, 0],
  ['1234', '1324', 2, 2],
  ['1234', '4321', 0, 4],
  ['1234', '1243', 2, 2],
  ['1234', '2134', 2, 2],
  ['0123', '3210', 0, 4],
  ['1234', '0234', 3, 0],
  ['1234', '1235', 3, 0],
  ['1234', '1567', 1, 0],
  ['1234', '5678', 0, 0],
  ['9012', '1092', 2, 2],
  ['01', '01', 2, 0],
  ['01', '10', 0, 2],
  ['07', '70', 0, 2],
  ['123456', '654321', 0, 6],
  ['123456', '612345', 0, 6],
  ['123456', '613452', 3, 3],
  ['abcdef', '0123ab', 0, 2],
];

describe('evaluateGuess', () => {
  cases.forEach(([secret, guess, bulls, cows]) => {
    it(`scores ${secret} against ${guess} as ${bulls} bulls and ${cows} cows`, () => {
      expect(evaluateGuess(secret, guess)).toEqual({ bulls, cows });
    });
  });

  it('scores a completely wrong guess as zero and zero', () => {
    expect(evaluateGuess('1234', '9876')).toEqual({ bulls: 0, cows: 0 });
  });
});

describe('evaluateGuess case normalization', () => {
  const hexCases: readonly Case[] = [
    ['a1', 'A1', 2, 0],
    ['a1', '1A', 0, 2],
    ['face', 'FACE', 4, 0],
    ['AB12', 'ab12', 4, 0],
    ['ab12', 'BA12', 2, 2],
    ['3f', 'F3', 0, 2],
    ['0a', '0A', 2, 0],
    ['0a', 'A0', 0, 2],
  ];

  hexCases.forEach(([secret, guess, bulls, cows]) => {
    it(`treats upper and lower case hex digits as equal: ${secret} vs ${guess}`, () => {
      expect(evaluateGuess(secret, guess)).toEqual({ bulls, cows });
    });
  });

  it('counts bulls, not cows, when the only difference is digit case', () => {
    expect(evaluateGuess('a1', 'A1')).toEqual({ bulls: 2, cows: 0 });
  });
});

describe('evaluateGuess purity and totality', () => {
  const fullLengthSecrets = ['01', '1234', 'abcdef', '123456'];

  fullLengthSecrets.forEach(secret => {
    it(`a guess equal to the secret gives bulls equal to its length: ${secret}`, () => {
      expect(evaluateGuess(secret, secret)).toEqual({
        bulls: secret.length,
        cows: 0,
      });
    });
  });

  it('returns the same score for the same arguments regardless of other calls', () => {
    const first = evaluateGuess('1234', '1324');
    evaluateGuess('abcdef', 'fedcba');

    expect(evaluateGuess('1234', '1324')).toEqual(first);
  });

  it('returns a fresh object instead of a shared mutable one', () => {
    const first = evaluateGuess('1234', '1324');
    const second = evaluateGuess('1234', '1324');

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it('returns exactly the bulls and cows fields', () => {
    expect(Object.keys(evaluateGuess('1234', '1324')).sort()).toEqual([
      'bulls',
      'cows',
    ]);
  });

  it('never lets bulls and cows exceed the secret length', () => {
    const pairs: readonly [string, string][] = [
      ['1234', '4321'],
      ['1234', '1234'],
      ['1234', '1324'],
      ['abcdef', '0123ab'],
    ];

    pairs.forEach(([secret, guess]) => {
      const { bulls, cows } = evaluateGuess(secret, guess);

      expect(bulls + cows).toBeLessThanOrEqual(secret.length);
    });
  });

  it('matches every secret digit at most once even when a guess repeats digits', () => {
    expect(evaluateGuess('1234', '2114')).toEqual({ bulls: 1, cows: 2 });
  });

  it('handles empty input without throwing', () => {
    expect(evaluateGuess('', '')).toEqual({ bulls: 0, cows: 0 });
  });

  it('does not throw and never leaks undefined for out-of-contract lengths', () => {
    for (const [secret, guess] of [
      ['1234', '12'],
      ['12', '1234'],
      ['1234', ''],
    ] as const) {
      const score = evaluateGuess(secret, guess);

      expect(Number.isFinite(score.bulls)).toBe(true);
      expect(Number.isFinite(score.cows)).toBe(true);
    }
  });
});
