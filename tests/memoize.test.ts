import { describe, expect, it } from 'vitest';

import { memoize } from '../src/game/memoize';

describe('memoize', () => {
  it('returns a callable wrapper', () => {
    expect(typeof memoize((value: number) => value)).toBe('function');
  });

  it('calls the wrapped function once for repeated equal arguments', () => {
    let calls = 0;
    const counted = memoize((value: number): number => {
      calls += 1;
      return value * 2;
    });

    expect(counted(3)).toBe(6);
    expect(counted(3)).toBe(6);
    expect(calls).toBe(1);
  });

  it('calls the wrapped function again for different arguments', () => {
    let calls = 0;
    const counted = memoize((value: number): number => {
      calls += 1;
      return value * 2;
    });

    expect(counted(3)).toBe(6);
    expect(counted(4)).toBe(8);
    expect(calls).toBe(2);
  });

  it('includes every argument in the default cache key', () => {
    const sum = memoize((left: number, right: number): number => left + right);

    expect(sum(2, 3)).toBe(5);
    expect(sum(2, 4)).toBe(6);
    expect(sum(3, 2)).toBe(5);
  });

  it('passes all arguments through to the wrapped function', () => {
    const seen: (string | number)[][] = [];
    const spy = memoize((left: number, right: string): string => {
      seen.push([left, right]);
      return `${left}${right}`;
    });

    expect(spy(1, 'a')).toBe('1a');
    expect(seen).toEqual([[1, 'a']]);
  });

  it('returns the identical cached result for object results', () => {
    let calls = 0;
    const make = memoize((value: number): { value: number } => {
      calls += 1;
      return { value };
    });

    expect(make(1)).toBe(make(1));
    expect(calls).toBe(1);
  });

  it('gives each memoize call its own cache', () => {
    let calls = 0;
    const counted = (value: number): number => {
      calls += 1;
      return value;
    };

    memoize(counted)(1);
    memoize(counted)(1);

    expect(calls).toBe(2);
  });

  it('accepts a custom keyOf so distinct arguments share a slot', () => {
    let calls = 0;
    const rounded = memoize(
      (value: number): number => {
        calls += 1;
        return Math.trunc(value);
      },
      (value: number) => String(Math.trunc(value)),
    );

    expect(rounded(1.2)).toBe(1);
    expect(rounded(1.7)).toBe(1);
    expect(calls).toBe(1);
  });

  it('grows the cache only for unseen keys', () => {
    const sum = memoize((left: number, right: number): number => left + right);

    expect(sum.cacheSize()).toBe(0);
    sum(1, 2);
    expect(sum.cacheSize()).toBe(1);
    sum(1, 2);
    expect(sum.cacheSize()).toBe(1);
    sum(2, 1);
    expect(sum.cacheSize()).toBe(2);
  });

  it('does not cache a thrown failure', () => {
    let calls = 0;
    const flaky = memoize((): number => {
      calls += 1;
      if (calls < 2) {
        throw new Error('first run fails');
      }
      return 42;
    });

    expect(() => flaky()).toThrow('first run fails');
    expect(flaky()).toBe(42);
    expect(calls).toBe(2);
  });
});
