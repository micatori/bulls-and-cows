import { alphabetOf, type Base } from './alphabet.ts';

export const createDigitValidator =
  (base: Base) =>
  (char: string): boolean =>
    char.length === 1 && alphabetOf(base).includes(char.toLowerCase());
