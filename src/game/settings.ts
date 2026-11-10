import { alphabetOf } from './alphabet.ts';
import type { Base } from './alphabet.ts';
import { countPossibleSecrets } from './countPossibleSecrets.ts';
import type { GameConfig } from './types.ts';

export const MIN_SECRET_LENGTH = 2;
export const MAX_SECRET_LENGTH = 6;

export const lengthOptions = (): readonly number[] =>
  Array.from(
    { length: MAX_SECRET_LENGTH - MIN_SECRET_LENGTH + 1 },
    (_, index) => {
      return MIN_SECRET_LENGTH + index;
    },
  );

const isWithinSettingsRange = (length: number): boolean =>
  length >= MIN_SECRET_LENGTH && length <= MAX_SECRET_LENGTH;

export const isLengthAllowed = (length: number, base: Base): boolean =>
  isWithinSettingsRange(length) && countPossibleSecrets(length, base) > 0;

const maxAllowedLength = (base: Base): number =>
  Math.min(MAX_SECRET_LENGTH, alphabetOf(base).length);

export const selectBase = (draft: GameConfig, base: Base): GameConfig => ({
  length: Math.min(draft.length, maxAllowedLength(base)),
  base,
});

export const selectLength = (draft: GameConfig, length: number): GameConfig =>
  isLengthAllowed(length, draft.base) ? { ...draft, length } : draft;
