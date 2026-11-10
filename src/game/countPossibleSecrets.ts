import { DIGITS_BY_BASE, type Base } from './alphabet';
import { memoize } from './memoize';

type DigitCount = number;
type BaseOrCount = Base | DigitCount;

const toDigitCount = (base: BaseOrCount): DigitCount =>
  typeof base === 'number' ? base : DIGITS_BY_BASE[base].length;

export const countPossibleSecrets = memoize(
  (length: number, base: BaseOrCount): number => {
    if (!Number.isInteger(length) || length < 0) {
      throw new RangeError(
        `length must be a non-negative integer, got ${length}`,
      );
    }

    const digitCount = toDigitCount(base);

    if (!Number.isInteger(digitCount) || digitCount < 0) {
      throw new RangeError(
        `base must provide a non-negative digit count, got ${String(base)}`,
      );
    }

    if (length === 0) {
      return 1;
    }

    if (length > digitCount) {
      return 0;
    }

    return digitCount * countPossibleSecrets(length - 1, digitCount - 1);
  },
  (length, base) => `${length}:${toDigitCount(base)}`,
);
