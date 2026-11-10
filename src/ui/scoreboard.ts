import { alphabetOf } from '../game/alphabet.ts';
import { MAX_RECORDS, takeTop } from '../game/records.ts';
import type { ScoreRecord } from '../game/types.ts';
import { el } from './dom.ts';
import { formatDuration, plural } from './format.ts';

const headerRow = (): HTMLElement =>
  el('tr', {}, [
    el('th', { text: '#' }),
    el('th', { text: 'Попытки' }),
    el('th', { text: 'Время' }),
    el('th', { text: 'Настройки' }),
  ]);

const recordRow = (record: ScoreRecord, position: number): HTMLElement =>
  el('tr', {}, [
    el('td', { text: String(position + 1) }),
    el('td', { text: String(record.attempts) }),
    el('td', { text: formatDuration(record.elapsedMs) }),
    el('td', {}, [
      el('span', {
        className: 'badge',
        text: `${record.base} · ${plural(record.length, 'цифра', 'цифры', 'цифр')}`,
      }),
    ]),
  ]);

export const renderScoreboard = (
  records: readonly ScoreRecord[],
): HTMLElement => {
  const top = takeTop(MAX_RECORDS)(records);

  const body =
    top.length === 0
      ? el('p', {
          className: 'hint',
          text: 'Рекордов пока нет — сыграйте партию.',
        })
      : el(
          'tbody',
          {},
          top.map((record, index) => recordRow(record, index)),
        );

  return el('section', { className: 'field' }, [
    el('h2', { className: 'field-title', text: 'Таблица рекордов' }),
    ...(top.length === 0
      ? [body]
      : [
          el('table', { className: 'score-table' }, [
            el('thead', {}, [headerRow()]),
            body,
          ]),
        ]),
    el('p', {
      className: 'hint',
      text: `Алфавит выбранной системы: ${alphabetOf('hex')}`,
    }),
  ]);
};
