import { alphabetOf } from '../game/alphabet.ts';
import { createDigitValidator } from '../game/createDigitValidator.ts';
import { attemptsOf, elapsedMs, hasTried } from '../game/state.ts';
import { isValidGuess } from '../game/isValidGuess.ts';
import type {
  Attempt,
  RunningState,
  ScoreRecord,
  WonState,
} from '../game/types.ts';
import { el, on, setEnabled } from './dom.ts';
import { formatDuration, plural } from './format.ts';
import type { Feedback } from './messages.ts';
import { renderScoreboard } from './scoreboard.ts';

export interface GameHandlers {
  readonly onSubmit: (guess: string) => void;
  readonly onNewGame: () => void;
}

export interface GameView {
  readonly nodes: readonly Node[];
  readonly updateClock: (now: number) => void;
}

const sanitizeInput = (
  raw: string,
  isDigit: (char: string) => boolean,
  maxLength: number,
): string => raw.split('').filter(isDigit).slice(0, maxLength).join('');

const scoreLine = (attempt: Attempt): string =>
  `${plural(attempt.bulls, 'бык', 'быка', 'быков')} · ${plural(
    attempt.cows,
    'корова',
    'коровы',
    'коров',
  )}`;

const renderHistory = (attempts: readonly Attempt[]): HTMLElement => {
  if (attempts.length === 0) {
    return el('section', { className: 'field' }, [
      el('h2', { className: 'field-title', text: 'История попыток' }),
      el('p', { className: 'hint', text: 'Пока ни одной попытки.' }),
    ]);
  }

  return el('section', { className: 'field' }, [
    el('h2', { className: 'field-title', text: 'История попыток' }),
    el(
      'ul',
      { className: 'history' },
      attempts.map((attempt, index) =>
        el('li', { className: 'history-item' }, [
          el('span', { className: 'history-index', text: `#${index + 1}` }),
          el('span', {
            className: 'history-guess',
            text: attempt.guess.toUpperCase(),
          }),
          el('span', { className: 'history-score', text: scoreLine(attempt) }),
        ]),
      ),
    ),
  ]);
};

const durationOf = (state: RunningState | WonState, now: number): number =>
  elapsedMs(state.startedAt, state.status === 'won' ? state.finishedAt : now);

export const renderGame = (
  state: RunningState | WonState,
  records: readonly ScoreRecord[],
  feedback: Feedback,
  now: number,
  handlers: GameHandlers,
): GameView => {
  const config = state.config;
  const isDigit = createDigitValidator(config.base);
  const attempts = attemptsOf(state);
  const won = state.status === 'won';

  const input = el('input', {
    className: 'guess-input',
    attrs: {
      type: 'text',
      autocomplete: 'off',
      spellcheck: 'false',
      maxlength: config.length,
      'aria-label': 'Попытка',
      placeholder: `цифры ${config.base}`,
    },
  });

  const submitButton = el('button', {
    className: 'primary',
    attrs: { type: 'button' },
    text: 'Проверить',
  });

  const newGameButton = el('button', {
    attrs: { type: 'button' },
    text: 'Новая игра',
  });

  const clockNode = el('span', {
    text: formatDuration(durationOf(state, now)),
  });
  const attemptCount = el('span', {
    text: plural(attempts.length, 'попытка', 'попытки', 'попыток'),
  });
  const message = el('p', {
    className: `message message-${feedback.kind}`,
    text: feedback.text,
  });

  const refreshValidity = (): void => {
    const guess = input.value;
    const acceptable =
      !won &&
      guess.length > 0 &&
      isValidGuess(guess, config.length, config.base) &&
      !hasTried(attempts, guess);

    setEnabled(submitButton, acceptable);
  };

  const submit = (): void => {
    if (input.value.length === 0) {
      return;
    }

    handlers.onSubmit(input.value);
  };

  on(input, 'input', () => {
    const cleaned = sanitizeInput(input.value, isDigit, config.length);

    if (cleaned !== input.value) {
      input.value = cleaned;
    }

    refreshValidity();
  });

  on(input, 'keydown', event => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    submit();
  });

  on(submitButton, 'click', submit);
  on(newGameButton, 'click', handlers.onNewGame);
  refreshValidity();

  const nodes: readonly Node[] = [
    el('p', {
      className: 'summary',
      text: `Секрет: ${plural(config.length, 'цифра', 'цифры', 'цифр')} · система ${config.base} · алфавит ${alphabetOf(config.base).toUpperCase()}`,
    }),
    el('p', { className: 'status-row' }, [
      attemptCount,
      el('span', { text: ' · время: ' }),
      clockNode,
      el('span', { text: won ? ' · раунд завершён' : ' · раунд идёт' }),
    ]),
    el('section', { className: 'guess-row' }, [
      input,
      submitButton,
      newGameButton,
    ]),
    message,
    renderHistory(attempts),
    ...(won
      ? [
          el('p', {
            className: 'result',
            text: `Угадано за ${plural(attempts.length, 'попытку', 'попытки', 'попыток')} · ${formatDuration(durationOf(state, now))} · секрет ${state.secret.toUpperCase()}`,
          }),
        ]
      : []),
    renderScoreboard(records),
  ];

  return {
    nodes,
    updateClock: tickNow => {
      clockNode.textContent = formatDuration(durationOf(state, tickNow));
    },
  };
};
