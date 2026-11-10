import type { Base } from './alphabet';
import type { RandomSource } from './types';

export const generateSecret = (
  _length: number,
  _base: Base,
  _random: RandomSource = Math.random,
): string => {
  throw new Error('generateSecret is not implemented yet');
};
