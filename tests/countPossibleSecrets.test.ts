import { describe, expect, it } from 'vitest';

import { countPossibleSecrets } from '../src/game/countPossibleSecrets';

const DIGIT_COUNTS = { bin: 2, oct: 8, dec: 10, hex: 16 } as const;

const BASES = Object.keys(DIGIT_COUNTS) as (keyof typeof DIGIT_COUNTS)[];
const LENGTHS = [2, 3, 4, 5, 6] as const;

/** P(n, k) = n·(n−1)·…·(n−k+1); вне области (k > n) перестановок не существует. */
const permutations = (length: number, digitCount: number): number => {
  if (length > digitCount) {
    return 0;
  }

  return Array.from({ length }, (_, index) => digitCount - index).reduce(
    (total, factor) => total * factor,
    1,
  );
};

describe('countPossibleSecrets against the closed form', () => {
  const cases: readonly [number, number, number][] = [
    [0, 10, 1],
    [1, 10, 10],
    [2, 2, 2],
    [1, 2, 2],
    [2, 10, 90],
    [3, 10, 720],
    [4, 10, 5040],
    [6, 10, 151200],
    [2, 8, 56],
    [3, 8, 336],
    [4, 8, 1680],
    [6, 8, 20160],
    [8, 8, 40320],
    [2, 16, 240],
    [3, 16, 3360],
    [6, 16, 5765760],
  ];

  cases.forEach(([length, digitCount, expected]) => {
    it(`P(${digitCount}, ${length}) is ${expected}`, () => {
      expect(countPossibleSecrets(length, digitCount)).toBe(expected);
    });
  });

  it('does not subtract the leading-zero case: 01 is a legal secret', () => {
    expect(countPossibleSecrets(2, 10)).toBe(90);
    expect(countPossibleSecrets(2, 2)).toBe(2);
    expect(countPossibleSecrets(3, 10)).toBe(720);
  });
});

describe('countPossibleSecrets over the game domain', () => {
  BASES.forEach(base => {
    LENGTHS.forEach(length => {
      it(`${base}/${length} matches the closed form`, () => {
        expect(countPossibleSecrets(length, base)).toBe(
          permutations(length, DIGIT_COUNTS[base]),
        );
      });
    });
  });

  it('offers only length 2 for binary because longer lengths have no secrets', () => {
    expect(countPossibleSecrets(2, 'bin')).toBe(2);
    expect(countPossibleSecrets(3, 'bin')).toBe(0);
    expect(countPossibleSecrets(6, 'bin')).toBe(0);
  });

  it('returns 0 when the length exceeds the digits available in the base', () => {
    expect(countPossibleSecrets(3, 2)).toBe(0);
    expect(countPossibleSecrets(9, 8)).toBe(0);
    expect(countPossibleSecrets(17, 16)).toBe(0);
  });

  it('uses the same digit count for a base name and its numeric size', () => {
    expect(countPossibleSecrets(4, 'dec')).toBe(countPossibleSecrets(4, 10));
    expect(countPossibleSecrets(3, 'hex')).toBe(countPossibleSecrets(3, 16));
  });
});

describe('countPossibleSecrets recurrence', () => {
  const recurrences: readonly (readonly [number, number])[] = [
    [2, 10],
    [4, 10],
    [6, 16],
    [5, 8],
    [3, 2],
    [8, 8],
  ];

  recurrences.forEach(([length, digitCount]) => {
    it(`f(${length}, ${digitCount}) = ${digitCount} * f(${length - 1}, ${digitCount - 1})`, () => {
      expect(countPossibleSecrets(length, digitCount)).toBe(
        digitCount * countPossibleSecrets(length - 1, digitCount - 1),
      );
    });
  });

  it('f(0, n) is 1 for any digit count, which is the recursion base', () => {
    [0, 1, 2, 8, 16].forEach(digitCount => {
      expect(countPossibleSecrets(0, digitCount)).toBe(1);
    });
  });
});

describe('countPossibleSecrets memoization', () => {
  it('keeps one shared memoized instance across calls', () => {
    const beforeFirst = countPossibleSecrets.cacheSize();

    countPossibleSecrets(6, 'hex');
    const afterFirst = countPossibleSecrets.cacheSize();

    countPossibleSecrets(6, 'hex');
    expect(countPossibleSecrets.cacheSize()).toBe(afterFirst);
    expect(afterFirst).toBeGreaterThan(beforeFirst);
  });

  it('caches a normalized key so a base name and a number share one entry', () => {
    countPossibleSecrets(4, 'dec');
    const afterName = countPossibleSecrets.cacheSize();

    countPossibleSecrets(4, 10);
    expect(countPossibleSecrets.cacheSize()).toBe(afterName);
  });

  it('keeps the cache bounded across the whole settings domain', () => {
    BASES.forEach(base => {
      LENGTHS.forEach(length => countPossibleSecrets(length, base));
    });

    // lengths 0..6 × digit counts 0..16
    expect(countPossibleSecrets.cacheSize()).toBeLessThanOrEqual(7 * 17);
  });
});

describe('countPossibleSecrets guards', () => {
  it('rejects a negative length', () => {
    expect(() => countPossibleSecrets(-1, 10)).toThrow(RangeError);
  });

  it('rejects a non-integer length instead of recursing forever', () => {
    expect(() => countPossibleSecrets(2.5, 10)).toThrow(RangeError);
  });
});
