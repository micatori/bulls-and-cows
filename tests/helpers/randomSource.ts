export type RandomSource = () => number;

/** Повторяемая последовательность: одинаковый seed → всегда тот же секрет (FIRST: Repeatable). */
export const createSeededRandom = (seed: number): RandomSource => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Источник, возвращающий заданные числа по порядку, последние — «зацикленные». */
export const createScriptedRandom = (
  values: readonly number[],
): RandomSource => {
  let index = 0;

  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

/** Считает, сколько раз функция вообще попросила случайное число. */
export const createCountingRandom = (
  value = 0,
): { readonly random: RandomSource; calls: () => number } => {
  let calls = 0;

  return {
    calls: () => calls,
    random: () => {
      calls += 1;
      return value;
    },
  };
};
