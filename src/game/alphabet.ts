// src/game/alphabet.ts
export type Base = 'bin' | 'oct' | 'dec' | 'hex';

export const DIGITS_BY_BASE: Record<Base, string> = {
  bin: '01',
  oct: '01234567',
  dec: '0123456789',
  hex: '0123456789abcdef',
};

export const BASE_LABELS: Record<Base, string> = {
  bin: 'binary (0-1)',
  oct: 'octal (0-7)',
  dec: 'decimal (0-9)',
  hex: 'hexadecimal (0-9, a-f)',
};

export const MIN_LENGTH = 2;
export const MAX_LENGTH = 6;

export const alphabetOf = (base: Base): string => DIGITS_BY_BASE[base];

export const maxSecretLength = (base: Base): number => alphabetOf(base).length;
