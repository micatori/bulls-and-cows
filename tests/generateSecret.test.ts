import { describe, expect, it } from 'vitest';

import { DIGITS_BY_BASE } from '../src/game/alphabet';
import { generateSecret } from '../src/game/generateSecret';

import {
  createCountingRandom,
  createScriptedRandom,
  createSeededRandom,
} from './helpers/randomSource';

describe('generateSecret', () => {
  it('takes randomness from the injected source, exactly once per digit', () => {
    const { random, calls } = createCountingRandom(0);

    generateSecret(4, 'dec', random);

    expect(calls()).toBe(4);
  });

  it('is deterministic: always the first digits when random is zero', () => {
    const alwaysZero = () => 0;

    expect(generateSecret(2, 'dec', alwaysZero)).toBe('01');
    expect(generateSecret(3, 'dec', alwaysZero)).toBe('012');
    expect(generateSecret(2, 'hex', alwaysZero)).toBe('01');
    expect(generateSecret(2, 'bin', alwaysZero)).toBe('01');
  });

  it('is deterministic: always the last digits when random is almost one', () => {
    const almostOne = () => 0.999999;

    expect(generateSecret(2, 'dec', almostOne)).toBe('98');
    expect(generateSecret(3, 'dec', almostOne)).toBe('987');
    expect(generateSecret(3, 'hex', almostOne)).toBe('fed');
    expect(generateSecret(2, 'oct', almostOne)).toBe('76');
  });

  it('picks without replacement from the shrinking alphabet', () => {
    const scripted = createScriptedRandom([0, 0.5, 0.9]);

    // dec: '0' first, then index 4 of ['1'..'9'] = '5', then index 7 of the rest = '9'
    expect(generateSecret(3, 'dec', scripted)).toBe('059');
  });

  it('keeps a leading zero when it is chosen first', () => {
    expect(generateSecret(2, 'dec', createScriptedRandom([0, 0.5]))).toBe('05');
    expect(generateSecret(4, 'hex', createScriptedRandom([0, 0, 0, 0]))).toBe(
      '0123',
    );
  });

  it('produces secrets of the requested length with unique valid digits', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const base = 'hex';
      const length = 6;
      const secret = generateSecret(length, base, createSeededRandom(seed));

      expect(secret).toHaveLength(length);
      expect(new Set(secret).size).toBe(length);

      for (const char of secret) {
        expect(DIGITS_BY_BASE[base]).toContain(char);
      }
    }
  });

  it('emits hex digits only in lowercase', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const secret = generateSecret(6, 'hex', createSeededRandom(seed));

      expect(secret).toBe(secret.toLowerCase());
    }
  });

  it('returns the same secret for the same seed', () => {
    expect(generateSecret(5, 'dec', createSeededRandom(42))).toBe(
      generateSecret(5, 'dec', createSeededRandom(42)),
    );
  });

  it('does not always return the same secret for different seeds', () => {
    const secrets = new Set<string>();

    for (let seed = 1; seed <= 50; seed += 1) {
      secrets.add(generateSecret(4, 'dec', createSeededRandom(seed)));
    }

    expect(secrets.size).toBeGreaterThan(1);
  });

  it('falls back to Math.random when the source is omitted', () => {
    const secret = generateSecret(2, 'bin');

    expect(['01', '10']).toContain(secret);
  });

  it('rejects a length that exceeds the number of digits in the base', () => {
    expect(() => generateSecret(3, 'bin', () => 0)).toThrow(RangeError);
    expect(() => generateSecret(4, 'bin', () => 0)).toThrow(RangeError);
    expect(() => generateSecret(9, 'oct', () => 0)).toThrow(RangeError);
    expect(() => generateSecret(11, 'dec', () => 0)).toThrow(RangeError);
    expect(() => generateSecret(17, 'hex', () => 0)).toThrow(RangeError);
  });

  it('accepts a length equal to the number of digits in the base', () => {
    const alwaysZero = () => 0;

    expect(generateSecret(2, 'bin', alwaysZero)).toBe('01');
    expect(generateSecret(8, 'oct', alwaysZero)).toBe('01234567');
    expect(generateSecret(16, 'hex', alwaysZero)).toBe('0123456789abcdef');
  });

  it('rejects a source that breaks the [0, 1) contract', () => {
    expect(() => generateSecret(2, 'dec', () => 1)).toThrow(RangeError);
  });
});
