import { describe, expect, it } from 'vitest';

import {
  MAX_RECORDS,
  compareRecords,
  insertRecord,
  isScoreRecord,
  registerRecord,
  sanitizeRecords,
  takeTop,
} from '../src/game/records';
import type { ScoreRecord } from '../src/game/types';

const r1: ScoreRecord = {
  length: 4,
  base: 'dec',
  attempts: 5,
  elapsedMs: 40000,
  finishedAt: 1000,
};
const r2: ScoreRecord = {
  length: 4,
  base: 'dec',
  attempts: 3,
  elapsedMs: 120000,
  finishedAt: 2000,
};
const r3: ScoreRecord = {
  length: 2,
  base: 'bin',
  attempts: 3,
  elapsedMs: 60000,
  finishedAt: 3000,
};
const r4: ScoreRecord = {
  length: 4,
  base: 'hex',
  attempts: 10,
  elapsedMs: 15000,
  finishedAt: 4000,
};

const record = (
  attempts: number,
  elapsedMs: number,
  finishedAt: number,
): ScoreRecord => ({ length: 4, base: 'dec', attempts, elapsedMs, finishedAt });

const ladder = (): ScoreRecord[] =>
  Array.from({ length: MAX_RECORDS }, (_, index) =>
    record(index + 1, (index + 1) * 1000, (index + 1) * 10000),
  );

describe('compareRecords', () => {
  it('sorts primarily by the number of attempts', () => {
    expect(compareRecords(r3, r1)).toBeLessThan(0);
    expect(compareRecords(r1, r3)).toBeGreaterThan(0);
  });

  it('breaks an attempt tie with the elapsed time', () => {
    expect(compareRecords(r2, r3)).toBeGreaterThan(0);
    expect(compareRecords(r3, r2)).toBeLessThan(0);
  });

  it('breaks a time tie with the earlier finishedAt', () => {
    const earlier = record(3, 60000, 5000);
    const later = record(3, 60000, 9000);

    expect(compareRecords(earlier, later)).toBeLessThan(0);
    expect(insertRecord([later], earlier)[0]).toBe(earlier);
  });

  it('returns exactly zero for identical records', () => {
    expect(compareRecords(r1, record(5, 40000, 1000))).toBe(0);
  });

  it('is antisymmetric over a table of pairs', () => {
    const records = [r1, r2, r3, r4];

    records.forEach(left => {
      records.forEach(right => {
        expect(Math.sign(compareRecords(left, right))).toBe(
          -Math.sign(compareRecords(right, left)),
        );
      });
    });
  });

  it('sorts a mixed list into the expected order', () => {
    const sorted = [...[r4, r2, r1, r3]].sort(compareRecords);

    expect(sorted.map(item => item.finishedAt)).toEqual([
      3000, 2000, 1000, 4000,
    ]);
  });

  it('never compares attempt counts as strings', () => {
    const tenAttempts = record(10, 15000, 4000);
    const threeAttempts = record(3, 120000, 2000);

    expect(insertRecord([threeAttempts], tenAttempts).at(-1)).toBe(tenAttempts);
  });
});

describe('insertRecord', () => {
  it('returns a new sorted array that is longer by one record', () => {
    const records = [r3, r1];
    const result = insertRecord(records, r2);

    expect(result).not.toBe(records);
    expect(result).toHaveLength(3);
    expect(result.map(item => item.finishedAt)).toEqual([2000, 3000, 1000]);
  });

  it('leaves the input array untouched', () => {
    const records = [r4, r2, r1, r3];
    const snapshot = structuredClone(records);

    insertRecord(records, r1);

    expect(records).toEqual(snapshot);
    expect(records.map(item => item.finishedAt)).toEqual([
      4000, 2000, 1000, 3000,
    ]);
  });

  it('keeps an empty list working', () => {
    expect(insertRecord([], r1)).toEqual([r1]);
  });

  it('keeps duplicates when they really happened', () => {
    const again = record(5, 40000, 1000);

    expect(insertRecord([r1], again)).toHaveLength(2);
  });

  it('reuses element references instead of cloning records', () => {
    const result = insertRecord([r3], r2);

    expect(result[0]).toBe(r2);
    expect(result[1]).toBe(r3);
  });
});

