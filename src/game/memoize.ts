export interface Memoized<A extends readonly unknown[], R> {
  (...args: A): R;
  readonly cacheSize: () => number;
}

export const memoize = <A extends readonly unknown[], R>(
  _fn: (...args: A) => R,
  _keyOf?: (...args: A) => string,
): Memoized<A, R> => {
  throw new Error('memoize is not implemented yet');
};
