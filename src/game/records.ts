import { DIGITS_BY_BASE } from './alphabet';
import type { Base, ScoreRecord } from './types';

export const MAX_RECORDS = 10;

const byAttempts = (a: ScoreRecord, b: ScoreRecord): number =>
  a.attempts - b.attempts;

const byElapsed = (a: ScoreRecord, b: ScoreRecord): number =>
  a.elapsedMs - b.elapsedMs;

const byFinishedAt = (a: ScoreRecord, b: ScoreRecord): number =>
  a.finishedAt - b.finishedAt;

export const compareRecords = (a: ScoreRecord, b: ScoreRecord): number =>
  byAttempts(a, b) || byElapsed(a, b) || byFinishedAt(a, b);

export const insertRecord = (
  records: readonly ScoreRecord[],
  record: ScoreRecord,
): readonly ScoreRecord[] => [...records, record].sort(compareRecords);

export const takeTop =
  (count: number) =>
  (records: readonly ScoreRecord[]): readonly ScoreRecord[] =>
    count <= 0 ? [] : records.slice(0, count);

export const registerRecord = (
  records: readonly ScoreRecord[],
  record: ScoreRecord,
): readonly ScoreRecord[] =>
  takeTop(MAX_RECORDS)(insertRecord(records, record));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isCount = (value: unknown): boolean =>
  isFiniteNumber(value) && Number.isInteger(value) && value >= 0;

const isBaseName = (value: unknown): value is Base =>
  typeof value === 'string' && Object.hasOwn(DIGITS_BY_BASE, value);

const asObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const isScoreRecord = (value: unknown): value is ScoreRecord => {
  const candidate = asObject(value);

  if (candidate === null) {
    return false;
  }

  return (
    isCount(candidate.length) &&
    isBaseName(candidate.base) &&
    isCount(candidate.attempts) &&
    isCount(candidate.elapsedMs) &&
    isCount(candidate.finishedAt)
  );
};

export const sanitizeRecords = (value: unknown): readonly ScoreRecord[] =>
  Array.isArray(value)
    ? value.filter(isScoreRecord).sort(compareRecords).slice(0, MAX_RECORDS)
    : [];
