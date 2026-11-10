import { registerRecord } from '../game/records.ts';
import {
  backToSettings,
  createInitialState,
  setDraftConfig,
  startRound,
  submitAttempt,
  toRecord,
} from '../game/state.ts';
import type { GameConfig, GameState, ScoreRecord } from '../game/types.ts';
import {
  readRecords,
  writeRecords,
  type StorageLike,
} from '../storage/localStorageRecords.ts';
import { el, replaceAll } from './dom.ts';
import { renderGame, type GameHandlers } from './gameScreen.ts';
import { HINT, describeRejection, type Feedback } from './messages.ts';
import { renderSettings, type SettingsHandlers } from './settingsScreen.ts';

export type Listener = (state: GameState) => void;

export interface Store {
  readonly getState: () => GameState;
  readonly setState: (next: GameState) => void;
  readonly subscribe: (listener: Listener) => () => void;
}

export const createStore = (
  initial: GameState = createInitialState(),
): Store => {
  let state = initial;
  const listeners = new Set<Listener>();

  const getState = (): GameState => state;

  const setState = (next: GameState): void => {
    if (Object.is(next, state)) {
      return;
    }

    state = next;

    [...listeners].forEach(listener => listener(next));
  };

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  return { getState, setState, subscribe };
};

const focusInput = (container: HTMLElement): void => {
  const candidate = container.querySelector('input');

  if (candidate instanceof HTMLInputElement) {
    candidate.focus();
  }
};

export const mountApp = (
  root: HTMLElement,
  storage: StorageLike = window.localStorage,
): (() => void) => {
  const screen = el('main', { className: 'screen' });

  replaceAll(root, [
    el('header', { className: 'header' }, [
      el('h1', { text: 'Bulls and Cows' }),
    ]),
    screen,
  ]);

  const store = createStore();
  let records: readonly ScoreRecord[] = readRecords(storage);
  let feedback: Feedback = HINT;
  let clockUpdater: ((now: number) => void) | null = null;
  let intervalId: number | null = null;

  const stopClock = (): void => {
    if (intervalId === null) {
      return;
    }

    window.clearInterval(intervalId);
    intervalId = null;
  };

  const startClock = (): void => {
    if (intervalId !== null) {
      return;
    }

    intervalId = window.setInterval(() => {
      clockUpdater?.(Date.now());
    }, 500);
  };

  const render = (): void => {
    const state = store.getState();
    clockUpdater = null;

    if (state.status === 'configuring') {
      replaceAll(screen, renderSettings(state, records, settingsHandlers));
      stopClock();

      return;
    }

    const view = renderGame(state, records, feedback, Date.now(), gameHandlers);
    replaceAll(screen, view.nodes);
    clockUpdater = view.updateClock;
    startClock();

    if (
      state.status === 'running' &&
      document.activeElement === document.body
    ) {
      focusInput(screen);
    }
  };

  const handleConfigChange = (config: GameConfig): void => {
    feedback = HINT;
    store.setState(setDraftConfig(store.getState(), config));
  };

  const handleStart = (): void => {
    const state = store.getState();

    if (state.status !== 'configuring') {
      return;
    }

    feedback = HINT;
    store.setState(startRound(state.draft, Date.now()));
  };

  const handleSubmit = (guess: string): void => {
    const before = store.getState();
    const result = submitAttempt(before, guess, Date.now());
    const after = result.state;

    if (result.status === 'rejected') {
      feedback = describeRejection(result.reason);
      render();

      return;
    }

    if (before.status === 'running' && after.status === 'won') {
      records = registerRecord(records, toRecord(after));
      writeRecords(storage, records);
      feedback = {
        kind: 'info',
        text: 'Раунд выигран — результат добавлен в таблицу рекордов.',
      };
    }

    store.setState(after);
  };

  const handleNewGame = (): void => {
    feedback = HINT;
    store.setState(backToSettings(store.getState()));
  };

  const settingsHandlers: SettingsHandlers = {
    onConfigChange: handleConfigChange,
    onStart: handleStart,
  };

  const gameHandlers: GameHandlers = {
    onSubmit: handleSubmit,
    onNewGame: handleNewGame,
  };

  const unsubscribe = store.subscribe(render);
  render();

  return () => {
    stopClock();
    unsubscribe();
  };
};
