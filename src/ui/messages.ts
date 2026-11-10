import type { SubmitRejection } from '../game/state.ts';

export type FeedbackKind = 'hint' | 'error' | 'info';

export interface Feedback {
  readonly kind: FeedbackKind;
  readonly text: string;
}

export const HINT: Feedback = {
  kind: 'hint',
  text: 'Введите попытку: столько цифр, какой длины секрет, без повторов.',
};

export const describeRejection = (reason: SubmitRejection): Feedback => {
  switch (reason) {
    case 'invalid-guess':
      return {
        kind: 'error',
        text: 'Недопустимая попытка: проверьте длину, допустимость цифр и повторы.',
      };
    case 'already-tried':
      return {
        kind: 'error',
        text: 'Такая попытка уже была — история осталась без изменений.',
      };
    case 'not-running':
      return { kind: 'error', text: 'Раунд не завершён и не начат заново.' };
  }
};
