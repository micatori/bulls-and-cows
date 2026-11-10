import { createInitialState } from '../game/state.ts';
import type { GameState } from '../game/types.ts';
import { el, replaceAll } from './dom.ts';

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

const renderShell = (state: GameState): readonly Node[] => [
  el('h1', { text: 'Bulls and Cows' }),
  el('p', { className: 'status', text: `status: ${state.status}` }),
];

export const mountApp = (root: HTMLElement): (() => void) => {
  const store = createStore();

  const render = (state: GameState): void => {
    replaceAll(root, renderShell(state));
  };

  const unsubscribe = store.subscribe(render);
  render(store.getState());

  return unsubscribe;
};
