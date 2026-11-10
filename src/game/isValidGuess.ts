import { type Base } from './alphabet.ts';
import { createDigitValidator } from './createDigitValidator.ts';

const hasValidLength = (guess: string, length: number): boolean =>
  guess.length === length;

const hasOnlyValidDigits = (guess: string, base: Base): boolean => {
  const isValidDigit = createDigitValidator(base);

  return guess.split('').every(isValidDigit);
};

const hasNoRepeats = (guess: string): boolean =>
  new Set(guess.toLowerCase()).size === guess.length;

export const isValidGuess = (
  guess: string,
  length: number,
  base: Base,
): boolean =>
  hasValidLength(guess, length) &&
  hasOnlyValidDigits(guess, base) &&
  hasNoRepeats(guess);
