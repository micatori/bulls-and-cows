import { BASES, BASE_LABELS, type Base } from '../game/alphabet.ts';
import { availableSecrets, canStart, configOf } from '../game/state.ts';
import {
  isLengthAllowed,
  lengthOptions,
  selectBase,
  selectLength,
} from '../game/settings.ts';
import type { GameConfig, GameState, ScoreRecord } from '../game/types.ts';
import { el, on, setEnabled } from './dom.ts';
import { formatNumber } from './format.ts';
import { renderScoreboard } from './scoreboard.ts';

export interface SettingsHandlers {
  readonly onConfigChange: (config: GameConfig) => void;
  readonly onStart: () => void;
}

const field = (title: string, children: readonly Node[]): HTMLElement =>
  el('section', { className: 'field' }, [
    el('h2', { className: 'field-title', text: title }),
    ...children,
  ]);

export const renderSettings = (
  state: GameState,
  records: readonly ScoreRecord[],
  handlers: SettingsHandlers,
): readonly Node[] => {
  const draft = configOf(state);
  const locked = state.status !== 'configuring';

  const baseButtons = BASES.map((base: Base) => {
    const active = base === draft.base;
    const button = el('button', {
      className: active ? 'chip chip-active' : 'chip',
      attrs: {
        type: 'button',
        'aria-pressed': active,
        title: BASE_LABELS[base],
      },
      text: base,
    });

    on(button, 'click', () => {
      handlers.onConfigChange(selectBase(draft, base));
    });

    return button;
  });

  const lengthButtons = lengthOptions().map(length => {
    const allowed = isLengthAllowed(length, draft.base);
    const button = el('button', {
      className: `chip${length === draft.length ? ' chip-active' : ''}`,
      attrs: {
        type: 'button',
        'aria-pressed': length === draft.length,
        title: allowed
          ? `секретов: ${formatNumber(availableSecrets({ length, base: draft.base }))}`
          : 'в этой системе нет секретов такой длины',
      },
      text: String(length),
    });

    setEnabled(button, allowed && !locked);

    if (allowed) {
      on(button, 'click', () => {
        handlers.onConfigChange(selectLength(draft, length));
      });
    }

    return button;
  });

  const startButton = el('button', {
    className: 'primary',
    attrs: { type: 'button' },
    text: 'Начать игру',
  });
  setEnabled(startButton, !locked && canStart(draft));
  on(startButton, 'click', handlers.onStart);

  return [
    el('p', {
      className: 'hint',
      text: 'Компьютер загадывает число из уникальных цифр; лидирующий ноль разрешён. После старта настройки недоступны.',
    }),
    field('Длина секретного числа', lengthButtons),
    field('Система счисления', baseButtons),
    el('p', {
      className: 'summary',
      text: `Всего секретов при таких настройках: ${formatNumber(availableSecrets(draft))}`,
    }),
    startButton,
    renderScoreboard(records),
  ];
};
