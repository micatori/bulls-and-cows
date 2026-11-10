import { describe, expect, it } from 'vitest';

import { createDigitValidator } from '../src/game/createDigitValidator';

describe('createDigitValidator', () => {
  it('returns a predicate function instead of a boolean', () => {
    expect(typeof createDigitValidator('hex')).toBe('function');
  });

  it('accepts digits belonging to the chosen base', () => {
    const isHex = createDigitValidator('hex');
    expect(isHex('0')).toBe(true);
    expect(isHex('9')).toBe(true);
    expect(isHex('a')).toBe(true);
    expect(isHex('f')).toBe(true);
  });

  it('is case-insensitive for hex digits', () => {
    const isHex = createDigitValidator('hex');
    expect(isHex('A')).toBe(isHex('a'));
    expect(isHex('F')).toBe(true);
    expect(isHex('A')).toBe(true);
  });

  it('rejects digits outside the chosen base', () => {
    expect(createDigitValidator('bin')('2')).toBe(false);
    expect(createDigitValidator('oct')('8')).toBe(false);
    expect(createDigitValidator('dec')('a')).toBe(false);
    expect(createDigitValidator('hex')('g')).toBe(false);
  });

  it('rejects empty input and multi-character strings', () => {
    const isDec = createDigitValidator('dec');
    expect(isDec('')).toBe(false);
    expect(isDec('12')).toBe(false);
    expect(isDec('1 ')).toBe(false);
    expect(isDec('1.0')).toBe(false);
  });

  it('creates independent predicates per base', () => {
    const isBin = createDigitValidator('bin');
    const isHex = createDigitValidator('hex');
    expect(isBin('1')).toBe(true);
    expect(isHex('1')).toBe(true);
    expect(isBin('f')).toBe(false);
    expect(isHex('f')).toBe(true);
  });
});
