import type { Score } from './types';

const toDigits = (value: string): readonly string[] =>
  value.toLowerCase().split('');

const digitAt = (digits: readonly string[], index: number): string =>
  digits[index] ?? '';

interface Partitioned {
  readonly bulls: readonly string[];
  readonly misplacedGuessDigits: readonly string[];
  readonly unmatchedSecretDigits: readonly string[];
}

const partition = (
  secretDigits: readonly string[],
  guessDigits: readonly string[],
): Partitioned => ({
  bulls: guessDigits.filter(
    (digit, index) => digit === digitAt(secretDigits, index),
  ),
  misplacedGuessDigits: guessDigits.filter(
    (digit, index) => digit !== digitAt(secretDigits, index),
  ),
  unmatchedSecretDigits: secretDigits.filter(
    (digit, index) => digit !== digitAt(guessDigits, index),
  ),
});

const countMatched = (
  candidates: readonly string[],
  available: readonly string[],
): number =>
  candidates.reduce(
    ({ count, remaining }, digit) => {
      const position = remaining.indexOf(digit);

      if (position === -1) {
        return { count, remaining };
      }

      return {
        count: count + 1,
        remaining: [
          ...remaining.slice(0, position),
          ...remaining.slice(position + 1),
        ],
      };
    },
    { count: 0, remaining: available },
  ).count;

export const evaluateGuess = (secret: string, guess: string): Score => {
  const secretDigits = toDigits(secret);
  const guessDigits = toDigits(guess);

  const { bulls, misplacedGuessDigits, unmatchedSecretDigits } = partition(
    secretDigits,
    guessDigits,
  );

  return {
    bulls: bulls.length,
    cows: countMatched(misplacedGuessDigits, unmatchedSecretDigits),
  };
};
