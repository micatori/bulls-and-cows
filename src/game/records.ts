import type { ScoreRecord } from './types';

const notImplemented = (name: string): never => {
  throw new Error(`${name} is not implemented yet`);
};

export const MAX_RECORDS = 10;

export const compareRecords = (_a: ScoreRecord, _b: ScoreRecord): number =>
  notImplemented('compareRecords');

export const insertRecord = (
  _records: readonly ScoreRecord[],
  _record: ScoreRecord,
): readonly ScoreRecord[] => notImplemented('insertRecord');

export const takeTop =
  (_count: number) =>
  (_records: readonly ScoreRecord[]): readonly ScoreRecord[] =>
    notImplemented('takeTop');

export const registerRecord = (
  _records: readonly ScoreRecord[],
  _record: ScoreRecord,
): readonly ScoreRecord[] => notImplemented('registerRecord');

export const isScoreRecord = (_value: unknown): _value is ScoreRecord =>
  notImplemented('isScoreRecord');

export const sanitizeRecords = (_value: unknown): readonly ScoreRecord[] =>
  notImplemented('sanitizeRecords');
