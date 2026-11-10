import { sanitizeRecords } from '../game/records.ts';
import type { ScoreRecord } from '../game/types.ts';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const RECORDS_KEY = 'bulls-and-cows:records:v1';

export const readRecords = (storage: StorageLike): readonly ScoreRecord[] => {
  try {
    const raw = storage.getItem(RECORDS_KEY);

    return raw === null ? [] : sanitizeRecords(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeRecords = (
  storage: StorageLike,
  records: readonly ScoreRecord[],
): void => {
  try {
    storage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Приватный режим или переполнение квоты: таблица остаётся в памяти сессии.
  }
};
