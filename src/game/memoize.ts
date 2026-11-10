export interface Memoized<A extends readonly unknown[], R> {
  (...args: A): R;
  readonly cacheSize: () => number;
}

interface CacheEntry<R> {
  readonly value: R;
}

const defaultKeyOf = (args: readonly unknown[]): string =>
  args.map(arg => String(arg)).join('|');

export const memoize = <A extends readonly unknown[], R>(
  fn: (...args: A) => R,
  keyOf: (...args: A) => string = (...args) => defaultKeyOf(args),
): Memoized<A, R> => {
  const cache = new Map<string, CacheEntry<R>>();

  const memoized = (...args: A): R => {
    const key = keyOf(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached.value;
    }

    const entry: CacheEntry<R> = { value: fn(...args) };
    cache.set(key, entry);

    return entry.value;
  };

  return Object.assign(memoized, { cacheSize: () => cache.size });
};
