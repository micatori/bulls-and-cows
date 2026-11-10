import { alphabetOf, type Base } from './alphabet';
import type { RandomSource } from './types';

interface Picked<T> {
  readonly value: T;
  readonly rest: readonly T[];
}

const digitAt = (digits: readonly string[], index: number): string => {
  const digit = digits[index];

  if (digit === undefined) {
    throw new RangeError(`random source returned index ${index} out of range`);
  }

  return digit;
};

const pickFrom = (
  pool: readonly string[],
  random: RandomSource,
): Picked<string> => {
  const index = Math.floor(random() * pool.length);

  return {
    value: digitAt(pool, index),
    rest: pool.filter((_, position) => position !== index),
  };
};

const buildSecret = (
  pool: readonly string[],
  length: number,
  random: RandomSource,
): string => {
  if (length === 0) {
    return '';
  }

  const { value, rest } = pickFrom(pool, random);

  return value + buildSecret(rest, length - 1, random);
};

export const generateSecret = (
  length: number,
  base: Base,
  random: RandomSource = Math.random,
): string => {
  const pool = alphabetOf(base).split('');

  if (length > pool.length) {
    throw new RangeError(
      `length ${length} exceeds ${pool.length} digits available in base ${base}`,
    );
  }

  if (length < 0) {
    throw new RangeError(`length must not be negative, got ${length}`);
  }

  return buildSecret(pool, length, random);
};
