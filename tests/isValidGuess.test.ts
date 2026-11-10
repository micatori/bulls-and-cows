import { describe, expect, it } from 'vitest';

import { isValidGuess } from '../src/game/isValidGuess';

describe('isValidGuess', () => {
  it('accepts a guess of the exact expected length', () => {
    expect(isValidGuess('1234', 4, 'dec')).toBe(true);
    expect(isValidGuess('01', 2, 'dec')).toBe(true);
  });

  it('rejects guesses shorter or longer than expected', () => {
    expect(isValidGuess('12', 4, 'dec')).toBe(false);
    expect(isValidGuess('12345', 4, 'dec')).toBe(false);
    expect(isValidGuess('', 4, 'dec')).toBe(false);
  });

  it('allows a leading zero because secrets may start with it', () => {
    expect(isValidGuess('0123', 4, 'dec')).toBe(true);
    expect(isValidGuess('01', 2, 'bin')).toBe(true);
  });

  it('rejects characters outside the alphabet of the base', () => {
    expect(isValidGuess('12g4', 4, 'hex')).toBe(false);
    expect(isValidGuess('1294', 4, 'oct')).toBe(false);
    expect(isValidGuess('1020', 4, 'bin')).toBe(false);
    expect(isValidGuess('1 23', 4, 'dec')).toBe(false);
    expect(isValidGuess('1.23', 4, 'dec')).toBe(false);
  });

  it('accepts hex digits in any case and their mixture', () => {
    expect(isValidGuess('abcd', 4, 'hex')).toBe(true);
    expect(isValidGuess('ABCD', 4, 'hex')).toBe(true);
    expect(isValidGuess('aB3f', 4, 'hex')).toBe(true);
  });

  it('rejects a repeated digit', () => {
    expect(isValidGuess('1123', 4, 'dec')).toBe(false);
    expect(isValidGuess('1231', 4, 'dec')).toBe(false);
    expect(isValidGuess('00', 2, 'dec')).toBe(false);
  });

  it('treats upper and lower case hex letters as the same digit', () => {
    expect(isValidGuess('aa', 2, 'hex')).toBe(false);
    expect(isValidGuess('Aa', 2, 'hex')).toBe(false);
    expect(isValidGuess('aA', 2, 'hex')).toBe(false);
  });

  it('validates against the requested base, not against previous calls', () => {
    expect(isValidGuess('01', 2, 'bin')).toBe(true);
    expect(isValidGuess('01', 2, 'hex')).toBe(true);
    expect(isValidGuess('01', 3, 'hex')).toBe(false);
    expect(isValidGuess('01', 2, 'bin')).toBe(true);
  });
});