describe('takeTop', () => {
  it('is curried: the count is applied before the list', () => {
    const topTwo = takeTop(2);

    expect(topTwo([r3, r2, r1, r4])).toHaveLength(2);
    expect(topTwo([r1, r3])).toHaveLength(2);
  });

  it('takes the leading records of an already sorted list', () => {
    expect(takeTop(2)([r3, r2, r1, r4]).map(item => item.finishedAt)).toEqual([
      3000, 2000,
    ]);
  });

  it('returns the whole list when it is shorter than the count', () => {
    const records = [r3, r2];

    expect(takeTop(10)(records)).toHaveLength(2);
    expect(takeTop(10)(records).map(item => item.finishedAt)).toEqual([
      3000, 2000,
    ]);
  });

  it('returns nothing for a non-positive count', () => {
    expect(takeTop(0)([r1])).toEqual([]);
    expect(takeTop(-1)([r1])).toEqual([]);
  });

  it('does not mutate the given list', () => {
    const records = [r3, r2, r1];
    const snapshot = structuredClone(records);

    takeTop(2)(records);

    expect(records).toEqual(snapshot);
  });
});

describe('registerRecord', () => {
  it('inserts a record and trims the list back to the scoreboard size', () => {
    const result = registerRecord(ladder(), record(3, 1500, 999999));

    expect(result).toHaveLength(MAX_RECORDS);
    expect(result[0]).toEqual(record(3, 1500, 999999));
    expect(result.map(item => item.attempts)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('drops a record that is worse than every stored one', () => {
    const result = registerRecord(ladder(), record(99, 1, 2));

    expect(result).toHaveLength(MAX_RECORDS);
    expect(result.map(item => item.attempts)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('evicts the weakest record when a better one arrives', () => {
    const result = registerRecord(ladder(), record(1, 500, 999999));

    expect(result).toHaveLength(MAX_RECORDS);
    expect(result.map(item => item.attempts)).toEqual([
      1, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('does not mutate the stored ladder', () => {
    const ladderCopy = structuredClone(ladder());
    const records = ladder();

    registerRecord(records, record(2, 1000, 500));

    expect(records).toEqual(ladderCopy);
  });
});

describe('isScoreRecord', () => {
  it('accepts a well-formed record', () => {
    expect(isScoreRecord(r1)).toBe(true);
  });

  it('rejects non-objects', () => {
    [null, undefined, 7, 'record', [], [r1]].forEach(value => {
      expect(isScoreRecord(value)).toBe(false);
    });
  });

  it('rejects records with missing, non-numeric or NaN fields', () => {
    [
      { length: 4, base: 'dec', attempts: 5, elapsedMs: 40000 },
      { ...r1, elapsedMs: Number.NaN },
      { ...r1, attempts: '5' },
      { ...r1, finishedAt: null },
      { ...r1, elapsedMs: Number.POSITIVE_INFINITY },
      { ...r1, attempts: 2.5 },
      { ...r1, attempts: -1 },
    ].forEach(value => {
      expect(isScoreRecord(value)).toBe(false);
    });
  });

  it('rejects an unknown base name, including inherited object keys', () => {
    [
      { ...r1, base: 'binary' },
      { ...r1, base: 'toString' },
      { ...r1, base: 'constructor' },
      { ...r1, base: 10 },
    ].forEach(value => {
      expect(isScoreRecord(value)).toBe(false);
    });
  });

  it('accepts every known base', () => {
    (['bin', 'oct', 'dec', 'hex'] as const).forEach(base => {
      expect(isScoreRecord({ ...r1, base })).toBe(true);
    });
  });
});

describe('sanitizeRecords', () => {
  it('returns an empty list for anything that is not an array', () => {
    [null, undefined, '[]', 0, { records: [] }].forEach(value => {
      expect(sanitizeRecords(value)).toEqual([]);
    });
  });

  it('keeps only well-formed records and orders them like the scoreboard', () => {
    const result = sanitizeRecords([
      r4,
      null,
      r2,
      'x',
      r1,
      { ...r3, attempts: '3' },
      r3,
    ]);

    expect(result.map(item => item.finishedAt)).toEqual([
      3000, 2000, 1000, 4000,
    ]);
  });

  it('trims the sanitized list to the scoreboard size', () => {
    const many = Array.from({ length: MAX_RECORDS + 5 }, (_, index) =>
      record(index + 1, index, index),
    );

    expect(sanitizeRecords(many)).toHaveLength(MAX_RECORDS);
  });
});
